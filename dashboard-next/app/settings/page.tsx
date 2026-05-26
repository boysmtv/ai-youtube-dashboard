import { AppShell } from "../../components/app-shell";
import { ConfirmSubmitButton } from "../../components/confirm-submit-button";
import { ChannelSettingsForms, CoreSettingsForm } from "../../components/settings-forms";
import { dashboardAuthReadiness, requireDashboardRole } from "../../lib/dashboard-auth";
import { engineBrowserBaseUrl, getAdminBackups, getRegistry } from "../../lib/engine-api";
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
  const [registry, backups] = await Promise.all([getRegistry(), getAdminBackups()]);
  const registryJson = JSON.stringify(registry, null, 2);
  const registryBackups = backups.items.filter((item) => item.target === "registry");
  const databaseBackups = backups.items.filter((item) => item.target === "database");
  const authReadiness = dashboardAuthReadiness();
  const engineBase = engineBrowserBaseUrl();

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Pengaturan</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900 lg:text-5xl">Pengaturan umum, safety, dan admin.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">
          Bagian utama untuk operator menampilkan pengaturan yang aman. Detail teknis, backup, dan registry mentah tetap tersedia di bawah sebagai advanced/admin.
        </p>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="ta-panel p-4">
          <p className="ta-label">Pengaturan Umum</p>
          <strong className="mt-2 block text-lg text-gray-900">Zona waktu, storage, dan worker</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">Copyright & Safety</p>
          <strong className="mt-2 block text-lg text-gray-900">Blokir upload jika belum aman</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">Channel</p>
          <strong className="mt-2 block text-lg text-gray-900">{registry.channels.filter((item) => item.enabled).length}/{registry.channels.length} aktif</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">Upload Guard</p>
          <strong className="mt-2 block text-lg text-gray-900">{registry.upload_approval.enabled ? "Aktif" : "Nonaktif"}</strong>
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
