import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { GuidedWorkflow } from "../../components/guided-workflow";
import { JobCreateForm } from "../../components/job-create-form";
import { JobTable } from "../../components/job-table";
import { MetricCard } from "../../components/metric-card";
import { PageHeader } from "../../components/page-header";
import { hasDashboardRole, requireDashboardSession } from "../../lib/dashboard-auth";
import { getJobs, getOverview, getRegistry } from "../../lib/engine-api";
import { buildQueueWorkflowSteps } from "../../lib/operator-workflow";

function lower(value: string) {
  return value.trim().toLowerCase();
}

function statusGroupForJob(status: string) {
  const normalized = lower(status);
  if (["queued", "searching"].includes(normalized)) return "menunggu";
  if (["downloaded", "transcribed", "planned", "voiceover", "rendering", "uploading", "processing"].includes(normalized)) return "sedang-diproses";
  if (normalized === "rendered") return "siap-review";
  if (["failed", "cancelled", "canceled"].includes(normalized)) return "gagal";
  if (normalized === "blocked") return "diblokir";
  if (["uploaded", "published", "draft_ready"].includes(normalized)) return "sudah-upload-private";
  return "semua";
}

export default async function QueuePage({
  searchParams,
}: Readonly<{ searchParams: Record<string, string | string[] | undefined> }>) {
  const session = requireDashboardSession("/queue");
  const [payload, registry, overview] = await Promise.all([getJobs(50), getRegistry(), getOverview()]);
  const canOperate = hasDashboardRole(session, "operator");
  const createdJobId = typeof searchParams.created === "string" ? searchParams.created : Array.isArray(searchParams.created) ? searchParams.created[0] : "";
  const selectedChannelId = typeof searchParams.channel_id === "string" ? searchParams.channel_id : Array.isArray(searchParams.channel_id) ? searchParams.channel_id[0] : "";
  const selectedGroup = typeof searchParams.status_group === "string" ? searchParams.status_group : Array.isArray(searchParams.status_group) ? searchParams.status_group[0] : "semua";
  const currentChannelIds = new Set(registry.channels.map((channel) => channel.id));
  const jobs = payload.items.filter((job) => {
    const group = statusGroupForJob(job.status);
    return currentChannelIds.has(job.channel_id) && (!selectedChannelId || job.channel_id === selectedChannelId) && (selectedGroup === "semua" || group === selectedGroup);
  });
  const activeCount = ["searching", "downloaded", "transcribed", "planned", "voiceover", "uploading", "processing"].reduce(
    (total, status) => total + (overview.job_counts[status] || 0),
    0,
  );
  const readyToReview = overview.job_counts.rendered || 0;
  const blockedCount = overview.job_counts.failed || 0;
  const selectedChannel = registry.channels.find((channel) => channel.id === selectedChannelId);
  const workflowSteps = buildQueueWorkflowSteps(overview, readyToReview, blockedCount);
  const filterBase = new URLSearchParams();
  if (selectedChannelId) filterBase.set("channel_id", selectedChannelId);
  const filterHref = (group: string) => {
    const params = new URLSearchParams(filterBase);
    if (group !== "semua") params.set("status_group", group);
    return `/queue${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <AppShell>
      <PageHeader
        actions={[
          { href: "/publish", label: "Review Sekarang", tone: "primary" },
          { href: "/channels", label: "Cek Channel", tone: "secondary" },
        ]}
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/queue", label: "Produksi Video" },
        ]}
        description="Halaman ini dipakai untuk membuat video baru, memantau proses, dan mengarahkan item yang siap review ke langkah berikutnya."
        eyebrow="Produksi Video"
        title="Buat video baru dan pantau proses."
      />

      <GuidedWorkflow
        eyebrow="Alur Produksi"
        title="Urutan kerja yang aman"
        description="Buat video baru, pantau proses, review hasil, perbaiki blocker, lalu lanjutkan ke riwayat upload."
        steps={workflowSteps}
        summaryAction="Lihat video yang sedang diproses"
        summaryLink="/queue#antrian"
      />

      {createdJobId ? (
        <section className="mt-6 rounded-2xl border border-success-200 bg-success-50 p-5 text-sm text-success-900">
          <p className="ta-label text-success-700">Video masuk antrian</p>
          <p className="mt-2">Langkah berikutnya: pantau proses.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="rounded-lg border border-success-200 bg-white px-4 py-2 font-semibold text-success-700 hover:bg-success-50" href="/queue#antrian">
              Lihat Antrian Video
            </Link>
            <Link className="rounded-lg border border-success-200 bg-white px-4 py-2 font-semibold text-success-700 hover:bg-success-50" href="/queue#create-video">
              Buat Video Lagi
            </Link>
            <Link className="rounded-lg border border-success-200 bg-white px-4 py-2 font-semibold text-success-700 hover:bg-success-50" href={`/jobs/${createdJobId}`}>
              Buka Detail Video
            </Link>
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard href="/queue#antrian" label="Menunggu" value={overview.job_counts.queued || 0} />
        <MetricCard href="/queue#antrian" label="Sedang Diproses" value={activeCount} tone={activeCount > 0 ? "warn" : "neutral"} />
        <MetricCard href="/publish" label="Siap Review" value={readyToReview} tone={readyToReview > 0 ? "good" : "neutral"} />
        <MetricCard href="/jobs" label="Perlu Diperbaiki" value={blockedCount} tone={blockedCount > 0 ? "warn" : "neutral"} />
      </section>

      <section className="mt-6 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 lg:grid-cols-3">
        <Link className="rounded-2xl border border-brand-100 bg-brand-25 p-4 text-sm transition hover:border-brand-200" href="#create-video">
          <strong className="block text-gray-900">Buat Video Baru</strong>
          <p className="mt-1 text-gray-600">Mulai dari channel, topik, dan target waktu. Upload tidak dilakukan otomatis.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="#antrian">
          <strong className="block text-gray-900">Lihat Antrian</strong>
          <p className="mt-1 text-gray-600">Cek video yang sedang berjalan atau gagal. Pilih status untuk memfilter.</p>
        </Link>
        <Link className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm transition hover:border-brand-200" href="/publish">
          <strong className="block text-gray-900">Review & Upload</strong>
          <p className="mt-1 text-gray-600">Buka video yang sudah siap review.</p>
        </Link>
      </section>

      <section className="mt-6" id="create-video">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ta-label text-brand-600">1. Buat Video Baru</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Simpan rencana video ke antrian</h3>
          </div>
          <Link className="text-sm font-semibold text-brand-600 hover:text-brand-700" href="/channels">
            Cek channel siap
          </Link>
        </div>
        <JobCreateForm defaultChannelId={selectedChannelId} registry={registry} uploadGuard={overview.upload_guard} canOperate={canOperate} />
      </section>

      <section className="mt-6" id="antrian">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="ta-label text-brand-600">2. Sedang Diproses</p>
            <h3 className="mt-2 text-lg font-semibold text-gray-900">Video yang sedang berjalan</h3>
            {selectedChannel ? <p className="mt-1 text-sm text-gray-500">Filter channel: {selectedChannel.display_name || selectedChannel.id}</p> : null}
            <p className="mt-1 text-sm text-gray-500">Filter status: {selectedGroup === "semua" ? "Semua" : selectedGroup.replaceAll("-", " ")}</p>
          </div>
          <p className="text-sm text-gray-500">Urutan terbaru tampil di atas.</p>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Link className={`rounded-full border px-3 py-2 text-sm font-semibold ${selectedGroup === "semua" ? "border-brand-100 bg-brand-25 text-brand-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`} href={filterHref("semua")}>
            Semua
          </Link>
          <Link className={`rounded-full border px-3 py-2 text-sm font-semibold ${selectedGroup === "menunggu" ? "border-brand-100 bg-brand-25 text-brand-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`} href={filterHref("menunggu")}>
            Menunggu
          </Link>
          <Link className={`rounded-full border px-3 py-2 text-sm font-semibold ${selectedGroup === "sedang-diproses" ? "border-brand-100 bg-brand-25 text-brand-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`} href={filterHref("sedang-diproses")}>
            Sedang Diproses
          </Link>
          <Link className={`rounded-full border px-3 py-2 text-sm font-semibold ${selectedGroup === "siap-review" ? "border-brand-100 bg-brand-25 text-brand-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`} href={filterHref("siap-review")}>
            Siap Review
          </Link>
          <Link className={`rounded-full border px-3 py-2 text-sm font-semibold ${selectedGroup === "gagal" ? "border-brand-100 bg-brand-25 text-brand-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`} href={filterHref("gagal")}>
            Gagal
          </Link>
          <Link className={`rounded-full border px-3 py-2 text-sm font-semibold ${selectedGroup === "diblokir" ? "border-brand-100 bg-brand-25 text-brand-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`} href={filterHref("diblokir")}>
            Diblokir
          </Link>
          <Link className={`rounded-full border px-3 py-2 text-sm font-semibold ${selectedGroup === "sudah-upload-private" ? "border-brand-100 bg-brand-25 text-brand-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`} href={filterHref("sudah-upload-private")}>
            Sudah Upload Private
          </Link>
        </div>
        <JobTable jobs={jobs} canOperate={canOperate} />
      </section>

      <section className="mt-6 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <strong className="block text-gray-900">3. Siap Review</strong>
          <p className="mt-1 text-gray-600">Pindahkan item yang sudah render ke Review & Upload.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <strong className="block text-gray-900">4. Perlu Diperbaiki</strong>
          <p className="mt-1 text-gray-600">Buka job yang gagal atau diblokir untuk cek masalah.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
          <strong className="block text-gray-900">5. Semua Video</strong>
          <p className="mt-1 text-gray-600">Lihat seluruh riwayat proses tanpa kehilangan konteks produksi.</p>
        </div>
      </section>
    </AppShell>
  );
}
