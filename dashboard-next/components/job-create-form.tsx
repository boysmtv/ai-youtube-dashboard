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
}: Readonly<{
  registry: RegistryPayload;
  uploadGuard: { confirmation_text: string; reason: string };
  canOperate: boolean;
}>) {
  const firstChannel = registry.channels.find((channel) => channel.enabled) || registry.channels[0];

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="ta-label text-brand-600">Buat Video</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Simpan rencana video ke antrian</h3>
          <p className="mt-1 text-sm text-gray-500">Form ini menyimpan rencana video terlebih dulu. Upload private hanya diproses dari halaman Review & Upload.</p>
        </div>
        <ConfirmSubmitButton className="px-5 py-3 text-sm" message="Simpan video baru ke antrian?" pendingText="Saving...">
          Simpan Video
        </ConfirmSubmitButton>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Pilih Channel
          <select name="channel_id" required defaultValue={firstChannel?.id}>
            {registry.channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.display_name || channel.id}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Target Waktu
          <input name="publish_at" required defaultValue={defaultPublishAt()} placeholder="2026-05-27T09:00" />
          <span className="text-xs font-normal text-gray-500">Waktu ini dipakai sebagai target kerja, bukan jadwal upload publik.</span>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Topik / Ide Video
          <input name="niche" defaultValue={firstChannel?.niche} placeholder="football, gaming, viral story" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Bahasa / Gaya Caption
          <input name="language" defaultValue={firstChannel?.language} placeholder="id" />
        </label>
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
        <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-600">
          <p>Pengaturan upload, retry, dan kredensial tetap ada di halaman review dan setting teknis.</p>
          <p className="mt-2">Form ini sengaja hanya menampilkan input yang dipakai operator untuk menyusun rencana video.</p>
        </div>
      </details>
    </form>
  );
}
