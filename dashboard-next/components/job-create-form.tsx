import type { RegistryPayload } from "../lib/engine-types";
import { createDashboardJob } from "../app/jobs/actions";
import { ConfirmSubmitButton } from "./confirm-submit-button";

function defaultPublishAt() {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 16);
}

export function JobCreateForm({
  registry,
  uploadGuard,
  canOperate,
  defaultChannelId,
}: Readonly<{
  registry: RegistryPayload;
  uploadGuard: { confirmation_text: string; reason: string };
  canOperate: boolean;
  defaultChannelId?: string;
}>) {
  const selectedChannel =
    registry.channels.find((channel) => channel.id === defaultChannelId) ||
    registry.channels.find((channel) => channel.enabled) ||
    registry.channels[0];
  const internalPublishAt = defaultPublishAt();

  if (!canOperate) {
    return (
      <section className="ta-panel p-5">
        <p className="ta-label text-brand-600">Read only</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Pembuatan video dibatasi.</h3>
        <p className="mt-2 text-sm text-gray-500">Akun viewer hanya bisa memantau antrian, hasil, dan laporan. Buat video tersedia untuk operator/admin.</p>
      </section>
    );
  }

  return (
    <form id="create-video" action={createDashboardJob} className="ta-panel p-5">
      <input name="publish_at" type="hidden" defaultValue={internalPublishAt} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ta-label text-brand-600">Step 1 of 6</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Simpan rencana video ke antrian</h3>
          <p className="mt-1 text-sm text-gray-500">Pilih channel, ide, dan gaya caption. Detail teknis tetap disembunyikan dari form utama.</p>
        </div>
        <ConfirmSubmitButton className="px-5 py-3 text-sm" message="Simpan video baru ke antrian?" pendingText="Saving...">
          Simpan Video
        </ConfirmSubmitButton>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Pilih Channel
          <select name="channel_id" required defaultValue={selectedChannel?.id}>
            {registry.channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.display_name || channel.id}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Ide / Topik Video
          <input name="niche" defaultValue={selectedChannel?.niche} placeholder="football, gaming, viral story" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Gaya Caption
          <input name="language" defaultValue={selectedChannel?.language} placeholder="id" />
        </label>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <p className="ta-label text-brand-600">Sumber Video</p>
        <p className="mt-2">Sumber video dikelola dari channel yang dipilih dan sumber kurasi yang sudah disiapkan sistem. Operator tidak perlu mengatur detail sumber di sini.</p>
      </div>

      <label className="mt-4 grid gap-2 text-sm font-semibold">
        Catatan Operator
        <textarea
          name="approval_reason"
          defaultValue={uploadGuard.reason}
          placeholder="Tambahkan catatan singkat untuk tim review."
          rows={3}
        />
      </label>

      <details className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="ta-label text-brand-600">Pengaturan Lanjutan</p>
              <h4 className="mt-1 text-base font-semibold text-gray-900">Hanya jika perlu kontrol teknis</h4>
            </div>
            <span className="ta-status bg-white text-gray-700">Tutup / buka</span>
          </div>
        </summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Target Kerja Internal
            <input readOnly value={internalPublishAt} />
          </label>
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-600">
            <p>Pengaturan teknis lain tetap dikelola oleh sistem dan detail review.</p>
            <p className="mt-2">Form utama hanya menampilkan input yang dibutuhkan operator harian.</p>
          </div>
        </div>
      </details>
    </form>
  );
}
