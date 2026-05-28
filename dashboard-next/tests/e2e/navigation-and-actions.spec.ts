import { expect, test } from "@playwright/test";
import {
  assertNoNoise,
  assertPageBaseline,
  attachNoiseWatch,
  RESPONSIVE_VIEWPORTS,
  expectNoHorizontalOverflow,
  TARGET_PAGES,
} from "./ui-helpers";

async function openAndReturn(page: import("@playwright/test").Page, href: string, expectedPath: RegExp) {
  await page.getByRole("link", { name: new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }).first().click().catch(async () => {
    await page.locator(`a[href="${href}"]`).first().click();
  });
  await expect(page).toHaveURL(expectedPath);
  await page.goBack();
}

test.describe("navigation and actions", () => {
  test("sidebar, header, direct URLs, reload, and back-forward stay intact", async ({ page }) => {
    const noise = attachNoiseWatch(page);
    await assertPageBaseline(page, "/", /Dashboard monitoring bisnis/i);

    const productionLink = page.getByRole("link", { name: "Produksi Video" }).first();
    if (await productionLink.isVisible()) {
      await productionLink.click();
      await expect(page).toHaveURL(/\/queue/);
      await page.reload();
      await expect(page.getByRole("heading", { name: /Buat video baru dan pantau proses/i }).first()).toBeVisible();
      await page.goBack();
      await page.goForward();
      await expect(page.getByRole("heading", { name: /Buat video baru dan pantau proses/i }).first()).toBeVisible();
    }

    const targets = [
      { link: "Review & Upload", path: /\/publish/ },
      { link: "Channel", path: /\/channels/ },
      { link: "Laporan", path: /\/analytics/ },
      { link: "Pengaturan", path: /\/settings/ },
      { link: "Kesehatan Sistem", path: /\/health/ },
    ] as const;

    for (const target of targets) {
      const link = page.getByRole("link", { name: target.link }).first();
      if (await link.isVisible()) {
        await link.click();
        await expect(page).toHaveURL(target.path);
        await expect(page.getByRole("heading").first()).toBeVisible();
        await page.goBack();
        await expect(page).toHaveURL(/\/queue|\/$/);
      }
    }

    await page.goto("/publish", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/queue", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/channels", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/settings", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/analytics", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/jobs/1836", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();
    await page.goto("/health", { waitUntil: "commit" });
    await expect(page.locator("body")).toBeVisible();

    await assertNoNoise("navigation", noise);
  });

  test("responsive layouts remain usable on common viewports", async ({ page }) => {
    test.setTimeout(420_000);
    const pages = ["/", "/publish", "/queue", "/settings", "/analytics", "/jobs/1836"] as const;

    for (const viewport of RESPONSIVE_VIEWPORTS) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const path of pages) {
        const noise = attachNoiseWatch(page);
        await assertPageBaseline(page, path, TARGET_PAGES.find((item) => item.path === path)!.title);
        await expectNoHorizontalOverflow(page);
        await assertNoNoise(`${viewport.name}:${path}`, noise);
      }
    }
  });
});
