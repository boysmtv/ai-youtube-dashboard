import { AppShell } from "../../components/app-shell";
import { ConfirmSubmitButton } from "../../components/confirm-submit-button";
import { ChannelSettingsForms, CoreSettingsForm } from "../../components/settings-forms";
import { PageHeader } from "../../components/page-header";
import { dashboardAuthReadiness, requireDashboardRole } from "../../lib/dashboard-auth";
import { engineBrowserBaseUrl, getAdminBackups, getRegistry, getRuntimeHealth } from "../../lib/engine-api";
import { formatBoolean, formatSettingStatus, formatTechnicalValue } from "../../lib/localization";
import { createBackupSnapshot, restoreBackupSnapshot, runRetentionSnapshot, saveRegistrySettings } from "./actions";

function JsonPreview({ value }: Readonly<{ value: unknown }>) {
  return (
    <pre className="max-h-[260px] overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-white">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function statusTone(value: string) {
  const normalized = value.toLowerCase();
  if (["ok", "aktif", "ready", "siap", "enabled", "yes"].includes(normalized)) return "bg-success-50 text-success-700";
  if (["perlu review", "review", "warning", "warn"].includes(normalized)) return "bg-warning-50 text-warning-700";
  if (["missing", "error", "disabled", "nonaktif"].includes(normalized)) return "bg-error-50 text-error-700";
  return "bg-gray-100 text-gray-700";
}

function StatusCard({
  label,
  value,
  tone,
  detail,
}: Readonly<{
  label: string;
  value: string;
  tone: string;
  detail?: string;
}>) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-panel">
      <p className="ta-label text-brand-600">{label}</p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <strong className="text-lg text-gray-900">{value}</strong>
        <span className={`ta-status ${statusTone(tone)}`}>{value}</span>
      </div>
      {detail ? <p className="mt-2 text-xs text-gray-500">{detail}</p> : null}
    </article>
  );
}

export default async function SettingsPage() {
  requireDashboardRole("admin", "/settings");
  const [registry, backups, runtimeHealth] = await Promise.all([getRegistry(), getAdminBackups(), getRuntimeHealth()]);
  const registryJson = JSON.stringify(registry, null, 2);
  const registryBackups = backups.items.filter((item) => item.target === "registry");
  const databaseBackups = backups.items.filter((item) => item.target === "database");
  const authReadiness = dashboardAuthReadiness();
  const engineBase = engineBrowserBaseUrl();
  const youtubeUpload = runtimeHealth.youtube_upload || {
    upload_allowed: false,
    enabled: false,
    approval_required: true,
    client_secret_exists: false,
    token_exists: false,
    messages: [] as string[],
    reason: "",
    blocked_reason: "",
    confirmation_text: "",
  };
  const audio = runtimeHealth.audio || {
    ready: false,
    source_audio_allowed: false,
    tone_placeholder_enabled: false,
    messages: [] as string[],
  };
  const tonePlaceholderDisabled = audio.tone_placeholder_enabled === false;

  return (
    <AppShell>
      <PageHeader
        actions={[
          { href: "/publish", label: "Cek Copyright & Safety", tone: "primary" },
          { href: "/channels", label: "Cek Channel", tone: "secondary" },
        ]}
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/settings", label: "Pengaturan" },
        ]}
        description="Bagian utama untuk operator menampilkan pengaturan bisnis yang aman. Detail teknis, backup, dan registry mentah tetap ada di area advanced/admin."
        eyebrow="Pengaturan"
        title="Pengaturan operasional dan safety."
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatusCard
          label="Upload YouTube"
          value={formatSettingStatus(youtubeUpload.upload_allowed ? "aktif" : "missing")}
          tone={youtubeUpload.upload_allowed ? "aktif" : "missing"}
          detail={youtubeUpload.messages.length ? "Status lengkap tersedia di detail teknis." : "Belum ada catatan."}
        />
        <StatusCard
          label="Copyright Gate"
          value={formatSettingStatus(registry.upload_approval.enabled ? "ok" : "disabled")}
          tone={registry.upload_approval.enabled ? "ok" : "disabled"}
          detail="Menjaga upload tetap aman sebelum diproses."
        />
        <StatusCard
          label="Production Gate"
          value={formatSettingStatus(registry.upload_approval.enabled ? "perlu_review" : "disabled")}
          tone={registry.upload_approval.enabled ? "perlu review" : "disabled"}
          detail={registry.upload_approval.enabled ? "Perlu review manual sebelum production." : "Fitur belum aktif."}
        />
        <StatusCard label="Pembuat Caption" value={formatSettingStatus(audio.ready ? "aktif" : "perlu review")} tone={audio.ready ? "aktif" : "perlu review"} detail="Menghasilkan caption bisnis yang siap review." />
        <StatusCard label="Pembuat Hashtag" value={formatSettingStatus(audio.source_audio_allowed ? "aktif" : "perlu review")} tone={audio.source_audio_allowed ? "aktif" : "perlu review"} detail="Mengikuti profil channel dan metadata final." />
        <StatusCard label="Kebijakan Musik" value={formatSettingStatus(audio.source_audio_allowed ? "ok" : "perlu review")} tone={audio.source_audio_allowed ? "ok" : "perlu review"} detail="Source audio reuse diizinkan secara eksplisit." />
        <StatusCard label="Volume Musik" value={formatSettingStatus(tonePlaceholderDisabled ? "ok" : "perlu review")} tone={tonePlaceholderDisabled ? "ok" : "perlu review"} detail="Tone placeholder harus nonaktif untuk production." />
        <StatusCard label="Database" value={formatSettingStatus(runtimeHealth.storage?.ok ? "ok" : "missing")} tone={runtimeHealth.storage?.ok ? "ok" : "missing"} detail={runtimeHealth.storage?.ok ? "Database aktif" : "Perlu cek database"} />
        <StatusCard label="Antrian" value={formatSettingStatus((runtimeHealth.counts?.queued_jobs || 0) > 0 ? "aktif" : "ok")} tone={(runtimeHealth.counts?.queued_jobs || 0) > 0 ? "aktif" : "ok"} detail={`${runtimeHealth.counts?.queued_jobs || 0} video menunggu`} />
        <StatusCard label="Akses YouTube" value={formatSettingStatus(youtubeUpload.client_secret_exists && youtubeUpload.token_exists ? "aktif" : "missing")} tone={youtubeUpload.client_secret_exists && youtubeUpload.token_exists ? "aktif" : "missing"} detail={authReadiness.enabled ? "Akses admin siap." : "Akses admin belum siap."} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Advanced / Admin</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Registry, backup, dan pemulihan</h3>
            <p className="mt-2 text-sm text-gray-500">Detail konfigurasi tetap tersedia di bawah. Tampilan utama di atas hanya status board.</p>
          </div>
          <CoreSettingsForm registry={registry} />
          <ChannelSettingsForms registry={registry} />
        </div>

        <div className="space-y-6">
          <details className="ta-panel p-5">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="ta-label text-brand-600">Auth readiness</p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">Cek akses admin</h3>
                </div>
                <span className="ta-status bg-gray-100 text-gray-700">Tutup / buka</span>
              </div>
            </summary>
            <div className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span>Auth enabled</span>
                  <strong>{formatBoolean(authReadiness.enabled)}</strong>
                </div>
                <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span>Secret present</span>
                  <strong>{formatBoolean(authReadiness.secret_present)}</strong>
                </div>
                <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <span>Configured accounts</span>
                  <strong>{authReadiness.account_count}</strong>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Env detail tersedia di mode teknis.</p>
                </div>
              </div>
          </details>

          <div className="ta-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="ta-label text-brand-600">Retention policy</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Jalankan cleanup manual</h3>
                <p className="mt-2 text-sm text-gray-500">Memaksa retention policy berjalan sekarang. Dipakai admin jika perlu cleanup segera.</p>
              </div>
              <form action={runRetentionSnapshot} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input className="ta-check" name="force" type="checkbox" />
                  Jalankan meski nonaktif
                </label>
                <div className="mt-3">
                  <ConfirmSubmitButton className="px-4 py-2 text-sm" message="Jalankan retention sekarang?" tone="warning" pendingText="Running...">
                    Jalankan retention
                  </ConfirmSubmitButton>
                </div>
              </form>
            </div>
          </div>

          <div className="ta-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="ta-label text-brand-600">Backup and restore</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Snapshot registry dan database</h3>
                <p className="mt-2 text-sm text-gray-500">Backup disimpan ke folder host. Restore database tetap dibatasi jika masih ada video aktif.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={createBackupSnapshot}>
                  <input name="target" type="hidden" value="all" />
                  <ConfirmSubmitButton className="px-4 py-2 text-sm" message="Buat backup registry dan database?" pendingText="Creating...">
                    Backup all
                  </ConfirmSubmitButton>
                </form>
                <form action={createBackupSnapshot}>
                  <input name="target" type="hidden" value="registry" />
                  <ConfirmSubmitButton className="px-4 py-2 text-sm" message="Buat backup registry?" tone="muted" pendingText="Creating...">
                    Backup registry
                  </ConfirmSubmitButton>
                </form>
                <form action={createBackupSnapshot}>
                  <input name="target" type="hidden" value="database" />
                  <ConfirmSubmitButton className="px-4 py-2 text-sm" message="Buat backup database?" tone="muted" pendingText="Creating...">
                    Backup database
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>

            <div className="mt-5 grid gap-6 xl:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Registry backups</h4>
                <p className="mt-1 text-xs text-gray-500">Lokasi aktif tersedia di mode teknis.</p>
                <div className="mt-3 space-y-3">
                  {registryBackups.length ? (
                    registryBackups.slice(0, 8).map((item) => (
                      <form key={item.name} action={restoreBackupSnapshot} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <input name="target" type="hidden" value={item.target} />
                        <input name="backup_name" type="hidden" value={item.name} />
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-gray-500">{item.created_at}</p>
                            <strong className="mt-1 block text-sm text-gray-900">{item.name}</strong>
                            <p className="mt-1 text-xs text-gray-500">{formatTechnicalValue(item.size_bytes)} bytes</p>
                          </div>
                          <div className="flex gap-2">
                            <a className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href={`${engineBase}/api/admin/backups/download?target=${item.target}&backup_name=${encodeURIComponent(item.name)}`}>
                              Download
                            </a>
                            <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Restore registry from backup ${item.name}?`} tone="warning" pendingText="Restoring...">
                              Restore
                            </ConfirmSubmitButton>
                          </div>
                        </div>
                      </form>
                    ))
                  ) : (
                    <div className="ta-empty">Belum ada backup registry.</div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900">Database backups</h4>
                <p className="mt-1 text-xs text-gray-500">Lokasi aktif tersedia di mode teknis.</p>
                <div className="mt-3 space-y-3">
                  {databaseBackups.length ? (
                    databaseBackups.slice(0, 8).map((item) => (
                      <form key={item.name} action={restoreBackupSnapshot} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <input name="target" type="hidden" value={item.target} />
                        <input name="backup_name" type="hidden" value={item.name} />
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs text-gray-500">{item.created_at}</p>
                            <strong className="mt-1 block text-sm text-gray-900">{item.name}</strong>
                            <p className="mt-1 text-xs text-gray-500">{formatTechnicalValue(item.size_bytes)} bytes</p>
                          </div>
                          <div className="flex gap-2">
                            <a className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href={`${engineBase}/api/admin/backups/download?target=${item.target}&backup_name=${encodeURIComponent(item.name)}`}>
                              Download
                            </a>
                            <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Restore database from backup ${item.name}?`} tone="danger" pendingText="Restoring...">
                              Restore
                            </ConfirmSubmitButton>
                          </div>
                        </div>
                      </form>
                    ))
                  ) : (
                    <div className="ta-empty">Belum ada backup database.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <details className="ta-panel p-5">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="ta-label text-brand-600">Detail Teknis</p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">Registry JSON</h3>
                </div>
                <span className="ta-status bg-gray-100 text-gray-700">Tutup / buka</span>
              </div>
            </summary>
            <form action={saveRegistrySettings} className="mt-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="ta-label text-brand-600">Raw Metadata</p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">Registry JSON</h3>
                  <p className="mt-2 max-w-xl text-sm text-gray-500">
                    Mode advanced. Gunakan form aman di atas terlebih dulu. Edit JSON hanya jika ada field yang belum tercover.
                  </p>
                </div>
                <ConfirmSubmitButton className="px-5 py-3 text-sm" message="Simpan registry JSON mentah? Ini bisa memengaruhi semua channel dan worker.">
                  Save registry
                </ConfirmSubmitButton>
              </div>
              <textarea
                name="registry_json"
                defaultValue={registryJson}
                spellCheck={false}
                className="mt-5 min-h-[720px] w-full rounded-xl border border-gray-700 bg-gray-900 p-4 font-mono text-xs leading-relaxed text-white outline-none focus:shadow-focus"
              />
            </form>
          </details>

          <details className="ta-panel mt-0 p-5">
            <summary className="cursor-pointer list-none">
              <div>
                <p className="ta-label text-brand-600">Pratinjau teknis</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Read-only preview</h3>
              </div>
            </summary>
            <div className="mt-4">
              <JsonPreview value={registry} />
            </div>
          </details>
        </div>
      </section>
    </AppShell>
  );
}
