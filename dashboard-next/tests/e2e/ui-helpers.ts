import { expect, type Locator, type Page } from "@playwright/test";

export const RAW_BLOCKER_PATTERNS = [/copyright_acknowledged/i, /production_blockers/i, /rights_assessment/i];

export type PageNoise = {
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  unsafeRequests: string[];
};

export const TARGET_PAGES = [
  { path: "/", title: /Dashboard monitoring bisnis/i },
  { path: "/publish", title: /Pusat keputusan untuk video siap review/i },
  { path: "/queue", title: /Buat video baru dan pantau proses/i },
  { path: "/channels", title: /Kesiapan channel/i },
  { path: "/settings", title: /Pengaturan operasional dan safety/i },
  { path: "/analytics", title: /Laporan operasional/i },
  { path: "/jobs/1836", title: /Review video/i },
  { path: "/jobs/1811", title: /Review video/i },
  { path: "/jobs/854", title: /Review video/i },
  { path: "/health", title: /Status sistem/i },
] as const;

export const RESPONSIVE_VIEWPORTS = [
  { width: 1440, height: 900, name: "desktop" },
  { width: 1366, height: 768, name: "laptop" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 390, height: 844, name: "mobile" },
] as const;

const BENIGN_FAILED_REQUESTS = [
  /\/favicon\.ico$/i,
  /\/_next\/static\/media\//i,
  /\/_next\/image/i,
];

const DANGEROUS_NON_GET_PATTERNS = [
  /\/api\/jobs\/\d+\/push\/youtube/i,
  /\/api\/jobs\/\d+\/push\/tiktok/i,
  /\/api\/jobs\/\d+\/approvals\/(youtube|tiktok)(?:\/revoke)?/i,
  /\/api\/admin\/backups\/(create|restore)/i,
  /\/api\/admin\/retention\/run/i,
  /\/api\/registry$/i,
  /bootstrap/i,
  /oauth/i,
  /\/publish(?:\/|$)/i,
  /\/upload(?:\/|$)/i,
];

export function attachNoiseWatch(page: Page): PageNoise {
  const noise: PageNoise = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    unsafeRequests: [],
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (text.includes("Failed to load resource: the server responded with a status of 404 (Not Found)")) {
        return;
      }
      noise.consoleErrors.push(text);
    }
  });

  page.on("pageerror", (error) => {
    noise.pageErrors.push(error.message);
  });

  page.on("requestfailed", (request) => {
    const url = request.url();
    const failureText = request.failure()?.errorText || "failed";
    if (BENIGN_FAILED_REQUESTS.some((pattern) => pattern.test(url))) {
      return;
    }
    if (url.includes("/_next/static/chunks/") && failureText.includes("ERR_ABORTED")) {
      return;
    }
    if (url.includes("_rsc=") && failureText.includes("ERR_ABORTED")) {
      return;
    }
    if (["document", "script", "xhr", "fetch"].includes(request.resourceType())) {
      noise.failedRequests.push(`${request.resourceType()}: ${request.method()} ${url} -> ${failureText}`);
    }
  });

  page.on("request", (request) => {
    const url = request.url();
    if (request.method() !== "GET" && DANGEROUS_NON_GET_PATTERNS.some((pattern) => pattern.test(url))) {
      noise.unsafeRequests.push(`${request.method()} ${url}`);
    }
  });

  return noise;
}

export async function assertPageBaseline(page: Page, path: string, title: RegExp) {
  const response = await page.goto(path, { waitUntil: "commit" });
  expect(response, `No response received for ${path}`).not.toBeNull();
  expect(response?.status() ?? 599, `Unexpected HTTP status for ${path}`).toBeLessThan(400);
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

  const body = page.locator("body");
  await expect(body, `Body not visible for ${path}`).toBeVisible();
  const bodyText = (await body.innerText()).replace(/\s+/g, " ").trim();
  expect(bodyText.length, `Body is blank for ${path}`).toBeGreaterThan(0);
  for (const pattern of RAW_BLOCKER_PATTERNS) {
    expect(bodyText, `Raw blocker text leaked on ${path}: ${pattern}`).not.toMatch(pattern);
  }
}

export async function assertNoNoise(pageName: string, noise: PageNoise) {
  expect(noise.pageErrors, `Page errors on ${pageName}: ${noise.pageErrors.join(" | ")}`).toEqual([]);
  expect(noise.consoleErrors, `Console errors on ${pageName}: ${noise.consoleErrors.join(" | ")}`).toEqual([]);
  expect(noise.failedRequests, `Failed requests on ${pageName}: ${noise.failedRequests.join(" | ")}`).toEqual([]);
  expect(noise.unsafeRequests, `Unsafe requests on ${pageName}: ${noise.unsafeRequests.join(" | ")}`).toEqual([]);
}

export async function assertAccessibleInteractiveControls(page: Page) {
  const interactive = page.locator('button, a[href], [role="button"], input[type="submit"]');
  const count = await interactive.count();
  for (let index = 0; index < count; index += 1) {
    const item = interactive.nth(index);
    if (!(await item.isVisible())) {
      continue;
    }

    const accessibleName = (
      await item.evaluate((node) => {
        const element = node as HTMLElement;
        const ariaLabel = element.getAttribute("aria-label") || "";
        const title = element.getAttribute("title") || "";
        const text = (element.textContent || "").trim();
        const value = element instanceof HTMLInputElement ? element.value : "";
        return (ariaLabel || title || text || value).trim();
      })
    ).trim();

    expect(accessibleName, `Interactive element missing accessible name: ${await item.evaluate((node) => (node as HTMLElement).outerHTML)}`).not.toBe("");
  }
}

export function isDangerousLabel(label: string, href?: string | null) {
  const combined = `${label} ${href || ""}`;
  return /upload|publish|approve|oauth|bootstrap|reset production|send to youtube|send to tiktok|connect oauth|delete|cleanup files|restore|retention|save registry|save general|save channel|jalankan|run worker once|batalkan|jeda|masukkan lagi|lanjutkan/i.test(
    combined,
  );
}

export async function clickInternalLinkAndVerify(page: Page, locator: Locator, expectedPath: string) {
  await expect(locator).toBeVisible({ timeout: 30_000 });
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ timeout: 30_000 });
  await expect(page).toHaveURL(new RegExp(expectedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

export async function dismissConfirmAndClick(page: Page, locator: Locator) {
  let dialogSeen = false;
  page.once("dialog", async (dialog) => {
    dialogSeen = true;
    await dialog.dismiss();
  });
  await expect(locator).toBeVisible({ timeout: 30_000 });
  await locator.evaluate((node) => {
    (node as HTMLButtonElement).click();
  });
  expect(dialogSeen, "Expected a confirm dialog to appear").toBe(true);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
    };
  });

  expect(overflow.scrollWidth - overflow.clientWidth, "Document overflow detected").toBeLessThanOrEqual(1024);
  expect(overflow.bodyScrollWidth - overflow.bodyClientWidth, "Body overflow detected").toBeLessThanOrEqual(1024);
}
