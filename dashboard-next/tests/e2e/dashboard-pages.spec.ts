import { expect, test, type Page } from "@playwright/test";

const PAGE_PATHS = ["/", "/publish", "/queue", "/channels", "/settings", "/analytics", "/jobs/1836", "/jobs/1811", "/jobs/854"];
const RAW_BLOCKERS = [/copyright_acknowledged/i, /production_blockers/i, /rights_assessment/i];

async function collectPageNoise(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (text.includes("Failed to load resource: the server responded with a status of 404 (Not Found)")) {
        return;
      }
      consoleErrors.push(text);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    const failureText = request.failure()?.errorText || "failed";
    if (url.includes("/favicon.ico") || url.includes("/_next/static/media/")) {
      return;
    }
    if (url.includes("_rsc=") && failureText.includes("ERR_ABORTED")) {
      return;
    }
    if (["document", "script", "xhr", "fetch"].includes(request.resourceType())) {
      failedRequests.push(`${request.resourceType()}: ${url} -> ${failureText}`);
    }
  });

  return { consoleErrors, pageErrors, failedRequests };
}

async function assertPageHealthy(page: Page, path: string) {
  const noise = await collectPageNoise(page);
  const response = await page.goto(path, { waitUntil: "commit" });

  expect(response, `No response received for ${path}`).not.toBeNull();
  expect(response?.status() ?? 599, `Unexpected HTTP status for ${path}`).toBeLessThan(400);

  const body = page.locator("body");
  await expect(body, `Body not visible for ${path}`).toBeVisible();
  await page.waitForTimeout(300);

  const bodyText = (await body.innerText()).replace(/\s+/g, " ").trim();
  expect(bodyText.length, `Body is blank for ${path}`).toBeGreaterThan(0);
  for (const pattern of RAW_BLOCKERS) {
    expect(bodyText, `Raw blocker text leaked on ${path}: ${pattern}`).not.toMatch(pattern);
  }

  expect(noise.pageErrors, `Page errors on ${path}: ${noise.pageErrors.join(" | ")}`).toEqual([]);
  expect(noise.consoleErrors, `Console errors on ${path}: ${noise.consoleErrors.join(" | ")}`).toEqual([]);
  expect(noise.failedRequests, `Failed requests on ${path}: ${noise.failedRequests.join(" | ")}`).toEqual([]);
}

for (const path of PAGE_PATHS) {
  test(`dashboard page loads cleanly: ${path}`, async ({ page }) => {
    await assertPageHealthy(page, path);
  });
}
