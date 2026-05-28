import { expect, test, type Page } from "@playwright/test";

const PAGE_CASES = [
  { path: "/", maxLoadMs: 1_500 },
  { path: "/publish", maxLoadMs: 2_500 },
  { path: "/queue", maxLoadMs: 2_500 },
  { path: "/channels", maxLoadMs: 2_500 },
  { path: "/settings", maxLoadMs: 2_500 },
  { path: "/analytics", maxLoadMs: 2_500 },
  { path: "/jobs/1836", maxLoadMs: 2_500 },
  { path: "/jobs/1811", maxLoadMs: 2_500 },
  { path: "/jobs/854", maxLoadMs: 2_500 },
  { path: "/health", maxLoadMs: 2_500 },
];

async function observePage(page: Page) {
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

test.describe("dashboard performance", () => {
  for (const pageCase of PAGE_CASES) {
    test(`loads within budget: ${pageCase.path}`, async ({ page }) => {
      const noise = await observePage(page);
      const started = Date.now();
      const response = await page.goto(pageCase.path, { waitUntil: "commit" });
      const primaryLocator = page.locator("main").first();
      await expect(primaryLocator, `Primary content not visible for ${pageCase.path}`).toBeVisible({ timeout: pageCase.maxLoadMs });
      const elapsedMs = Date.now() - started;
      console.log(`${pageCase.path} loaded in ${elapsedMs}ms`);

      expect(response, `No response received for ${pageCase.path}`).not.toBeNull();
      expect(response?.status() ?? 599, `Unexpected HTTP status for ${pageCase.path}`).toBeLessThan(400);
      expect(elapsedMs, `Page load too slow for ${pageCase.path}`).toBeLessThanOrEqual(pageCase.maxLoadMs);

      const body = page.locator("body");
      await expect(body).toBeVisible();
      await page.waitForTimeout(300);
      const bodyText = (await body.innerText()).replace(/\s+/g, " ").trim();
      expect(bodyText.length, `Body is blank for ${pageCase.path}`).toBeGreaterThan(0);

      expect(bodyText, `Raw blocker text leaked on ${pageCase.path}`).not.toMatch(/copyright_acknowledged|production_blockers|rights_assessment/i);
      expect(noise.pageErrors, `Page errors on ${pageCase.path}: ${noise.pageErrors.join(" | ")}`).toEqual([]);
      expect(noise.consoleErrors, `Console errors on ${pageCase.path}: ${noise.consoleErrors.join(" | ")}`).toEqual([]);
      expect(noise.failedRequests, `Failed requests on ${pageCase.path}: ${noise.failedRequests.join(" | ")}`).toEqual([]);
    });
  }
});
