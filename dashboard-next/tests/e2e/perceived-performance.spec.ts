import { expect, test } from "@playwright/test";
import { assertNoNoise, assertPageBaseline, attachNoiseWatch } from "./ui-helpers";

async function measureInteraction(
  label: string,
  maxMs: number,
  action: () => Promise<void>,
  assertion: () => Promise<void>,
) {
  const start = performance.now();
  await action();
  await assertion();
  const elapsed = performance.now() - start;
  expect(elapsed, `${label} took ${elapsed.toFixed(0)}ms`).toBeLessThanOrEqual(maxMs);
}

function trackUnsafeMutationRequests(page: import("@playwright/test").Page) {
  const unsafeRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    const method = request.method();
    if (method !== "GET" && /\/api\/jobs\/\d+\/(push\/youtube|push\/tiktok|approvals\/(youtube|tiktok)(?:\/revoke)?|requeue|cancel|pause|resume|retry-upload)|\/api\/admin\/backups\/(create|restore)|\/api\/admin\/retention\/run|oauth|bootstrap/i.test(url)) {
      unsafeRequests.push(`${method} ${url}`);
    }
  });
  return unsafeRequests;
}

test.describe("perceived performance", () => {
  test("channels, settings, analytics, jobs, and publish remain snappy", async ({ page }) => {
    const noise = attachNoiseWatch(page);
    const unsafeRequests = trackUnsafeMutationRequests(page);

    await assertPageBaseline(page, "/channels", /Kesiapan channel/i);
    await measureInteraction(
      "/channels detail toggle",
      1200,
      async () => {
        const firstChannel = page.locator("article[id^='channel-']").first();
        await firstChannel.scrollIntoViewIfNeeded();
        await firstChannel.getByRole("button", { name: /Buka detail|Sembunyikan detail/ }).click();
      },
      async () => {
        await expect(page.getByRole("button", { name: "Sembunyikan detail" }).first()).toBeVisible();
        await expect(page.getByText("Detail Teknis").first()).toBeVisible();
      },
    );

    await measureInteraction(
      "/channels navigation",
      700,
      async () => {
        await page.getByRole("link", { name: /Buka pengaturan/i }).first().click();
      },
      async () => {
        await expect(page).toHaveURL(/\/settings/);
      },
    );

    await measureInteraction(
      "/settings backup tab",
      700,
      async () => {
        await page.getByRole("button", { name: "Backup", exact: true }).click();
      },
      async () => {
        await expect(page.getByText("Backup and restore")).toBeVisible();
      },
    );

    await measureInteraction(
      "/settings registry tab",
      700,
      async () => {
        await page.getByRole("button", { name: "Registry", exact: true }).click();
      },
      async () => {
        await expect(page.getByText("Registry JSON")).toBeVisible();
        await expect(page.locator('textarea[name="registry_json"]')).toBeVisible();
      },
    );

    await page.goto("/analytics", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    await measureInteraction(
      "/analytics filter",
      700,
      async () => {
        await page.getByLabel("Search publish history").fill("Video");
      },
      async () => {
        await expect(page.getByLabel("Search publish history")).toHaveValue("Video");
      },
    );

    await page.goto("/jobs/1836", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    await measureInteraction(
      "/jobs technical open",
      1200,
      async () => {
        await page.getByRole("button", { name: "Muat Detail Teknis" }).click();
      },
      async () => {
        await expect(page.locator("#detail-teknis")).toBeVisible();
        await expect(page.locator("#detail-teknis").getByText("Manifest", { exact: true })).toBeVisible({ timeout: 30_000 });
      },
    );

    await page.goto("/publish", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    await measureInteraction(
      "/publish sort",
      500,
      async () => {
        await page.getByRole("button", { name: "Video" }).first().click();
      },
      async () => {
        await expect(page.getByRole("button", { name: "Status Upload" }).first()).toBeVisible();
      },
    );
    await measureInteraction(
      "/publish search",
      700,
      async () => {
        await page.getByLabel("Search publish history").fill("Video");
      },
      async () => {
        await expect(page.getByLabel("Search publish history")).toHaveValue("Video");
      },
    );

    expect(unsafeRequests, `Unsafe mutation requests were sent: ${unsafeRequests.join(" | ")}`).toEqual([]);
    await assertNoNoise("perceived performance", noise);
  });
});
