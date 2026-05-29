import { expect, test } from "@playwright/test";
import {
  assertAccessibleInteractiveControls,
  assertNoNoise,
  assertPageBaseline,
  attachNoiseWatch,
  TARGET_PAGES,
} from "./ui-helpers";

async function clickAndReturn(page: import("@playwright/test").Page, locator: import("@playwright/test").Locator, expectedPath: string) {
  await expect(locator).toBeVisible({ timeout: 30_000 });
  await locator.scrollIntoViewIfNeeded();
  await locator.click({ timeout: 30_000 });
  await expect(page).toHaveURL(new RegExp(expectedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  await page.goBack();
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await expect(page.locator("body")).toBeVisible();
}

async function scanVisibleLinks(page: import("@playwright/test").Page) {
  const links = page.locator("a[href]");
  const count = await links.count();
  for (let index = 0; index < count; index += 1) {
    const link = links.nth(index);
    if (!(await link.isVisible())) {
      continue;
    }
    const href = (await link.getAttribute("href")) || "";
    const label = (await link.innerText()).replace(/\s+/g, " ").trim() || href;
    expect(label, `Link without accessible label on ${page.url()}: ${href}`).not.toBe("");
  }
}

test.describe("ui interactions", () => {
  for (const pageCase of TARGET_PAGES) {
    test(`page interactions stay healthy: ${pageCase.path}`, async ({ page }) => {
      const noise = attachNoiseWatch(page);
      await assertPageBaseline(page, pageCase.path, pageCase.title);
      await assertAccessibleInteractiveControls(page);
      await scanVisibleLinks(page);

      switch (pageCase.path) {
        case "/": {
          const publishNav = page.getByRole("link", { name: "Review & Upload" }).first();
          if (await publishNav.isVisible()) {
            await clickAndReturn(page, publishNav, "/publish");
          }
          const queueNav = page.getByRole("link", { name: "Produksi Video" }).first();
          if (await queueNav.isVisible()) {
            await clickAndReturn(page, queueNav, "/queue");
          }
          const channelsNav = page.getByRole("link", { name: "Channel" }).first();
          if (await channelsNav.isVisible()) {
            await clickAndReturn(page, channelsNav, "/channels");
          }
          const analyticsNav = page.getByRole("link", { name: "Laporan" }).first();
          if (await analyticsNav.isVisible()) {
            await clickAndReturn(page, analyticsNav, "/analytics");
          }
          const healthNav = page.getByRole("link", { name: "Kesehatan Sistem" }).first();
          if (await healthNav.isVisible()) {
            await clickAndReturn(page, healthNav, "/health");
          }
          const firstRow = page.locator("table tbody tr").first();
          if (await firstRow.isVisible()) {
            await firstRow.click();
            await expect(page).toHaveURL(/\/jobs\/\d+/);
            await page.goBack();
          }
          break;
        }
        case "/publish": {
          const queueLink = page.getByRole("link", { name: "Lihat Antrian" }).first();
          if (await queueLink.isVisible()) {
            await clickAndReturn(page, queueLink, "/queue");
          }
          const channelLink = page.getByRole("link", { name: "Cek Channel" }).first();
          if (await channelLink.isVisible()) {
            await clickAndReturn(page, channelLink, "/channels");
          }
          const firstQueueLink = page.locator('a[href^="/jobs/"]').first();
          if (await firstQueueLink.isVisible()) {
            await firstQueueLink.click();
            await expect(page).toHaveURL(/\/jobs\/\d+/);
            await page.goBack();
          }
          const videoSort = page.getByRole("button", { name: "Video" }).first();
          if (await videoSort.isVisible()) {
            await videoSort.click();
          }
          const statusSort = page.getByRole("button", { name: "Status Upload" }).first();
          if (await statusSort.isVisible()) {
            await statusSort.click();
          }
          const uploadSort = page.getByRole("button", { name: "Riwayat Upload" }).first();
          if (await uploadSort.isVisible()) {
            await uploadSort.click();
          }
          const noteSort = page.getByRole("button", { name: "Catatan" }).first();
          if (await noteSort.isVisible()) {
            await noteSort.click();
          }
          break;
        }
        case "/queue": {
          const search = page.getByLabel("Search jobs");
          await expect(search).toBeVisible({ timeout: 30_000 });
          await search.fill("1836");
          await expect(search).toHaveValue("1836");
          await page.getByRole("link", { name: "Semua" }).click();
          await page.getByRole("link", { name: "Menunggu", exact: true }).click();
          await page.getByRole("link", { name: "Sedang Diproses" }).click();
          await page.getByRole("link", { name: "Menunggu Approval" }).click();
          const row = page.locator("table tbody tr").first();
          if (await row.isVisible()) {
            await row.click();
            await expect(page).toHaveURL(/\/jobs\/\d+/);
            await page.goBack();
          }
          break;
        }
        case "/channels": {
          await clickAndReturn(page, page.getByRole("link", { name: /Buka Pengaturan/i }).first(), "/settings");
          const firstChannel = page.locator("article[id^='channel-']").first();
          await firstChannel.getByRole("link", { name: "Buat Video", exact: true }).first().click();
          await expect(page).toHaveURL(/\/queue\?channel_id=/);
          await page.goBack();
          await firstChannel.getByRole("link", { name: "Lihat Video", exact: true }).first().click();
          await expect(page).toHaveURL(/\/queue\?channel_id=/);
          await page.goBack();
          await firstChannel.getByRole("button", { name: "Buka detail", exact: true }).click();
          await expect(firstChannel.getByRole("button", { name: "Sembunyikan detail", exact: true })).toBeVisible();
          break;
        }
        case "/settings": {
          await clickAndReturn(page, page.getByRole("link", { name: "Cek Copyright & Safety" }).first(), "/publish");
          await clickAndReturn(page, page.getByRole("link", { name: "Cek Channel" }).first(), "/channels");
          await page.locator("details").first().locator("summary").click();
          await expect(page.locator("details").first()).toHaveAttribute("open", "");
          break;
        }
        case "/analytics": {
          const historyNav = page.getByRole("link", { name: "Lihat Riwayat Upload" }).first();
          if (await historyNav.isVisible()) {
            await clickAndReturn(page, historyNav, "/publish");
          }
          const queueNav = page.getByRole("link", { name: "Lihat Antrian" }).first();
          if (await queueNav.isVisible()) {
            await clickAndReturn(page, queueNav, "/queue");
          }
          const historySearch = page.getByLabel("Search publish history");
          if (await historySearch.isVisible()) {
            await historySearch.fill("Video");
            await expect(historySearch).toHaveValue("Video");
            await page.getByRole("button", { name: "Video" }).first().click();
            await page.getByRole("button", { name: "Status Upload" }).first().click();
            const historyRow = page.locator("table tbody tr").first();
            if (await historyRow.isVisible()) {
              await historyRow.click();
              await expect(page).toHaveURL(/\/jobs\/\d+/);
              await page.goBack();
            }
          }
          break;
        }
        case "/jobs/1836":
        case "/jobs/1811":
        case "/jobs/854": {
          const backToQueue = page.getByRole("link", { name: "Kembali ke Antrian" }).first();
          if (await backToQueue.isVisible()) {
            await clickAndReturn(page, backToQueue, "/queue");
          }
          const reviewLink = page.getByRole("link", { name: "Review & Upload" }).first();
          if (await reviewLink.isVisible()) {
            await clickAndReturn(page, reviewLink, "/publish");
          }
          const reviewAnchor = page.getByRole("link", { name: "Cek Detail Sistem" }).first();
          if (await reviewAnchor.isVisible()) {
            await reviewAnchor.click();
            await expect(page.locator("#review")).toBeVisible();
          }
          const technicalLink = page.getByRole("link", { name: "Lihat Detail Teknis" }).first();
          if (await technicalLink.isVisible()) {
            await technicalLink.click();
          }
          const detailToggle = page.locator("#detail-teknis summary");
          if (await detailToggle.isVisible()) {
            await detailToggle.click();
            await expect(page.locator("#detail-teknis")).toHaveAttribute("open", "");
          }
          break;
        }
        case "/health": {
          const openChannels = page.getByRole("link", { name: "Open channels" }).first();
          if (await openChannels.isVisible()) {
            await openChannels.click();
            await expect(page).toHaveURL(/\/channels/);
            await page.goBack();
          }
          break;
        }
        default:
          break;
      }

      await assertNoNoise(pageCase.path, noise);
    });
  }
});
