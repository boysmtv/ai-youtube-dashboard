import type { RegistryPayload } from "../lib/engine-types";
import { saveChannelSettings, saveCoreSettings } from "../app/settings/actions";
import { ConfirmSubmitButton } from "./confirm-submit-button";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  step,
  id,
}: Readonly<{
  label: string;
  name: string;
  defaultValue: string | number;
  type?: string;
  step?: string;
  id?: string;
}>) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-gray-700">
      {label}
      <input id={id} name={name} type={type} step={step} defaultValue={defaultValue} />
    </label>
  );
}

export function CoreSettingsForm({ registry }: Readonly<{ registry: RegistryPayload }>) {
  return (
    <form action={saveCoreSettings} className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Pengaturan Umum</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Pengaturan inti operasional</h3>
        </div>
        <ConfirmSubmitButton className="px-5 py-3 text-sm" message="Save core automation settings to the engine registry?">
          Simpan umum
        </ConfirmSubmitButton>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Zona waktu" name="timezone" defaultValue={registry.timezone} />
        <Field label="Target kapasitas harian" name="storage_budget_gb" type="number" defaultValue={registry.storage_budget_gb} />
        <Field label="Slot kerja default" name="default_publish_slots" defaultValue={registry.default_publish_slots.join(",")} />
        <Field label="Kapasitas proses" name="worker_max_active_jobs" type="number" defaultValue={registry.worker.max_active_jobs} />
        <Field label="Batas ruang aman" name="worker_min_free_disk_gb" type="number" defaultValue={registry.worker.min_free_disk_gb} />
        <Field label="Jeda aman produksi" name="worker_publish_lead_time_hours" type="number" defaultValue={registry.worker.publish_lead_time_hours} />
        <Field label="Teks persetujuan upload" name="upload_approval_confirmation_text" defaultValue={registry.upload_approval.confirmation_text} />
        <Field label="Durasi sesi persetujuan menit" name="upload_approval_session_minutes" type="number" defaultValue={registry.upload_approval.session_minutes} />
        <Field label="Simpan kerja terbaru" name="retention_keep_recent_job_dirs" type="number" defaultValue={registry.retention.keep_recent_job_dirs} />
        <Field label="Interval bersih-bersih jam" name="retention_cleanup_interval_hours" type="number" defaultValue={registry.retention.cleanup_interval_hours} />
      </div>
      <label className="mt-4 grid gap-2 text-sm font-semibold text-gray-700">
        Alasan validasi upload
        <textarea
          name="upload_approval_reason"
          defaultValue={registry.upload_approval.reason}
          className="min-h-24"
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-gray-700">
        <label className="flex items-center gap-2">
          <input className="ta-check" name="upload_approval_enabled" type="checkbox" defaultChecked={registry.upload_approval.enabled} />
          Blokir upload jika copyright belum aman
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="upload_approval_require_operator_name" type="checkbox" defaultChecked={registry.upload_approval.require_operator_name} />
          Wajib nama operator
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="upload_approval_require_reason" type="checkbox" defaultChecked={registry.upload_approval.require_reason} />
          Wajib alasan
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="retention_enabled" type="checkbox" defaultChecked={registry.retention.enabled} />
          Retention aktif
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="retention_auto_cleanup_on_worker_start" type="checkbox" defaultChecked={registry.retention.auto_cleanup_on_worker_start} />
          Cleanup saat worker start
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="retention_auto_cleanup_on_scheduler_tick" type="checkbox" defaultChecked={registry.retention.auto_cleanup_on_scheduler_tick} />
          Cleanup saat scheduler jalan
        </label>
        <label className="flex items-center gap-2">
          <input className="ta-check" name="retention_delete_downloads_first" type="checkbox" defaultChecked={registry.retention.delete_downloads_first} />
          Hapus unduhan lebih dulu
        </label>
      </div>
      <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <p className="ta-label text-brand-600">Copyright & Safety</p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-xl bg-white px-4 py-3">Blokir risiko konten ulang tinggi</div>
          <div className="rounded-xl bg-white px-4 py-3">Wajib label AI jika konten realistis</div>
          <div className="rounded-xl bg-white px-4 py-3">Musik hanya dari library berlisensi</div>
          <div className="rounded-xl bg-white px-4 py-3">Volume musik default 15%</div>
        </div>
      </div>
    </form>
  );
}

export function ChannelSettingsForms({ registry }: Readonly<{ registry: RegistryPayload }>) {
  return (
    <div className="ta-panel p-5">
      <p className="ta-label text-brand-600">Channel</p>
      <h3 className="mt-2 text-lg font-semibold text-gray-900">Pengaturan channel</h3>
      <div className="mt-5 space-y-4">
        {registry.channels.map((channel) => (
          <form key={channel.id} id={`settings-${channel.id}`} action={saveChannelSettings} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <input name="channel_id" type="hidden" value={channel.id} />
                <strong className="text-gray-900">{channel.id}</strong>
              </div>
              <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Save settings for channel ${channel.id}?`}>
                Simpan channel
              </ConfirmSubmitButton>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Nama channel" name="display_name" defaultValue={channel.display_name} />
              <Field label="Fokus konten" name="niche" defaultValue={channel.niche} />
              <Field label="Bahasa" name="language" defaultValue={channel.language} />
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-gray-700">
              <label className="flex items-center gap-2">
                <input className="ta-check" name="enabled" type="checkbox" defaultChecked={channel.enabled} />
                Channel aktif
              </label>
            </div>
            <details className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex items-center justify-between gap-3">
                  <span className="ta-label text-brand-600">Advanced / Admin</span>
                  <span className="ta-status bg-gray-100 text-gray-700">Tutup / buka</span>
                </div>
              </summary>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field id={`settings-${channel.id}-client-secret-path`} label="Client secret path" name="client_secret_path" defaultValue={channel.client_secret_path} />
                <Field id={`settings-${channel.id}-token-path`} label="Token path" name="token_path" defaultValue={channel.token_path} />
                <Field label="Publish slots CSV" name="publish_slots" defaultValue={channel.publish_slots.join(",")} />
                <Field label="Curated sources path" name="curated_sources_path" defaultValue={channel.curated_sources_path} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input className="ta-check" name="require_client_secret" type="checkbox" defaultChecked={channel.upload_preflight.require_client_secret} />
                  Wajib client secret
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input className="ta-check" name="require_token" type="checkbox" defaultChecked={channel.upload_preflight.require_token} />
                  Wajib token
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input className="ta-check" name="require_curated_sources" type="checkbox" defaultChecked={channel.upload_preflight.require_curated_sources} />
                  Wajib curated source
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input className="ta-check" name="require_publish_slots" type="checkbox" defaultChecked={channel.upload_preflight.require_publish_slots} />
                  Wajib slot kerja
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input className="ta-check" name="validate_oauth_credentials" type="checkbox" defaultChecked={channel.upload_preflight.validate_oauth_credentials} />
                  Cek login YouTube
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <input className="ta-check" name="auto_bootstrap_allowed" type="checkbox" defaultChecked={channel.upload_preflight.auto_bootstrap_allowed} />
                  Auto bootstrap diperbolehkan
                </label>
              </div>
            </details>
          </form>
        ))}
      </div>
    </div>
  );
}
