import { AppShell } from "../../components/app-shell";
import { JsonCard } from "../../components/json-card";
import { requireDashboardSession } from "../../lib/dashboard-auth";
import { getRecentLogs } from "../../lib/engine-api";

export default async function LogsPage() {
  requireDashboardSession("/logs");
  const logs = await getRecentLogs(120);

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Logs</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Recent engine logs.</h2>
        <p className="mt-4 max-w-2xl text-gray-500">
          Compact log view for operations. Full historical log storage should stay in host-mounted volumes or external observability.
        </p>
      </header>

      <section className="mt-6 grid gap-3">
        {logs.items.slice(0, 30).map((entry, index) => (
          <article key={index} className="ta-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="ta-label text-brand-600">{String(entry.command || "event")}</p>
                <h3 className="mt-2 text-base font-semibold text-gray-900">{String(entry.event || "unknown")}</h3>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-gray-500">{String(entry.timestamp || "no timestamp")}</p>
                <p className="mt-1 text-xs text-gray-500">
                  actor={String((entry.details as Record<string, unknown> | undefined)?.actor || "system")} /
                  role={String((entry.details as Record<string, unknown> | undefined)?.actor_role || "n/a")} /
                  source={String((entry.details as Record<string, unknown> | undefined)?.source || "api")}
                </p>
              </div>
            </div>
            <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-700">
              {JSON.stringify((entry.details as Record<string, unknown> | undefined) || {}, null, 2)}
            </pre>
          </article>
        ))}
        {!logs.items.length ? (
          <div className="ta-empty">No recent logs returned.</div>
        ) : null}
      </section>

      <div className="mt-6">
        <JsonCard title="Raw Log Payload" value={{ count: logs.count, previewed: Math.min(logs.items.length, 30) }} />
      </div>
    </AppShell>
  );
}
