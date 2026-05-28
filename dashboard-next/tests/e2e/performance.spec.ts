import { expect, test, type Page } from "@playwright/test";

const PAGE_PATHS = ["/", "/publish", "/queue", "/analytics", "/jobs/1836"];
const MAX_PAGE_LOAD_MS = 5_000;

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
  for (const path of PAGE_PATHS) {
    test(`loads within budget: ${path}`, async ({ page }) => {
      const noise = await observePage(page);
      const started = Date.now();
      const response = await page.goto(path, { waitUntil: "commit" });
      const elapsedMs = Date.now() - started;
      console.log(`${path} loaded in ${elapsedMs}ms`);

      expect(response, `No response received for ${path}`).not.toBeNull();
      expect(response?.status() ?? 599, `Unexpected HTTP status for ${path}`).toBeLessThan(400);
      expect(elapsedMs, `Page load too slow for ${path}`).toBeLessThanOrEqual(MAX_PAGE_LOAD_MS);

      const body = page.locator("body");
      await expect(body).toBeVisible();
      await page.waitForTimeout(300);
      const bodyText = (await body.innerText()).replace(/\s+/g, " ").trim();
      expect(bodyText.length, `Body is blank for ${path}`).toBeGreaterThan(0);

      expect(noise.pageErrors, `Page errors on ${path}: ${noise.pageErrors.join(" | ")}`).toEqual([]);
      expect(noise.consoleErrors, `Console errors on ${path}: ${noise.consoleErrors.join(" | ")}`).toEqual([]);
      expect(noise.failedRequests, `Failed requests on ${path}: ${noise.failedRequests.join(" | ")}`).toEqual([]);
    });
  }
});
