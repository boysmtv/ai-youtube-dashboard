import { AppShell } from "../../components/app-shell";
import { ChannelGrid } from "../../components/channel-grid";
import { MetricCard } from "../../components/metric-card";
import { requireDashboardSession } from "../../lib/dashboard-auth";
import { getChannelReadiness, getOverview, getRegistry } from "../../lib/engine-api";

export default async function ChannelsPage() {
  requireDashboardSession("/channels");
  const [registry, overview, readiness] = await Promise.all([getRegistry(), getOverview(), getChannelReadiness(60)]);
  const readyCount = readiness.items.filter((item) => item.upload_ready).length;
  const blockedCount = readiness.items.filter((item) => item.issues.length > 0).length;
  const totalChecks = readiness.items.reduce((sum, item) => sum + item.checks.length, 0);
  const passingChecks = readiness.items.reduce((sum, item) => sum + item.readiness_score, 0);

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Channels</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">Channel-level business controls.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">
          Each channel is treated as a business lane with its own niche, publish slots, quota source, and operational backlog.
        </p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Configured" value={registry.channels.length} />
        <MetricCard label="Enabled" value={registry.channels.filter((item) => item.enabled).length} tone="good" />
        <MetricCard label="Upload Ready" value={readyCount} tone={readyCount ? "good" : "warn"} />
        <MetricCard label="Needs Attention" value={blockedCount} tone={blockedCount ? "warn" : "good"} />
        <MetricCard label="Checks Passing" value={`${passingChecks}/${totalChecks || 0}`} tone={blockedCount ? "warn" : "good"} />
      </section>

      <section className="mt-6">
        <ChannelGrid registry={registry} overview={overview} readiness={readiness} />
      </section>
    </AppShell>
  );
}
