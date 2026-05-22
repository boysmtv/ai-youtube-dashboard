import { AppShell } from "../../components/app-shell";
import { ApprovalList } from "../../components/approval-list";
import { UploadApprovalPanel } from "../../components/upload-approval-panel";
import { requireDashboardRole } from "../../lib/dashboard-auth";
import { getJobs, getOverview, getRecentApprovals } from "../../lib/engine-api";

export default async function PublishPage() {
  requireDashboardRole("operator", "/publish");
  const [overview, approvals, renderedJobs] = await Promise.all([getOverview(), getRecentApprovals(50), getJobs(200)]);
  const publishReadyJobs = renderedJobs.items.filter((job) => job.status === "rendered");

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-warning-700">Publish Center</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Ready items waiting for publish.</h2>
        <p className="mt-4 max-w-2xl text-gray-500">This page only shows items ready for manual approval and push. YouTube is active now; TikTok follows the same lane when the adapter is ready.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-900 p-4 text-white">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-white/60">Ready</p>
            <strong className="mt-1 block">{publishReadyJobs.length}</strong>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label">Approval guard</p>
            <strong className="mt-1 block text-gray-900">{overview.upload_guard.enabled ? "On" : "Off"}</strong>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="ta-label">Approval window</p>
            <strong className="mt-1 block text-gray-900">{overview.upload_guard.session_minutes} minutes</strong>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <UploadApprovalPanel jobs={publishReadyJobs} uploadGuard={overview.upload_guard} />
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Approval history</h3>
          <ApprovalList approvals={approvals.items} />
        </div>
      </section>
    </AppShell>
  );
}
