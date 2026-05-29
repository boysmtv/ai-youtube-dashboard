import { expect, test } from "@playwright/test";
import {
  assertNoNoise,
  assertPageBaseline,
  attachNoiseWatch,
  TARGET_PAGES,
} from "./ui-helpers";

test.describe("forms and validation", () => {
  test("queue create form accepts values and rejects empty required channel", async ({ page }) => {
    const noise = attachNoiseWatch(page);
    await assertPageBaseline(page, "/queue", /Buat video baru dan pantau proses/i);

    const createForm = page.locator("#create-video");
    const channelSelect = createForm.locator('select[name="channel_id"]');
    const approvalReason = createForm.locator('textarea[name="approval_reason"]');
    const nicheOverride = createForm.locator('input[name="niche_override"]');
    const languageOverride = createForm.locator('input[name="language_override"]');

    if (!(await channelSelect.isVisible())) {
      await assertNoNoise("/queue forms", noise);
      return;
    }

    await expect(channelSelect).toBeVisible();
    await expect(channelSelect).toHaveValue(/.+/);
    await channelSelect.evaluate((node) => {
      const select = node as HTMLSelectElement;
      select.value = "";
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(await channelSelect.evaluate((node) => (node as HTMLSelectElement).checkValidity())).toBe(false);
    await channelSelect.evaluate((node) => {
      const select = node as HTMLSelectElement;
      select.value = (select.options[0]?.value || "").trim();
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(await channelSelect.evaluate((node) => (node as HTMLSelectElement).checkValidity())).toBe(true);

    await approvalReason.fill("QA dry-run reason");
    await expect(approvalReason).toHaveValue("QA dry-run reason");
    const advanced = createForm.locator("details");
    await advanced.locator("summary").click();
    await expect(advanced).toHaveAttribute("open", "");
    await nicheOverride.fill("testing niche override");
    await expect(nicheOverride).toHaveValue("testing niche override");
    await languageOverride.fill("id-ID");
    await expect(languageOverride).toHaveValue("id-ID");
    await advanced.locator("summary").click();

    await assertNoNoise("/queue forms", noise);
  });

  test("settings forms keep numeric validation and toggles intact", async ({ page }) => {
    const noise = attachNoiseWatch(page);
    await assertPageBaseline(page, "/settings", /Pengaturan operasional dan safety/i);

    const coreForm = page.locator("form").first();
    const numericField = page.locator('input[name="worker_max_active_jobs"]').first();
    const timezoneField = page.locator('input[name="timezone"]').first();
    const retentionToggle = page.locator('input[name="retention_enabled"]').first();
    const uploadGateToggle = page.locator('input[name="upload_approval_enabled"]').first();

    await timezoneField.fill("Asia/Bangkok");
    await expect(timezoneField).toHaveValue("Asia/Bangkok");

    await numericField.fill("12");
    await expect(numericField).toHaveValue("12");
    await numericField.fill("12");
    expect(await numericField.evaluate((node) => (node as HTMLInputElement).checkValidity())).toBe(true);

    const initialRetention = await retentionToggle.isChecked();
    await retentionToggle.click();
    expect(await retentionToggle.isChecked()).toBe(!initialRetention);
    await retentionToggle.click();
    expect(await retentionToggle.isChecked()).toBe(initialRetention);

    const initialUploadGate = await uploadGateToggle.isChecked();
    await uploadGateToggle.click();
    expect(await uploadGateToggle.isChecked()).toBe(!initialUploadGate);
    await uploadGateToggle.click();
    expect(await uploadGateToggle.isChecked()).toBe(initialUploadGate);

    await page.locator("details").first().locator("summary").click();
    await expect(page.locator("details").first()).toHaveAttribute("open", "");
    await page.locator("details").first().locator("summary").click();

    await expect(coreForm).toBeVisible();
    await assertNoNoise("/settings forms", noise);
  });

  for (const path of ["/jobs/1836", "/jobs/1811", "/jobs/854"] as const) {
    test(`job detail review form stays editable: ${path}`, async ({ page }) => {
      const noise = attachNoiseWatch(page);
      await assertPageBaseline(page, path, /Review video/i);

      const titleField = page.locator('input[name="final_title"]').first();
      const captionField = page.locator('textarea[name="final_caption"]').first();
      const descriptionField = page.locator('textarea[name="final_description"]').first();
      const hashtagField = page.locator('input[name="final_hashtags"]').first();
      const reviewModeRadios = page.locator('input[type="radio"][name="selected_upload_mode"]');
      const aiDisclosure = page.locator('input[name="ai_disclosure_acknowledged"]').first();
      const overrideDisclosure = page.locator('input[name="ai_disclosure_override"]').first();
      const reviewNotes = page.locator('textarea[name="operator_review_notes"]').first();

      if (!(await titleField.isVisible())) {
        await assertNoNoise(`job forms ${path}`, noise);
        return;
      }

      await titleField.fill("QA Title");
      await expect(titleField).toHaveValue("QA Title");
      await captionField.fill("QA caption");
      await expect(captionField).toHaveValue("QA caption");
      await descriptionField.fill("QA description");
      await expect(descriptionField).toHaveValue("QA description");
      await hashtagField.fill("#qa, #dryrun");
      await expect(hashtagField).toHaveValue("#qa, #dryrun");
      await reviewNotes.fill("QA review note");
      await expect(reviewNotes).toHaveValue("QA review note");

      const radioCount = await reviewModeRadios.count();
      for (let index = 0; index < radioCount; index += 1) {
        const radio = reviewModeRadios.nth(index);
        if (!(await radio.isVisible()) || !(await radio.isEnabled())) {
          continue;
        }
        await radio.click();
        expect(await radio.isChecked()).toBe(true);
        break;
      }

      const initialAck = await aiDisclosure.isChecked();
      await aiDisclosure.click();
      expect(await aiDisclosure.isChecked()).toBe(!initialAck);
      await aiDisclosure.click();
      expect(await aiDisclosure.isChecked()).toBe(initialAck);

      const initialOverride = await overrideDisclosure.isChecked();
      await overrideDisclosure.click();
      expect(await overrideDisclosure.isChecked()).toBe(!initialOverride);
      await overrideDisclosure.click();
      expect(await overrideDisclosure.isChecked()).toBe(initialOverride);

      const technicalDetails = page.locator("#detail-teknis");
      await page.getByRole("button", { name: "Muat Detail Teknis" }).click();
      await expect(technicalDetails).toBeVisible();
      await expect(technicalDetails.getByText("Manifest", { exact: true })).toBeVisible();

      await assertNoNoise(`job forms ${path}`, noise);
    });
  }
});
