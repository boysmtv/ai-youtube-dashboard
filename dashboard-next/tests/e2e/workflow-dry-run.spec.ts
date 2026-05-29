import { expect, test } from "@playwright/test";
import {
  assertNoNoise,
  assertPageBaseline,
  attachNoiseWatch,
  dismissConfirmAndClick,
} from "./ui-helpers";

test.describe("workflow dry-run", () => {
  test("dangerous actions stop at confirmation and never emit unsafe requests", async ({ page }) => {
    test.setTimeout(240_000);
    const noise = attachNoiseWatch(page);

    await assertPageBaseline(page, "/queue", /Buat video baru dan pantau proses/i);
    await dismissConfirmAndClick(page, page.getByRole("button", { name: /Simpan Video/i }).first());

    await page.goto("/settings", { waitUntil: "commit" });
    await assertPageBaseline(page, "/settings", /Pengaturan operasional dan safety/i);
    await dismissConfirmAndClick(page, page.getByRole("button", { name: /Simpan umum/i }).first());
    await page.getByRole("button", { name: "Backup", exact: true }).click();
    await dismissConfirmAndClick(page, page.getByRole("button", { name: /Backup all/i }).first());

    const channelSaveButtons = page.getByRole("button", { name: "Simpan channel" });
    if (await channelSaveButtons.first().isVisible()) {
      await dismissConfirmAndClick(page, channelSaveButtons.first());
    }

    const restoreButtons = page.getByRole("button", { name: "Restore" });
    if (await restoreButtons.first().isVisible()) {
      await dismissConfirmAndClick(page, restoreButtons.first());
    }

    await page.goto("/jobs/1836", { waitUntil: "commit" });
    await assertPageBaseline(page, "/jobs/1836", /Review video/i);
    const dangerButtons = [
      "Jalankan",
      "Jeda",
      "Lanjutkan",
      "Masukkan lagi",
      "Batalkan",
    ];
    for (const label of dangerButtons) {
      const button = page.getByRole("button", { name: label }).first();
      if (await button.isVisible()) {
        await dismissConfirmAndClick(page, button);
      }
    }

    await page.goto("/worker", { waitUntil: "commit" }).catch(() => {});
    if (page.url().includes("/worker")) {
      await assertPageBaseline(page, "/worker", /Kontrol worker/i);
      await dismissConfirmAndClick(page, page.getByRole("button", { name: "Run worker once" }));
    }

    expect(noise.unsafeRequests, `Unsafe requests were emitted: ${noise.unsafeRequests.join(" | ")}`).toEqual([]);
    await assertNoNoise("workflow dry-run", noise);
  });
});
