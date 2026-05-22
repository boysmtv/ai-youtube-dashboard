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
        <p className="ta-label text-brand-600">Engine Registry</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900 lg:text-5xl">Automation settings.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">
          This page edits the engine registry through <span className="font-mono">GET/PUT /api/registry</span>. It replaces manual JSON file edits while keeping every engine parameter available.
        </p>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="ta-panel p-4">
          <p className="ta-label">Timezone</p>
          <strong className="mt-2 block text-lg text-gray-900">{registry.timezone}</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">Storage Budget</p>
          <strong className="mt-2 block text-lg text-gray-900">{registry.storage_budget_gb} GB</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">Channels</p>
          <strong className="mt-2 block text-lg text-gray-900">{registry.channels.filter((item) => item.enabled).length}/{registry.channels.length}</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">TikTok</p>
          <strong className="mt-2 block text-lg text-gray-900">{registry.channels.filter((item) => item.tiktok_publish?.enabled).length} enabled</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">Upload Guard</p>
          <strong className="mt-2 block text-lg text-gray-900">{registry.upload_approval.enabled ? "Enabled" : "Disabled"}</strong>
        </div>
        <div className="ta-panel p-4">
          <p className="ta-label">Retention</p>
          <strong className="mt-2 block text-lg text-gray-900">{registry.retention.enabled ? "Enabled" : "Disabled"}</strong>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <CoreSettingsForm registry={registry} />

          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Worker</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Max active jobs</span>
                <strong>{registry.worker.max_active_jobs}</strong>
              </div>
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Min free disk</span>
                <strong>{registry.worker.min_free_disk_gb} GB</strong>
              </div>
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Publish lead time</span>
                <strong>{registry.worker.publish_lead_time_hours} hours</strong>
              </div>
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Retention keep recent job dirs</span>
                <strong>{registry.retention.keep_recent_job_dirs}</strong>
              </div>
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Retention scheduler tick cleanup</span>
                <strong>{registry.retention.auto_cleanup_on_scheduler_tick ? "yes" : "no"}</strong>
              </div>
            </div>
          </div>

          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Projects</p>
            <div className="mt-4 space-y-3">
              {registry.gcp_projects.map((project) => (
                <div key={project.id} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                  <div className="font-semibold text-gray-900">{project.display_name}</div>
                  <div className="mt-1 font-mono text-xs text-gray-500">
                    {project.id} quota={project.daily_quota_units} reserve={project.quota_reserve_units} upload_cost={project.upload_cost_units}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Channels</p>
            <div className="mt-4 space-y-3">
              {registry.channels.map((channel) => (
                <div key={channel.id} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-gray-900">{channel.display_name || channel.id}</strong>
                    <span className="ta-status bg-brand-50 font-mono text-brand-600">{channel.enabled ? "enabled" : "disabled"}</span>
                  </div>
                  <div className="mt-1 font-mono text-xs text-gray-500">
                    {channel.id} niche={channel.niche} slots={(channel.publish_slots.length ? channel.publish_slots : registry.default_publish_slots).join(",")}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="ta-status bg-brand-50 font-mono text-brand-600">
                      TikTok {channel.tiktok_publish.enabled ? "enabled" : "disabled"}
                    </span>
                    <span className="ta-status bg-gray-100 font-mono text-gray-700">
                      mode={channel.tiktok_publish.publish_mode} transfer={channel.tiktok_publish.transfer_method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ChannelSettingsForms registry={registry} />

          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Auth readiness</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Role-based access activation</h3>
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
            </div>
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="font-mono text-xs text-gray-500">{authReadiness.expected_env.join(", ")}</p>
            </div>
          </div>

          <div className="ta-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="ta-label text-brand-600">Retention policy</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Manual cleanup run</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Executes the current retention policy immediately. Use force only if the policy is disabled but you still want one cleanup pass.
                </p>
              </div>
              <form action={runRetentionSnapshot} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input className="ta-check" name="force" type="checkbox" />
                  Force even if disabled
                </label>
                <div className="mt-3">
                  <ConfirmSubmitButton className="px-4 py-2 text-sm" message="Run retention policy now?" tone="warning" pendingText="Running...">
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
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Registry and SQLite snapshots</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Backups are written to host-mounted folders. Database restore is blocked while active jobs exist.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={createBackupSnapshot}>
                  <input name="target" type="hidden" value="all" />
                  <ConfirmSubmitButton className="px-4 py-2 text-sm" message="Create backup snapshots for registry and database?" pendingText="Creating...">
                    Backup all
                  </ConfirmSubmitButton>
                </form>
                <form action={createBackupSnapshot}>
                  <input name="target" type="hidden" value="registry" />
                  <ConfirmSubmitButton className="px-4 py-2 text-sm" message="Create registry backup snapshot?" tone="muted" pendingText="Creating...">
                    Backup registry
                  </ConfirmSubmitButton>
                </form>
                <form action={createBackupSnapshot}>
                  <input name="target" type="hidden" value="database" />
                  <ConfirmSubmitButton className="px-4 py-2 text-sm" message="Create database backup snapshot?" tone="muted" pendingText="Creating...">
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
                    <div className="ta-empty">No registry backups yet.</div>
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
                            <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Restore database from backup ${item.name}? This is blocked while jobs are active.`} tone="danger" pendingText="Restoring...">
                              Restore
                            </ConfirmSubmitButton>
                          </div>
                        </div>
                      </form>
                    ))
                  ) : (
                    <div className="ta-empty">No database backups yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <form action={saveRegistrySettings} className="ta-panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="ta-label text-brand-600">Editable Source</p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">Registry JSON</h3>
              <p className="mt-2 max-w-xl text-sm text-gray-500">
                Advanced mode. Use the safe forms first; edit JSON only when a field is not covered yet. Engine validation runs before saving.
              </p>
            </div>
            <ConfirmSubmitButton className="px-5 py-3 text-sm" message="Save the raw registry JSON? This can affect all channels and workers.">
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
      </section>

      <section className="ta-panel mt-6 p-5">
        <p className="ta-label text-brand-600">Current Raw Payload</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Read-only preview</h3>
        <div className="mt-4">
          <JsonPreview value={registry} />
        </div>
      </section>
    </AppShell>
  );
}
