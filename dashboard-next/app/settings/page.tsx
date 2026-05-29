import { AppShell } from "../../components/app-shell";
import { ChannelSettingsForms, CoreSettingsForm } from "../../components/settings-forms";
import { PageHeader } from "../../components/page-header";
import { SettingsAdvancedPanels } from "../../components/settings-advanced-panels";
import { dashboardAuthReadiness, requireDashboardRole } from "../../lib/dashboard-auth";
import { engineBrowserBaseUrl, getAdminBackups, getRegistry } from "../../lib/engine-api";
import { formatSettingStatus } from "../../lib/localization";

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
  const [registry, backups] = await Promise.all([getRegistry(), getAdminBackups()]);
  const registryBackups = backups.items.filter((item) => item.target === "registry");
  const databaseBackups = backups.items.filter((item) => item.target === "database");
  const authReadiness = dashboardAuthReadiness();
  const engineBase = engineBrowserBaseUrl();
  const uploadGateActive = registry.upload_approval.enabled;
  const retentionEnabled = registry.retention.enabled;

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
        description="Bagian utama untuk operator menampilkan pengaturan bisnis yang aman. Detail teknis, backup, dan registry mentah tetap ada di panel advanced."
        eyebrow="Pengaturan"
        title="Pengaturan operasional dan safety."
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatusCard
          label="Upload Gate"
          value={formatSettingStatus(uploadGateActive ? "aktif" : "disabled")}
          tone={uploadGateActive ? "aktif" : "disabled"}
          detail="Gate upload tetap aktif di registry."
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
        <StatusCard
          label="Retention"
          value={formatSettingStatus(retentionEnabled ? "ok" : "perlu review")}
          tone={retentionEnabled ? "ok" : "perlu review"}
          detail="Retention policy tetap dapat dijalankan dari panel advanced."
        />
        <StatusCard
          label="Backup Registry"
          value={formatSettingStatus(registryBackups.length ? "aktif" : "missing")}
          tone={registryBackups.length ? "aktif" : "missing"}
          detail={`${registryBackups.length} snapshot registry tersedia.`}
        />
        <StatusCard
          label="Database Aktif"
          value={formatSettingStatus(databaseBackups.length ? "aktif" : "missing")}
          tone={databaseBackups.length ? "aktif" : "missing"}
          detail={`${databaseBackups.length} snapshot PostgreSQL tersedia.`}
        />
        <StatusCard
          label="Akses Admin"
          value={formatSettingStatus(authReadiness.enabled ? "aktif" : "missing")}
          tone={authReadiness.enabled ? "aktif" : "missing"}
          detail={authReadiness.enabled ? "Akses admin siap." : "Akses admin belum siap."}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Advanced / Admin</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Registry, backup, dan pemulihan</h3>
            <p className="mt-2 text-sm text-gray-500">Tampilan utama di atas hanya status board. Panel teknis ditunda sampai dipilih.</p>
          </div>
          <CoreSettingsForm registry={registry} />
          <ChannelSettingsForms registry={registry} />
        </div>

        <SettingsAdvancedPanels authReadiness={authReadiness} backups={backups} engineBase={engineBase} registry={registry} />
      </section>
    </AppShell>
  );
}
