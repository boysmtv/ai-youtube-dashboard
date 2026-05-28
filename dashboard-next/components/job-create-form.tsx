import type { RegistryPayload } from "../lib/engine-types";
import { createDashboardJob } from "../app/jobs/actions";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import { channelProfileLabel } from "../lib/business-copy";

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
  const safeChannel = selectedChannel || registry.channels[0];
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
      <input name="niche" type="hidden" defaultValue={safeChannel?.niche || ""} />
      <input name="language" type="hidden" defaultValue={safeChannel?.language || ""} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Simpan rencana video ke antrian</h3>
          <p className="mt-1 text-sm text-gray-500">Pilih channel. Niche, caption, dan hashtag mengikuti profil channel otomatis.</p>
        </div>
        <ConfirmSubmitButton className="px-5 py-3 text-sm" message="Simpan video baru ke antrian?" pendingText="Saving...">
          Simpan Video
        </ConfirmSubmitButton>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Pilih Channel
          <select name="channel_id" required defaultValue={safeChannel?.id}>
            {registry.channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.display_name || channel.id}
              </option>
            ))}
          </select>
        </label>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p className="ta-label text-brand-600">Profil Channel</p>
          <p className="mt-2">Channel ini memakai profil {channelProfileLabel(safeChannel)}.</p>
          <p className="mt-1 text-xs text-gray-500">Caption, hashtag, dan gaya komunikasi mengikuti profil channel.</p>
          <p className="mt-2 text-xs text-gray-500">Profil bisnis siap dipakai untuk antrian baru.</p>
        </div>
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
              <h4 className="mt-1 text-base font-semibold text-gray-900">Opsional untuk override khusus</h4>
            </div>
            <span className="ta-status bg-white text-gray-700">Tutup / buka</span>
          </div>
        </summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Override kategori
            <input name="niche_override" placeholder="Opsional, hanya untuk pengecualian" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Override bahasa
            <input name="language_override" placeholder="Opsional, hanya untuk pengecualian" />
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
