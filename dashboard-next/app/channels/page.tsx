import { AppShell } from "../../components/app-shell";
import { ChannelGrid } from "../../components/channel-grid";
import { MetricCard } from "../../components/metric-card";
import { requireDashboardSession } from "../../lib/dashboard-auth";
import { getChannelReadiness, getOverview, getRegistry } from "../../lib/engine-api";

export default async function ChannelsPage() {
  requireDashboardSession("/channels");
  const [registry, overview, readiness] = await Promise.all([getRegistry(), getOverview(), getChannelReadiness(60)]);
  const readyCount = readiness.items.filter((item) => item.upload_ready).length;
  const missingTokenCount = readiness.items.filter((item) => item.issues.includes("missing_token")).length;
  const reviewCount = readiness.items.filter((item) => item.enabled && !item.upload_ready && item.issues.length > 0 && !item.issues.includes("missing_token")).length;
  const blockedCount = readiness.items.filter((item) => !item.enabled).length;

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Channel</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Status kesiapan tiap channel.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">
          Channel ditampilkan sebagai status bisnis yang mudah dibaca: siap, perlu login, perlu review, atau bermasalah.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Siap" value={readyCount} tone={readyCount ? "good" : "neutral"} />
        <MetricCard label="Perlu Login" value={missingTokenCount} tone={missingTokenCount ? "warn" : "neutral"} />
        <MetricCard label="Perlu Review" value={reviewCount} tone={reviewCount ? "warn" : "neutral"} />
        <MetricCard label="Bermasalah" value={blockedCount} tone={blockedCount ? "warn" : "good"} />
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <p className="ta-label text-brand-600">Channel profile</p>
        <p className="mt-2 text-sm text-gray-500">Ringkasan strategi channel untuk operator bisnis, tanpa membuka token atau path teknis di tampilan utama.</p>
      </section>

      <section className="mt-6">
        <ChannelGrid registry={registry} overview={overview} readiness={readiness} />
      </section>
    </AppShell>
  );
}
