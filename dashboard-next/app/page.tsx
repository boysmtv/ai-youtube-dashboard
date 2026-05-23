import { AppShell } from "../components/app-shell";
import { ApprovalList } from "../components/approval-list";
import { ChannelGrid } from "../components/channel-grid";
import { HealthAlerts } from "../components/health-alerts";
import { FlowBoard } from "../components/flow-board";
import { JobTable } from "../components/job-table";
import { MetricCard } from "../components/metric-card";
import { PublishHistoryTable } from "../components/publish-history";
import { hasDashboardRole, requireDashboardSession } from "../lib/dashboard-auth";
import { getChannelReadiness, getOverview, getPublishHistory, getRecentApprovals, getRegistry } from "../lib/engine-api";

export default async function DashboardPage() {
  const session = requireDashboardSession("/");
  const [overview, approvals, registry, readiness, publishHistory] = await Promise.all([
    getOverview(),
    getRecentApprovals(5),
    getRegistry(),
    getChannelReadiness(20),
    getPublishHistory(20),
  ]);
  const canOperate = hasDashboardRole(session, "operator");
  const activeCount = ["searching", "downloaded", "transcribed", "planned", "voiceover", "rendered", "uploading"].reduce(
    (total, status) => total + (overview.job_counts[status] || 0),
    0,
  );
  const readyToPublish = overview.job_counts.rendered || 0;
  const published = overview.job_counts.uploaded || overview.job_counts.completed || 0;
  const blocked = overview.job_counts.failed || 0;
  const queued = overview.job_counts.queued || 0;
  const tiktokEnabled = registry.channels.filter((item) => item.tiktok_publish.enabled).length;
  const tiktokTokenMissing = registry.channels.filter((item) => item.tiktok_publish.enabled && !item.tiktok_publish.access_token_path).length;
  const tiktokHistory = publishHistory.items.filter((item) => item.platform === "tiktok");
  const tiktokPublished = tiktokHistory.filter((item) => ["published", "draft_ready", "uploaded"].includes(item.status)).length;
  const tiktokFailed = tiktokHistory.filter((item) => item.status === "failed" || Boolean(item.error_message)).length;

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Business cockpit overview</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="max-w-4xl text-4xl font-bold leading-none text-gray-900 lg:text-5xl">Business cockpit for short-form production.</h2>
            <p className="mt-4 max-w-2xl text-gray-500">Use this screen to see what is queued, what is ready, what is published, and what needs attention.</p>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Queued" value={queued} />
        <MetricCard label="In progress" value={activeCount} />
        <MetricCard label="Ready to publish" value={readyToPublish} tone={readyToPublish > 0 ? "warn" : "neutral"} />
        <MetricCard label="Published" value={published} tone="good" />
        <MetricCard label="Blocked / failed" value={blocked} tone={blocked > 0 ? "warn" : "neutral"} />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="TikTok enabled" value={tiktokEnabled} tone={tiktokEnabled > 0 ? "good" : "neutral"} />
        <MetricCard label="TikTok token missing" value={tiktokTokenMissing} tone={tiktokTokenMissing > 0 ? "warn" : "good"} />
        <MetricCard label="TikTok published" value={tiktokPublished} tone="good" />
        <MetricCard label="TikTok failed" value={tiktokFailed} tone={tiktokFailed > 0 ? "warn" : "neutral"} />
      </section>

      <section className="mt-6">
        <HealthAlerts readiness={readiness} />
      </section>

      <section className="mt-6 grid gap-6">
        <FlowBoard overview={overview} />
      </section>

      <section className="mt-6">
        <ChannelGrid registry={registry} overview={overview} readiness={readiness} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Publish history</h3>
            <span className="font-mono text-xs text-gray-500">{overview.generated_at}</span>
          </div>
          <PublishHistoryTable history={publishHistory} limitLabel="Recent publish history" />
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Production queue</h3>
          <JobTable jobs={overview.jobs.slice(0, 8)} canOperate={canOperate} />
          <h3 className="mb-3 mt-6 text-lg font-semibold text-gray-900">Publish approvals and operator audit</h3>
          <ApprovalList approvals={approvals.items} />
        </div>
      </section>
    </AppShell>
  );
}
