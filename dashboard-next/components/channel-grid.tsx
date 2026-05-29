import Link from "next/link";
import type { ChannelReadinessPayload, OverviewPayload, RegistryPayload } from "../lib/engine-types";
import { channelReadinessLabel } from "../lib/business-copy";
import { buildChannelNextAction } from "../lib/operator-workflow";
import { ChannelCard } from "./channel-card";

function lastUploadLabel(value: Record<string, unknown> | null | undefined) {
  if (!value) return "Belum ada";
  const createdAt = String(value.created_at || value.updated_at || value.approved_at || "Belum ada");
  const status = String(value.status || value.privacy_status || "unknown");
  return `${status} · ${createdAt}`;
}

export function ChannelGrid({
  registry,
  overview,
  readiness,
}: Readonly<{
  registry: RegistryPayload;
  overview: OverviewPayload;
  readiness: ChannelReadinessPayload;
}>) {
  const readinessByChannel = new Map(readiness.items.map((item) => [item.channel_id, item]));
  const activeStatuses = new Set(["queued", "generating_script", "generating_voice", "generating_visual", "rendering", "finalizing", "ready_for_approval", "approval_required", "approved_waiting_schedule", "scheduled_upload", "uploading"]);
  const pipelineByChannel = new Map<string, number>();
  for (const job of overview.jobs) {
    if (!activeStatuses.has(String(job.status).toLowerCase())) continue;
    pipelineByChannel.set(job.channel_id, (pipelineByChannel.get(job.channel_id) || 0) + 1);
  }

  return (
    <section className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Channel</p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">Status kesiapan per channel</h3>
        </div>
        <Link className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="/settings">
          Buka pengaturan
        </Link>
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {registry.channels.map((channel) => {
          const item = readinessByChannel.get(channel.id);
          const health = channelReadinessLabel(item, channel.enabled);
          const issues = item?.issues || [];
          const nextAction = buildChannelNextAction(item, channel.enabled);

          return (
            <ChannelCard
              key={channel.id}
              channel={channel}
              defaultPublishSlots={registry.default_publish_slots}
              healthLabel={health.label}
              healthTone={health.tone}
              jobsInChannel={overview.jobs_by_channel[channel.id] || 0}
              pipelineCount={pipelineByChannel.get(channel.id) || 0}
              latestJobHref={item?.latest_job?.id ? `/jobs/${item.latest_job.id}` : nextAction.targetLink}
              latestJobLabel={item?.latest_job?.id ? "Cek Upload Terakhir" : nextAction.nextAction}
              nextActionHref={nextAction.targetLink}
              nextActionLabel={nextAction.nextAction}
              nextActionReason={nextAction.reason}
              readiness={item}
              statusLabel={item?.upload_ready ? "Siap" : issues.includes("missing_token") ? "Perlu Login YouTube" : issues.length ? "Perlu Review" : "Siap"}
            />
          );
        })}
      </div>
    </section>
  );
}
