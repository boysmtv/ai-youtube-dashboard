import { AppShell } from "../../components/app-shell";
import { ApprovalList } from "../../components/approval-list";
import { PublishHistoryTable } from "../../components/publish-history";
import { MetricCard } from "../../components/metric-card";
import { PageHeader } from "../../components/page-header";
import { requireDashboardRole } from "../../lib/dashboard-auth";
import { getOverview, getPublishHistory, getRecentApprovals } from "../../lib/engine-api";
import { formatChannelName, formatStatus } from "../../lib/localization";

export default async function PublishPage() {
  requireDashboardRole("operator", "/publish");
  const [approvals, publishHistory, overview] = await Promise.all([
    getRecentApprovals(20),
    getPublishHistory(20),
    getOverview(),
  ]);
  const youtubeHistory = {
    ...publishHistory,
    items: publishHistory.items.filter((item) => item.platform === "youtube"),
    total: publishHistory.items.filter((item) => item.platform === "youtube").length,
    platform_counts: { youtube: publishHistory.items.filter((item) => item.platform === "youtube").length },
  };
  const queueItems = overview.jobs.slice(0, 8);
  const queueTotal = overview.job_counts.queued || 0;
  const readyForReview = overview.job_counts.rendered || 0;
  const blockedCount = overview.job_counts.failed || 0;
  const uploadedCount = publishHistory.items.filter((item) => ["uploaded", "published", "draft_ready"].includes(item.status)).length;
  const failedCount = publishHistory.items.filter((item) => item.status === "failed" || Boolean(item.error_message)).length;
  const nextAction =
    readyForReview > 0
      ? { title: "Review video siap upload", description: "Cek metadata, preview, dan status sistem sebelum private test.", href: "/publish#queue" }
      : blockedCount > 0
        ? { title: "Cek status sistem", description: "Ada video yang perlu tindak lanjut.", href: "/queue#antrian" }
        : { title: "Lihat antrian", description: "Belum ada item yang siap review.", href: "/queue#antrian" };

  return (
    <AppShell>
      <PageHeader
        actions={[
          { href: "/queue", label: "Lihat Antrian", tone: "primary" },
          { href: "/channels", label: "Cek Channel", tone: "secondary" },
        ]}
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/publish", label: "Review & Upload" },
        ]}
        description="Halaman ini adalah pusat keputusan ringkas untuk preview, metadata final, dan status sistem."
        eyebrow="Review & Upload"
        title="Pusat keputusan untuk video siap review."
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard href="/publish#queue" label="Video Siap Review" value={readyForReview} tone={readyForReview > 0 ? "good" : "neutral"} />
        <MetricCard href="/publish#queue" label="Video Perlu Status Sistem" value={blockedCount} tone={blockedCount > 0 ? "warn" : "neutral"} />
        <MetricCard href="/publish#history" label="Video Sudah Upload Private" value={uploadedCount} tone="good" />
        <MetricCard href="/publish#queue" label="Video Belum Siap Production" value={queueTotal} tone={queueTotal > 0 ? "warn" : "neutral"} />
        <MetricCard href="/publish#history" label="Upload Gagal" value={failedCount} tone={failedCount > 0 ? "warn" : "neutral"} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Queue ringkas</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Video yang perlu ditinjau</h3>
            <p className="mt-1 text-sm text-gray-500">{nextAction.title}</p>
            <div className="mt-4 grid gap-3">
              {queueItems.length ? (
                queueItems.map((item) => (
                  <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <a className="font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${item.id}`}>
                          Video #{item.id}
                        </a>
                        <p className="mt-1 text-xs text-gray-500">{formatChannelName({ id: item.channel_id, niche: item.niche })}</p>
                      </div>
                      <span className="ta-status bg-gray-100 text-gray-700">{formatStatus(item.status)}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">{item.selected_title || "Judul belum dipilih"}</p>
                  </div>
                ))
              ) : (
                <div className="ta-empty">Belum ada video di ringkasan cepat.</div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a className="ta-button" href="/queue#antrian">
                Buka antrian penuh
              </a>
              <a className="ta-button-muted" href="/queue#create-video">
                Buat video baru
              </a>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <div id="history" />
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Riwayat publish</h3>
            <PublishHistoryTable history={youtubeHistory} limitLabel="Riwayat upload terbaru" />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Audit persetujuan</h3>
            <ApprovalList approvals={approvals.items} />
          </div>
        </div>
      </section>
    </AppShell>
  );
}
