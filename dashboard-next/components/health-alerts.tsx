import Link from "next/link";
import type { ChannelReadinessPayload } from "../lib/engine-types";

function summarizeIssues(issues: string[]) {
  if (!issues.length) {
    return "ready";
  }
  if (issues.includes("missing_token")) {
    return "missing token";
  }
  if (issues.includes("missing_client_secret")) {
    return "missing client secret";
  }
  if (issues.includes("oauth_validation_failed")) {
    return "oauth blocked";
  }
  return "blocked";
}

export function HealthAlerts({
  readiness,
}: Readonly<{
  readiness: ChannelReadinessPayload;
}>) {
  const ready = readiness.items.filter((item) => item.upload_ready).length;
  const missingToken = readiness.items.filter((item) => item.issues.includes("missing_token")).length;
  const blocked = readiness.items.filter((item) => item.issues.length > 0).length;
  const alerts = readiness.items.filter((item) => item.issues.length > 0).slice(0, 4);

  return (
    <section className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Health alerts</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Problems that need attention now.</h3>
        </div>
        <Link className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="/channels">
          Open channels
        </Link>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-success-200 bg-success-50 p-4">
          <p className="ta-label text-success-700">Ready</p>
          <strong className="mt-2 block text-2xl text-gray-900">{ready}</strong>
        </div>
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-4">
          <p className="ta-label text-warning-700">Missing token</p>
          <strong className="mt-2 block text-2xl text-gray-900">{missingToken}</strong>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Blocked</p>
          <strong className="mt-2 block text-2xl text-gray-900">{blocked}</strong>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {alerts.length ? (
          alerts.map((item) => (
            <div key={item.channel_id} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <strong className="text-gray-900">{item.display_name}</strong>
                  <p className="mt-1 text-sm text-gray-500">{item.channel_id}</p>
                </div>
                <span
                  className={`ta-status font-mono ${
                    item.issues.includes("missing_token")
                      ? "bg-warning-50 text-warning-700"
                      : item.upload_ready
                        ? "bg-success-50 text-success-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {summarizeIssues(item.issues)}
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-700">
                {item.issues.length ? item.issues.join(", ") : "ready"}
              </p>
            </div>
          ))
        ) : (
          <div className="ta-empty">No active health alerts.</div>
        )}
      </div>
    </section>
  );
}
