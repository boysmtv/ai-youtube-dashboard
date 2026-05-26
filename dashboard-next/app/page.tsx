import Link from "next/link";
import { AppShell } from "../components/app-shell";
import { ChannelGrid } from "../components/channel-grid";
import { GuidedWorkflow } from "../components/guided-workflow";
import { JobTable } from "../components/job-table";
import { MetricCard } from "../components/metric-card";
import { PageHeader } from "../components/page-header";
import { PublishHistoryTable } from "../components/publish-history";
import { hasDashboardRole, requireDashboardSession } from "../lib/dashboard-auth";
import { getChannelReadiness, getOverview, getPublishHistory, getPublishQueue, getRecentApprovals, getRegistry, getRuntimeHealth } from "../lib/engine-api";
import { buildChannelNextAction, buildHomeWorkflowSteps } from "../lib/operator-workflow";

function NextActionItem({
  href,
  title,
  description,
  count,
  tone = "neutral",
}: Readonly<{ href: string; title: string; description: string; count?: number; tone?: "primary" | "neutral" }>) {
  return (
    <Link
      className={`block rounded-2xl border p-4 transition ${tone === "primary" ? "border-brand-100 bg-brand-25 hover:border-brand-200" : "border-gray-200 bg-white hover:border-brand-200 hover:bg-brand-25"}`}
      href={href}
    >
      <div className="flex items-start justify-between gap-3">
        <strong className="block text-gray-900">{title}</strong>
        {count !== undefined ? <span className="ta-status bg-gray-100 text-gray-700">{count}</span> : null}
      </div>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const session = requireDashboardSession("/");
  const [overview, approvals, registry, readiness, publishHistory, runtimeHealth, publishQueue] = await Promise.all([
    getOverview(),
    getRecentApprovals(5),
    getRegistry(),
    getChannelReadiness(20),
    getPublishHistory(20),
    getRuntimeHealth(),
    getPublishQueue(20),
  ]);
  const youtubeHistory = {
    ...publishHistory,
    items: publishHistory.items.filter((item) => item.platform === "youtube"),
    total: publishHistory.items.filter((item) => item.platform === "youtube").length,
    platform_counts: { youtube: publishHistory.items.filter((item) => item.platform === "youtube").length },
  };
  const canOperate = hasDashboardRole(session, "operator");
  const activeCount = ["searching", "downloaded", "transcribed", "planned", "voiceover", "uploading", "processing"].reduce(
    (total, status) => total + (overview.job_counts[status] || 0),
    0,
  );
  const readyToReview = overview.job_counts.rendered || 0;
  const needsAttention = (overview.job_counts.failed || 0) + (runtimeHealth.errors?.length || 0) + (runtimeHealth.warnings?.length || 0);
  const uploadPrivateSuccess = youtubeHistory.items.filter((item) => ["uploaded", "published", "draft_ready"].includes(item.status)).length;
  const copyrightBlocked = publishQueue.items.filter((item) => !item.review_summary?.production_allowed && item.review_summary?.production_blockers.length).length;
  const activeChannels = readiness.items.filter((item) => item.enabled).length;
  const channelReadyCount = readiness.items.filter((item) => item.upload_ready).length;
  const channelAttentionCount = readiness.items.filter((item) => !item.upload_ready || item.issues.length > 0).length;
  const latestError = runtimeHealth.errors?.[0] || runtimeHealth.warnings?.[0] || "Tidak ada error penting saat ini.";
  const recommendedAction =
    readyToReview > 0
      ? { href: "/publish", title: "Review video siap upload", description: "Ada video yang sudah siap dicek." }
      : needsAttention > 0
        ? { href: "/queue", title: "Perbaiki video yang gagal", description: "Ada video yang perlu perhatian." }
          : activeCount > 0
          ? { href: "/queue", title: "Pantau proses", description: "Video masih sedang diproses." }
          : { href: "/queue#create-video", title: "Buat video baru", description: "Belum ada pekerjaan aktif." };
  const workflowSteps = buildHomeWorkflowSteps({
    overview,
    readyCount: readyToReview,
    blockedCount: copyrightBlocked,
    channelReadyCount,
    uploadedCount: uploadPrivateSuccess,
    reportCount: youtubeHistory.total,
  });
  const primaryChannel = readiness.items.find((item) => item.upload_ready && item.enabled) || readiness.items.find((item) => item.enabled);
  const channelAction = primaryChannel
    ? buildChannelNextAction(primaryChannel, Boolean(primaryChannel?.enabled))
    : { nextAction: "Cek Channel", reason: "Belum ada channel yang siap dipakai.", targetLink: "/channels" };

  return (
    <AppShell>
      <PageHeader
        actions={[
          { href: "/queue#create-video", label: "Buat Video Baru", tone: "primary" },
          { href: "/publish", label: "Review Sekarang", tone: "secondary" },
        ]}
        breadcrumbs={[{ href: "/", label: "Dashboard" }]}
        description="Lihat keputusan hari ini, video yang siap review, channel yang perlu perhatian, dan status sistem bisnis utama."
        eyebrow="Dashboard"
        title="Apa yang harus saya lakukan hari ini?"
      />

      <GuidedWorkflow
        eyebrow="Alur Kerja Hari Ini"
        title="Mulai dari sini"
        description="Ikuti urutan kerja yang aman untuk operator: buat video, pantau proses, review hasil, cek copyright, upload private test, lalu lihat laporan."
        steps={workflowSteps}
        summaryAction={recommendedAction.title}
        summaryLink={recommendedAction.href}
      />

      <section className="mt-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-5">
        <Link className="rounded-2xl border border-brand-100 bg-brand-25 p-4 text-sm transition hover:border-brand-200" href="/queue#create-video">
          <strong className="block text-gray-900">Buat Video Baru</strong>
          <p className="mt-1 text-gray-600">Mulai alur video baru. Channel siap: {channelReadyCount}.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="/publish">
          <strong className="block text-gray-900">Review Sekarang</strong>
          <p className="mt-1 text-gray-600">Cek metadata, copyright, dan label AI. Menunggu review: {readyToReview}.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="/queue#antrian">
          <strong className="block text-gray-900">Cek Video Bermasalah</strong>
          <p className="mt-1 text-gray-600">Pantau proses yang sedang berjalan. Sedang diproses: {activeCount}.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="/channels">
          <strong className="block text-gray-900">Channel Perlu Perhatian</strong>
          <p className="mt-1 text-gray-600">Cari channel yang siap atau bermasalah. Siap dipakai: {activeChannels}.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="/analytics">
          <strong className="block text-gray-900">Lihat Laporan</strong>
          <p className="mt-1 text-gray-600">Lihat ringkasan operasional terbaru. Riwayat upload: {youtubeHistory.total}.</p>
        </Link>
      </section>

      <section className="mt-6 rounded-2xl border border-brand-100 bg-brand-25 p-5">
        <p className="ta-label text-brand-600">Yang Perlu Dilakukan</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          <NextActionItem href={recommendedAction.href} title={recommendedAction.title} description={recommendedAction.description} count={readyToReview} tone="primary" />
          <NextActionItem href="/publish" title="Review video siap upload" description="Buka queue review dan cek blocker produksi." count={readyToReview} />
          <NextActionItem href="/queue" title="Cek video bermasalah" description="Lihat job yang perlu dipulihkan atau diulang." count={needsAttention} />
          <NextActionItem href="/publish" title="Lengkapi data copyright" description="Periksa metadata, rights, dan disclosure sebelum upload." count={copyrightBlocked} />
          <NextActionItem href="/channels" title="Cek channel perlu login" description="Cari channel yang butuh token atau perbaikan setup." count={readiness.items.filter((item) => item.issues.includes("missing_token")).length} />
          <NextActionItem href="/analytics" title="Lihat laporan" description="Ringkasan operasional upload terbaru." count={youtubeHistory.total} />
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4">
            <p className="ta-label text-brand-600">Error penting</p>
            <p className="mt-2 text-sm text-gray-700">{latestError}</p>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard href="/queue#antrian" label="Video Sedang Diproses" value={activeCount} />
        <MetricCard href="/publish" label="Video Siap Review" value={readyToReview} tone={readyToReview > 0 ? "warn" : "neutral"} />
        <MetricCard href="/queue" label="Video Bermasalah" value={needsAttention} tone={needsAttention > 0 ? "warn" : "neutral"} />
        <MetricCard href="/publish" label="Upload Private Sukses" value={uploadPrivateSuccess} tone="good" />
        <MetricCard href="/publish" label="Diblokir Copyright" value={copyrightBlocked} tone={copyrightBlocked > 0 ? "warn" : "neutral"} />
        <MetricCard href="/channels" label="Channel Perlu Perhatian" value={channelAttentionCount} tone={channelAttentionCount > 0 ? "warn" : "neutral"} />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Sistem aktif</p>
          <strong className="mt-2 block text-lg text-gray-900">Dashboard tersambung</strong>
          <p className="mt-1 text-sm text-gray-500">Operator bisa lanjut ke workflow utama tanpa gangguan.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Database aktif</p>
          <strong className="mt-2 block text-lg text-gray-900">Data tersimpan</strong>
          <p className="mt-1 text-sm text-gray-500">Semua data bisnis tersimpan aman di sistem utama.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="ta-label text-brand-600">Antrian aktif</p>
          <strong className="mt-2 block text-lg text-gray-900">Proses berjalan</strong>
          <p className="mt-1 text-sm text-gray-500">Video baru, proses kerja, dan tindak lanjut tetap terpantau.</p>
        </div>
      </section>

      <section className="mt-6">
        <ChannelGrid registry={registry} overview={overview} readiness={readiness} />
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <p className="ta-label text-brand-600">Channel berikutnya</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong className="block text-gray-900">{channelAction.nextAction}</strong>
            <p className="mt-1 text-sm text-gray-500">{channelAction.reason}</p>
          </div>
          <Link className="ta-button" href={channelAction.targetLink}>
            Buka
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Video terbaru</h3>
            <span className="font-mono text-xs text-gray-500">{overview.generated_at}</span>
          </div>
          <JobTable jobs={overview.jobs.slice(0, 8)} canOperate={canOperate} />
        </div>
        <div className="space-y-6">
          <div className="ta-panel p-5">
            <p className="ta-label text-brand-600">Ringkasan</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Video siap review</span>
                <strong>{readyToReview}</strong>
              </div>
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Channel aktif</span>
                <strong>{activeChannels}</strong>
              </div>
              <div className="flex justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <span>Error penting</span>
                <strong>{needsAttention}</strong>
              </div>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Riwayat review dan publish</h3>
            <PublishHistoryTable history={youtubeHistory} limitLabel="Riwayat upload terbaru" />
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Audit operator</h3>
            {approvals.items.length ? (
              <div className="grid gap-3">
                {approvals.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="ta-panel p-4">
                    <p className="ta-label text-brand-600">{item.job_id ? `Video #${item.job_id}` : "Video"}</p>
                    <p className="mt-2 text-sm text-gray-700">{item.action}</p>
                    <p className="mt-2 text-xs text-gray-500">{item.operator_name || "unknown"} / {item.created_at}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ta-empty">Belum ada audit operator.</div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
