import { AppShell } from "../../components/app-shell";
import { ChannelGrid } from "../../components/channel-grid";
import { MetricCard } from "../../components/metric-card";
import { PageHeader } from "../../components/page-header";
import { requireDashboardSession } from "../../lib/dashboard-auth";
import { getChannelReadiness, getOverview, getRegistry } from "../../lib/engine-api";

export default async function ChannelsPage() {
  requireDashboardSession("/channels");
  const [registry, overview, readiness] = await Promise.all([getRegistry(), getOverview(), getChannelReadiness(20)]);
  const readyCount = readiness.items.filter((item) => item.upload_ready).length;
  const missingTokenCount = readiness.items.filter((item) => item.issues.includes("missing_token")).length;
  const reviewCount = readiness.items.filter((item) => item.enabled && !item.upload_ready && item.issues.length > 0 && !item.issues.includes("missing_token")).length;
  const blockedCount = readiness.items.filter((item) => !item.enabled).length;
  const activeStatuses = new Set(["queued", "generating_script", "generating_voice", "generating_visual", "rendering", "finalizing", "ready_for_approval", "approval_required", "approved_waiting_schedule", "scheduled_upload", "uploading"]);
  const fullPipelineChannels = registry.channels.filter((channel) => {
    const activeCount = overview.jobs.filter((job) => job.channel_id === channel.id && activeStatuses.has(String(job.status).toLowerCase())).length;
    return activeCount >= 3;
  }).length;
  const firstProblemChannel = readiness.items.find((item) => !item.upload_ready && item.issues.length > 0);

  return (
    <AppShell>
      <PageHeader
        actions={[
          { href: firstProblemChannel ? `/channels#channel-${firstProblemChannel.channel_id}` : "/channels", label: "Cek Channel Bermasalah", tone: "primary" },
          { href: "/settings", label: "Buka Pengaturan", tone: "secondary" },
        ]}
        breadcrumbs={[
          { href: "/", label: "Dashboard" },
          { href: "/channels", label: "Channel" },
        ]}
        description="Channel ditampilkan sebagai status bisnis yang mudah dibaca: siap, perlu login, perlu review, atau bermasalah."
        eyebrow="Channel"
        title="Kesiapan channel dan strategi konten."
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard href="/channels#channel-health" label="Siap" value={readyCount} tone={readyCount ? "good" : "neutral"} />
        <MetricCard href="/settings" label="Perlu Login" value={missingTokenCount} tone={missingTokenCount ? "warn" : "neutral"} />
        <MetricCard href="/channels#channel-health" label="Perlu Review" value={reviewCount} tone={reviewCount ? "warn" : "neutral"} />
        <MetricCard href="/channels#channel-health" label="Bermasalah" value={blockedCount} tone={blockedCount ? "warn" : "good"} />
        <MetricCard href="/channels#channel-health" label="Penuh 3 Video" value={fullPipelineChannels} tone={fullPipelineChannels > 0 ? "warn" : "neutral"} />
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <p className="ta-label text-brand-600">Profil channel</p>
        <p className="mt-2 text-sm text-gray-500">Ringkasan strategi channel untuk operator bisnis, tanpa membuka token atau path teknis di tampilan utama.</p>
      </section>

      <section className="mt-6" id="channel-health">
        <ChannelGrid registry={registry} overview={overview} readiness={readiness} />
      </section>
    </AppShell>
  );
}
