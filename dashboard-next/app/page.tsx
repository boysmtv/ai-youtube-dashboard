import { AppShell } from "../components/app-shell";
import { JobTable } from "../components/job-table";
import { MetricCard } from "../components/metric-card";
import { PageHeader } from "../components/page-header";
import { hasDashboardRole, requireDashboardSession } from "../lib/dashboard-auth";
import { getOverview, getPublishHistory, getPublishQueue } from "../lib/engine-api";

function lower(value: string) {
  return value.trim().toLowerCase();
}

function statusGroup(status: string) {
  const normalized = lower(status);
  if (["queued", "searching"].includes(normalized)) return "Menunggu";
  if (["downloaded", "transcribed", "planned", "voiceover", "rendering", "uploading", "processing"].includes(normalized)) return "Sedang Diproses";
  if (normalized === "rendered") return "Siap Review";
  if (["uploaded", "published", "draft_ready", "completed"].includes(normalized)) return "Sudah Upload Private";
  if (["blocked", "rejected"].includes(normalized)) return "Diblokir";
  if (["failed", "cancelled", "canceled"].includes(normalized)) return "Gagal";
  return "Lainnya";
}

function dayKey(value?: string | null) {
  if (!value) return "unknown";
  return value.slice(0, 10);
}

function DailyStatusChart({
  jobs,
}: Readonly<{
  jobs: Array<{ status: string; created_at?: string | null; updated_at?: string | null; publish_at?: string | null }>;
}>) {
  const buckets = new Map<
    string,
    Record<
      "Menunggu" | "Sedang Diproses" | "Siap Review" | "Sudah Upload Private" | "Diblokir" | "Gagal" | "Lainnya",
      number
    >
  >();

  for (const job of jobs) {
    const day = dayKey(job.created_at || job.updated_at || job.publish_at);
    const bucket = buckets.get(day) || {
      Menunggu: 0,
      "Sedang Diproses": 0,
      "Siap Review": 0,
      "Sudah Upload Private": 0,
      "Diblokir": 0,
      "Gagal": 0,
      "Lainnya": 0,
    };
    bucket[statusGroup(job.status) as keyof typeof bucket] += 1;
    buckets.set(day, bucket);
  }

  const days = [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7);
  const legend: Array<[string, string]> = [
    ["Menunggu", "bg-gray-300"],
    ["Sedang Diproses", "bg-brand-500"],
    ["Siap Review", "bg-warning-500"],
    ["Sudah Upload Private", "bg-success-500"],
    ["Diblokir", "bg-error-500"],
    ["Gagal", "bg-gray-700"],
    ["Lainnya", "bg-gray-200"],
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="ta-label text-brand-600">Grafik harian</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Status job per hari</h3>
        </div>
        <span className="ta-status bg-gray-100 text-gray-700">{days.length} hari terbaru</span>
      </div>

      <div className="mt-5 space-y-4">
        {days.length ? (
          days.map(([day, bucket]) => {
            const total = Object.values(bucket).reduce((sum, value) => sum + value, 0);
            return (
              <div key={day} className="grid gap-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-gray-700">{day}</span>
                  <span className="font-mono text-gray-500">{total}</span>
                </div>
                <div className="flex h-4 overflow-hidden rounded-full bg-gray-100">
                  {legend.map(([label, tone]) => {
                    const value = bucket[label as keyof typeof bucket];
                    if (!value) return null;
                    return (
                      <div
                        key={`${day}-${label}`}
                        className={`h-4 ${tone}`}
                        style={{ width: `${(value / total) * 100}%` }}
                        title={`${label}: ${value}`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                  {legend.map(([label]) => {
                    const value = bucket[label as keyof typeof bucket];
                    return value ? (
                      <span key={`${day}-${label}`} className="rounded-full bg-gray-50 px-2 py-1">
                        {label}: {value}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            );
          })
        ) : (
          <div className="ta-empty">Belum ada data harian yang cukup untuk grafik.</div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {legend.map(([label, tone]) => (
          <span key={label} className={`ta-status ${tone} bg-opacity-10`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = requireDashboardSession("/");
  const [overview, publishHistory, publishQueue] = await Promise.all([getOverview(), getPublishHistory(20), getPublishQueue(100)]);
  const canOperate = hasDashboardRole(session, "operator");
  const youtubeHistory = {
    ...publishHistory,
    items: publishHistory.items.filter((item) => item.platform === "youtube"),
    total: publishHistory.items.filter((item) => item.platform === "youtube").length,
    platform_counts: { youtube: publishHistory.items.filter((item) => item.platform === "youtube").length },
  };
  const activeCount = ["searching", "downloaded", "transcribed", "planned", "voiceover", "uploading", "processing"].reduce(
    (total, status) => total + (overview.job_counts[status] || 0),
    0,
  );
  const readyToReview = overview.job_counts.rendered || 0;
  const uploadedPrivateSuccess = youtubeHistory.items.filter((item) => ["uploaded", "published", "draft_ready"].includes(item.status)).length;
  const copyrightBlocked = publishQueue.items.filter((item) => !item.review_summary?.production_allowed && item.review_summary?.production_blockers.length).length;
  const readyProduction = publishQueue.items.filter((item) => item.review_summary?.production_allowed).length;
  const totalJobs = overview.jobs.length;
  const chartJobs = overview.jobs
    .map((job) => ({
      status: job.status,
      updated_at: job.updated_at,
      publish_at: job.publish_at,
    }))
    .filter((job) => Boolean(job.updated_at || job.publish_at));

  return (
    <AppShell>
      <PageHeader
        actions={[
          { href: "/queue#create-video", label: "Buat Video Baru", tone: "primary" },
          { href: "/publish", label: "Review Sekarang", tone: "secondary" },
        ]}
        breadcrumbs={[{ href: "/", label: "Dashboard" }]}
        description="Ringkasan operasional, grafik harian, dan tabel job terbaru dalam satu layar."
        eyebrow="Dashboard"
        title="Dashboard monitoring bisnis"
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard href="/queue" label="Total Video" value={totalJobs} />
        <MetricCard href="/queue#antrian" label="Menunggu" value={overview.job_counts.queued || 0} />
        <MetricCard href="/queue#antrian" label="Sedang Diproses" value={activeCount} tone={activeCount > 0 ? "warn" : "neutral"} />
        <MetricCard href="/publish" label="Siap Review" value={readyToReview} tone={readyToReview > 0 ? "warn" : "neutral"} />
        <MetricCard href="/queue" label="Gagal" value={overview.job_counts.failed || 0} tone={(overview.job_counts.failed || 0) > 0 ? "warn" : "neutral"} />
        <MetricCard href="/publish" label="Diblokir" value={copyrightBlocked} tone={copyrightBlocked > 0 ? "warn" : "neutral"} />
        <MetricCard href="/publish" label="Sudah Upload Private" value={uploadedPrivateSuccess} tone="good" />
        <MetricCard href="/publish" label="Siap Production" value={readyProduction} tone={readyProduction > 0 ? "good" : "neutral"} />
      </section>

      <section className="mt-6">
        <DailyStatusChart jobs={chartJobs} />
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">Video terbaru</h3>
          <span className="font-mono text-xs text-gray-500">{overview.generated_at}</span>
        </div>
        <JobTable jobs={overview.jobs.slice(0, 12)} canOperate={canOperate} />
      </section>
    </AppShell>
  );
}
