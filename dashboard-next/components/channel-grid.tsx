import Link from "next/link";
import type { ChannelReadinessPayload, OverviewPayload, RegistryPayload } from "../lib/engine-types";

export function ChannelGrid({
  registry,
  overview,
  readiness,
}: Readonly<{
  registry: RegistryPayload;
  overview: OverviewPayload;
  readiness: ChannelReadinessPayload;
}>) {
  const readinessByChannel = new Map(readiness.items.map((item) => [item.channel_id, item]));

  function deriveHealth(item: (typeof readiness.items)[number] | undefined, channelEnabled: boolean) {
    if (!channelEnabled) {
      return { label: "disabled", tone: "bg-gray-100 text-gray-700" };
    }
    if (!item) {
      return { label: "blocked", tone: "bg-warning-50 text-warning-700" };
    }
    const issueSet = new Set(item.issues);
    if (item.upload_ready) {
      return { label: "ready", tone: "bg-success-50 text-success-700" };
    }
    if (issueSet.has("missing_token")) {
      return { label: "missing token", tone: "bg-warning-50 text-warning-700" };
    }
    if (item.enabled) {
      return { label: "configured", tone: "bg-brand-50 text-brand-700" };
    }
    return { label: "blocked", tone: "bg-warning-50 text-warning-700" };
  }

  return (
    <section className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Channel control</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Per-channel business configuration.</h3>
        </div>
        <Link className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="/settings">
          Open settings
        </Link>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {registry.channels.map((channel) => (
          <article key={channel.id} id={`channel-${channel.id}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            {(() => {
              const item = readinessByChannel.get(channel.id);
              const issues = item?.issues || [];
              const health = deriveHealth(item, channel.enabled);
              return (
                <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{channel.display_name || channel.id}</h4>
                <p className="mt-1 font-mono text-xs text-gray-500">
                  {channel.id} / {channel.gcp_project_id}
                </p>
              </div>
              <span
                className={`ta-status font-mono ${health.tone}`}
              >
                {health.label}
              </span>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Niche</span>
                <strong className="text-gray-900">{channel.niche}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Language</span>
                <strong className="text-gray-900">{channel.language}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Slots</span>
                <strong className="text-gray-900">{(channel.publish_slots.length ? channel.publish_slots : registry.default_publish_slots).join(", ")}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Current jobs</span>
                <strong className="text-gray-900">{overview.jobs_by_channel[channel.id] || 0}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Queued</span>
                <strong className="text-gray-900">{item?.job_counts.queued || 0}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Rendered</span>
                <strong className="text-gray-900">{item?.job_counts.rendered || 0}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Connection</span>
                <strong className="text-gray-900">
                  {item?.paths.token_exists ? "token ok" : "token missing"} / {item?.paths.client_secret_exists ? "secret ok" : "secret missing"}
                </strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Health</span>
                <strong className="text-gray-900">
                  {item?.upload_ready ? "ready" : issues.includes("missing_token") ? "missing token" : channel.enabled ? "configured" : "disabled"}
                </strong>
              </div>
            </div>
            <div id={`channel-health-${channel.id}`} className="mt-4 rounded-xl border border-gray-200 bg-white p-3 text-sm">
              <p className="ta-label">Publish readiness</p>
              <p className="mt-2 text-gray-700">
                Last upload: {String(item?.last_upload?.status || "none")} | latest job: {item?.latest_job ? `${item.latest_job.status} (#${item.latest_job.id})` : "none"}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                oauth validation={String(item?.oauth_validation?.status || (item?.upload_preflight.validate_oauth_credentials ? "pending" : "disabled"))} / retention keep recent={String(item?.retention.keep_recent_job_dirs ?? "n/a")}
              </p>
              {item?.checks?.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {item.checks.map((check) => (
                    <div key={check.code} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-gray-900">{check.label}</span>
                        <span className={`ta-status ${check.ok ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700"}`}>
                          {check.ok ? "ok" : "check"}
                        </span>
                      </div>
                      <p className="mt-2 break-all font-mono text-[11px] text-gray-500">{check.value || "n/a"}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {issues.length ? <p className="mt-3 text-warning-700">Issues: {issues.join(", ")}</p> : <p className="mt-3 text-success-700">No readiness blockers detected.</p>}
            </div>
                </>
              );
            })()}
          </article>
        ))}
      </div>
    </section>
  );
}
