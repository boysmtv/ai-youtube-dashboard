"use client";

import { useState } from "react";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import type { BackupListPayload, RegistryPayload } from "../lib/engine-types";
import { formatBoolean, formatTechnicalValue } from "../lib/localization";
import { createBackupSnapshot, restoreBackupSnapshot, runRetentionSnapshot, saveRegistrySettings } from "../app/settings/actions";

function JsonPreview({ value }: Readonly<{ value: unknown }>) {
  return (
    <pre className="max-h-[260px] overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed text-white">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

type ActiveSection = "overview" | "auth" | "retention" | "backup" | "registry" | "preview";
type AuthReadiness = {
  enabled: boolean;
  secret_present: boolean;
  account_count: number;
};

export function SettingsAdvancedPanels({
  registry,
  backups,
  authReadiness,
  engineBase,
}: Readonly<{
  registry: RegistryPayload;
  backups: BackupListPayload;
  authReadiness: AuthReadiness;
  engineBase: string;
}>) {
  const [section, setSection] = useState<ActiveSection>("overview");
  const registryJson = JSON.stringify(registry, null, 2);
  const registryBackups = backups.items.filter((item) => item.target === "registry");
  const databaseBackups = backups.items.filter((item) => item.target === "database");

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="ta-panel p-5">
        <p className="ta-label text-brand-600">Advanced / Admin</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Registry, backup, dan pemulihan</h3>
        <p className="mt-2 text-sm text-gray-500">Panel teknis ini dimuat bertahap supaya halaman utama tetap ringan dan tetap memakai PostgreSQL sebagai storage aktif.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["overview", "Ringkas"],
            ["auth", "Auth"],
            ["retention", "Retention"],
            ["backup", "Backup"],
            ["registry", "Registry"],
            ["preview", "Preview"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`rounded-full border px-3 py-2 text-sm font-semibold ${section === key ? "border-brand-100 bg-brand-25 text-brand-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
              type="button"
              onClick={() => setSection(key as ActiveSection)}
            >
              {label}
            </button>
          ))}
        </div>
        {section === "overview" ? (
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <strong className="block text-gray-900">Auth readiness</strong>
              <p className="mt-1 text-gray-600">{authReadiness.enabled ? "Akses admin siap." : "Akses admin belum siap."}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <strong className="block text-gray-900">Backup tersedia</strong>
              <p className="mt-1 text-gray-600">{registryBackups.length + databaseBackups.length} snapshot tercatat.</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <strong className="block text-gray-900">Registry raw</strong>
              <p className="mt-1 text-gray-600">JSON mentah, restore, dan preview hanya dirender saat dipilih.</p>
            </div>
          </div>
        ) : null}
        {section === "auth" ? (
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
          </div>
        ) : null}
        {section === "retention" ? (
          <div className="mt-4">
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
          </div>
        ) : null}
        {section === "backup" ? (
          <div className="mt-4">
            <div className="ta-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="ta-label text-brand-600">Backup and restore</p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900">Snapshot registry dan PostgreSQL</h3>
                  <p className="mt-2 text-sm text-gray-500">Backup disimpan ke folder host. Restore PostgreSQL tetap dibatasi jika masih ada video aktif.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={createBackupSnapshot}>
                    <input name="target" type="hidden" value="all" />
                    <ConfirmSubmitButton className="px-4 py-2 text-sm" message="Buat backup registry dan PostgreSQL?" pendingText="Creating...">
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
                    <ConfirmSubmitButton className="px-4 py-2 text-sm" message="Buat backup PostgreSQL?" tone="muted" pendingText="Creating...">
                      Backup PostgreSQL
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
                  <h4 className="text-sm font-semibold text-gray-900">PostgreSQL backups</h4>
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
                      <div className="ta-empty">Belum ada backup PostgreSQL.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {section === "registry" ? (
          <div className="mt-4">
            <form action={saveRegistrySettings} className="ta-panel p-5">
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
          </div>
        ) : null}
        {section === "preview" ? (
          <div className="mt-4">
            <div className="ta-panel p-5">
              <p className="ta-label text-brand-600">Pratinjau teknis</p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">Read-only preview</h3>
              <div className="mt-4">
                <JsonPreview value={registry} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
