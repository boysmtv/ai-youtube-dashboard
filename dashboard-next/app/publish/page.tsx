import { AppShell } from "../../components/app-shell";
import { ApprovalList } from "../../components/approval-list";
import { PublishHistoryTable } from "../../components/publish-history";
import { UploadApprovalPanel } from "../../components/upload-approval-panel";
import { requireDashboardRole } from "../../lib/dashboard-auth";
import { getJobs, getOverview, getPublishHistory, getRecentApprovals } from "../../lib/engine-api";

export default async function PublishPage() {
  requireDashboardRole("operator", "/publish");
  const [overview, approvals, renderedJobs, publishHistory] = await Promise.all([
    getOverview(),
    getRecentApprovals(50),
    getJobs(200),
    getPublishHistory(50),
  ]);
  const publishReadyJobs = renderedJobs.items.filter((job) => job.status === "rendered");
  const youtubeHistory = publishHistory.platform_counts.youtube || 0;
  const tiktokHistory = publishHistory.platform_counts.tiktok || 0;

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-warning-700">Publish Center</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Ready items waiting for publish.</h2>
        <p className="mt-4 max-w-2xl text-gray-500">This page shows ready items, manual approval, and recent publish history across YouTube and TikTok.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-gray-900 p-4 text-white">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/60">Ready</p>
            <strong className="mt-1 block">{publishReadyJobs.length}</strong>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label">YouTube history</p>
            <strong className="mt-1 block text-gray-900">{youtubeHistory}</strong>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label">TikTok history</p>
            <strong className="mt-1 block text-gray-900">{tiktokHistory}</strong>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label">Approval guard</p>
            <strong className="mt-1 block text-gray-900">{overview.upload_guard.enabled ? "On" : "Off"}</strong>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <UploadApprovalPanel jobs={publishReadyJobs} uploadGuard={overview.upload_guard} />
          <PublishHistoryTable history={publishHistory} limitLabel="Publish history" />
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Approval history</h3>
          <ApprovalList approvals={approvals.items} />
        </div>
      </section>
    </AppShell>
  );
}
