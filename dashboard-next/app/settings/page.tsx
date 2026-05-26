import { AppShell } from "../../components/app-shell";
import { ConfirmSubmitButton } from "../../components/confirm-submit-button";
import { ChannelSettingsForms, CoreSettingsForm } from "../../components/settings-forms";
import { PageHeader } from "../../components/page-header";
import { dashboardAuthReadiness, requireDashboardRole } from "../../lib/dashboard-auth";
import { engineBrowserBaseUrl, getAdminBackups, getRegistry, getRuntimeHealth } from "../../lib/engine-api";
import { createBackupSnapshot, restoreBackupSnapshot, runRetentionSnapshot, saveRegistrySettings } from "./actions";

function JsonPreview({ value }: Readonly<{ value: unknown }>) {
  return (
    <pre className="max-h-[260px] overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-white">
      {JSON.stringify(value, null, 2)}
    </pre>
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
  const tonePlaceholderDisabled = runtimeHealth.audio?.tone_placeholder_enabled === false;

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

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="ta-panel p-4">
          <p className="ta-label">Pengaturan Umum</p>
          <strong className="mt-2 block text-lg text-gray-900">Zona waktu, kapasitas, dan jadwal kerja</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">Copyright & Safety</p>
          <strong className="mt-2 block text-lg text-gray-900">Blokir upload jika belum aman</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">Caption & Hashtag</p>
          <strong className="mt-2 block text-lg text-gray-900">Aturan metadata siap pakai</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">YouTube Upload</p>
          <strong className="mt-2 block text-lg text-gray-900">{registry.upload_approval.enabled ? "Aktif" : "Nonaktif"}</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">Channel</p>
          <strong className="mt-2 block text-lg text-gray-900">{registry.channels.filter((item) => item.enabled).length}/{registry.channels.length} aktif</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">Advanced/Admin</p>
          <strong className="mt-2 block text-lg text-gray-900">Detail teknis di bawah</strong>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">System</p>
          <strong className="mt-2 block text-lg text-gray-900">Sistem aktif</strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Database</p>
          <strong className="mt-2 block text-lg text-gray-900">Database aktif</strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Antrian</p>
          <strong className="mt-2 block text-lg text-gray-900">Antrian aktif</strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Safety</p>
          <strong className="mt-2 block text-lg text-gray-900">Copyright gate aktif</strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Music</p>
          <strong className="mt-2 block text-lg text-gray-900">Musik berlisensi only</strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Tone</p>
          <strong className="mt-2 block text-lg text-gray-900">{tonePlaceholderDisabled ? "Placeholder tone dimatikan" : "Placeholder tone aktif"}</strong>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="ta-label text-brand-600">Copyright gate aktif</p>
            <strong className="mt-2 block text-gray-900">Production tetap dibatasi</strong>
            <p className="mt-1 text-gray-600">Video hanya boleh lanjut jika rights, visual, musik, dan disclosure aman.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="ta-label text-brand-600">Production gate aktif</p>
            <strong className="mt-2 block text-gray-900">{registry.upload_approval.enabled ? "Aktif" : "Nonaktif"}</strong>
            <p className="mt-1 text-gray-600">Upload tetap menunggu review yang jelas sebelum produksi final.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="ta-label text-brand-600">Musik berlisensi only</p>
            <strong className="mt-2 block text-gray-900">Ya</strong>
            <p className="mt-1 text-gray-600">Source audio harus aman untuk production sebelum upload final.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="ta-label text-brand-600">Volume musik default 15%</p>
            <strong className="mt-2 block text-gray-900">Tersimpan</strong>
            <p className="mt-1 text-gray-600">Setelan aman dipakai untuk menjaga voice-over tetap jelas.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="ta-label text-brand-600">Placeholder tone dimatikan</p>
            <strong className="mt-2 block text-gray-900">{tonePlaceholderDisabled ? "Ya" : "Tidak"}</strong>
            <p className="mt-1 text-gray-600">Tone placeholder tidak dipakai di pipeline produksi.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
            <p className="ta-label text-brand-600">Data tersimpan</p>
            <strong className="mt-2 block text-gray-900">Di sistem utama</strong>
            <p className="mt-1 text-gray-600">Operator tidak perlu melihat detail penyimpanan di tampilan utama.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-brand-100 bg-brand-25 p-5">
        <p className="ta-label text-brand-600">Panduan singkat</p>
        <div className="mt-3 grid gap-2 text-sm text-gray-700">
          <p>1. Buat video</p>
          <p>2. Tunggu siap review</p>
          <p>3. Cek preview + metadata</p>
          <p>4. Cek copyright</p>
          <p>5. Upload private test</p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <CoreSettingsForm registry={registry} />
          <ChannelSettingsForms registry={registry} />
        </div>

        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Advanced / Admin</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Registry, backup, dan pemulihan</h3>
            <p className="mt-2 text-sm text-gray-500">Bagian ini tetap tersedia untuk admin teknis. Operator harian tidak perlu membuka detail ini.</p>
          </div>

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
                <strong>{authReadiness.enabled ? "yes" : "no"}</strong>
              </div>
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Secret present</span>
                <strong>{authReadiness.secret_present ? "yes" : "no"}</strong>
              </div>
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Configured accounts</span>
                <strong>{authReadiness.account_count}</strong>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p className="font-mono text-xs text-gray-500">{authReadiness.expected_env.join(", ")}</p>
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
                  Force even if disabled
                </label>
                <div className="mt-3">
                  <ConfirmSubmitButton className="px-4 py-2 text-sm" message="Jalankan retention sekarang?" tone="warning" pendingText="Running...">
                    Run retention
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
                <p className="mt-2 text-sm text-gray-500">Backup disimpan ke folder host. Restore database tetap dibatasi jika masih ada job aktif.</p>
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
                <p className="mt-1 font-mono text-xs text-gray-500">live: {backups.live.registry.path}</p>
                <div className="mt-3 space-y-3">
                  {registryBackups.length ? (
                    registryBackups.slice(0, 8).map((item) => (
                      <form key={item.name} action={restoreBackupSnapshot} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <input name="target" type="hidden" value={item.target} />
                        <input name="backup_name" type="hidden" value={item.name} />
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-xs text-gray-500">{item.created_at}</p>
                            <strong className="mt-1 block text-sm text-gray-900">{item.name}</strong>
                            <p className="mt-1 font-mono text-xs text-gray-500">{item.size_bytes} bytes</p>
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
                <p className="mt-1 font-mono text-xs text-gray-500">live: {backups.live.database.path}</p>
                <div className="mt-3 space-y-3">
                  {databaseBackups.length ? (
                    databaseBackups.slice(0, 8).map((item) => (
                      <form key={item.name} action={restoreBackupSnapshot} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <input name="target" type="hidden" value={item.target} />
                        <input name="backup_name" type="hidden" value={item.name} />
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-mono text-xs text-gray-500">{item.created_at}</p>
                            <strong className="mt-1 block text-sm text-gray-900">{item.name}</strong>
                            <p className="mt-1 font-mono text-xs text-gray-500">{item.size_bytes} bytes</p>
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
