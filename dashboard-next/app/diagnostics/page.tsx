import { AppShell } from "../../components/app-shell";
import { JsonCard } from "../../components/json-card";
import { requireDashboardSession } from "../../lib/dashboard-auth";
import { getHealth, getOverview, getRecentLogs } from "../../lib/engine-api";

export default async function DiagnosticsPage() {
  requireDashboardSession("/diagnostics");
  const [health, overview, logs] = await Promise.all([getHealth(), getOverview(), getRecentLogs(40)]);

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Admin / Diagnostics</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Pemeriksaan runtime tingkat lanjut.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">
          Halaman ini sengaja teknis untuk troubleshooting admin. Tidak dipakai dalam alur bisnis harian.
        </p>
      </header>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <JsonCard title="Health Payload" value={health} />
        <JsonCard title="Recent Events" value={overview.recent_events} />
      </section>

      <section className="mt-6">
        <JsonCard title="Recent Runtime Logs" value={logs.items} />
      </section>
    </AppShell>
  );
}
