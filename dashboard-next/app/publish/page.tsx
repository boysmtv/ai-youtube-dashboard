import { AppShell } from "../../components/app-shell";
import { ApprovalList } from "../../components/approval-list";
import { PublishHistoryTable } from "../../components/publish-history";
import { UploadApprovalPanel } from "../../components/upload-approval-panel";
import { MetricCard } from "../../components/metric-card";
import { requireDashboardRole } from "../../lib/dashboard-auth";
import { getOverview, getPublishHistory, getPublishQueue, getRecentApprovals } from "../../lib/engine-api";

export default async function PublishPage() {
  requireDashboardRole("operator", "/publish");
  const [overview, approvals, publishQueue, publishHistory] = await Promise.all([
    getOverview(),
    getRecentApprovals(50),
    getPublishQueue(100),
    getPublishHistory(50),
  ]);
  const queueItems = publishQueue.items.filter((item) => item.status !== "uploaded");
  const queueTotal = queueItems.length;
  const approvalReady = queueItems.filter(
    (item) => item.publish_state.youtube.manual_push_available || item.publish_state.tiktok.manual_push_available,
  ).length;
  const waitingApproval = queueItems.filter(
    (item) => !item.publish_state.youtube.approval?.is_active || !item.publish_state.tiktok.approval?.is_active,
  ).length;
  const uploadedCount = publishHistory.items.filter((item) => ["uploaded", "published", "draft_ready"].includes(item.status)).length;
  const failedCount = publishHistory.items.filter((item) => item.status === "failed" || Boolean(item.error_message)).length;
  const youtubeHistory = publishHistory.platform_counts.youtube || 0;
  const tiktokHistory = publishHistory.platform_counts.tiktok || 0;

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-warning-700">Review & Upload</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Siapkan video untuk upload manual.</h2>
        <p className="mt-4 max-w-2xl text-gray-500">Halaman ini menampilkan yang butuh persetujuan, yang sudah siap upload, dan hasil upload terbaru untuk YouTube dan TikTok.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Butuh persetujuan" value={waitingApproval} tone={waitingApproval > 0 ? "warn" : "neutral"} />
          <MetricCard label="Siap upload" value={approvalReady} tone={approvalReady > 0 ? "good" : "neutral"} />
          <MetricCard label="Upload berhasil" value={uploadedCount} tone="good" />
          <MetricCard label="Upload gagal" value={failedCount} tone={failedCount > 0 ? "warn" : "neutral"} />
          <MetricCard label="Approval guard" value={overview.upload_guard.enabled ? "On" : "Off"} tone={overview.upload_guard.enabled ? "warn" : "neutral"} />
        </div>
      </header>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <UploadApprovalPanel items={queueItems} uploadGuard={overview.upload_guard} title="Butuh persetujuan" />
          <PublishHistoryTable history={publishHistory} limitLabel="Riwayat upload" />
        </div>
        <div>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Riwayat persetujuan</h3>
          <ApprovalList approvals={approvals.items} />
        </div>
      </section>
    </AppShell>
  );
}
