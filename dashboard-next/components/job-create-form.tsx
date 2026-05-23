import type { RegistryPayload, UploadGuard } from "../lib/engine-types";
import { createDashboardJob } from "../app/jobs/actions";
import { ConfirmSubmitButton } from "./confirm-submit-button";

export function JobCreateForm({
  registry,
  uploadGuard,
  canOperate,
}: Readonly<{
  registry: RegistryPayload;
  uploadGuard: UploadGuard;
  canOperate: boolean;
}>) {
  const firstChannel = registry.channels.find((channel) => channel.enabled) || registry.channels[0];

  if (!canOperate) {
    return (
      <section className="ta-panel p-5">
        <p className="ta-label text-brand-600">Read only</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Job creation restricted.</h3>
        <p className="mt-2 text-sm text-gray-500">Viewer accounts can monitor queues and logs, but only operator/admin accounts can create or run jobs.</p>
      </section>
    );
  }

  return (
    <form id="create-video" action={createDashboardJob} className="ta-panel p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ta-label text-brand-600">Buat Video Baru</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Simpan job produksi</h3>
          <p className="mt-1 text-sm text-gray-500">Semua parameter disimpan dulu ke database, lalu diambil worker engine.</p>
        </div>
        <ConfirmSubmitButton className="px-5 py-3 text-sm" message="Create this parameterized job in the engine database?">
          Simpan Job
        </ConfirmSubmitButton>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">
          Channel tujuan
          <select name="channel_id" required defaultValue={firstChannel?.id}>
            {registry.channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.display_name || channel.id}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Jadwal publish
          <input name="publish_at" required placeholder="2026-05-23T08:00:00+07:00" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Maks percobaan
          <input name="max_retries" type="number" min="0" max="10" placeholder="3" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Topik / niche
          <input name="niche" placeholder={firstChannel?.niche || "football"} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Bahasa
          <input name="language" placeholder={firstChannel?.language || "id"} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Persetujuan upload
          <input name="upload_approval" placeholder={uploadGuard.confirmation_text} />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Operator
          <input name="approval_operator_name" placeholder="operator name" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Alasan
          <input name="approval_reason" placeholder={uploadGuard.reason} />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-gray-700">
        <label className="flex items-center gap-2">
          <input className="ta-check" name="enable_upload" type="checkbox" />
          Aktifkan upload
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="require_credentials" type="checkbox" />
          Wajib kredensial
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="keep_downloads" type="checkbox" />
          Simpan unduhan
        </label>
      </div>
    </form>
  );
}
