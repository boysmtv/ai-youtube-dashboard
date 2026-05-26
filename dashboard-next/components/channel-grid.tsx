import Link from "next/link";
import type { ChannelReadinessPayload, OverviewPayload, RegistryPayload } from "../lib/engine-types";
import { channelProfileLabel, channelReadinessLabel } from "../lib/business-copy";
import { buildChannelNextAction } from "../lib/operator-workflow";

function lastUploadLabel(value: Record<string, unknown> | null | undefined) {
  if (!value) return "Belum ada";
  const createdAt = String(value.created_at || value.updated_at || value.approved_at || "Belum ada");
  const status = String(value.status || value.privacy_status || "unknown");
  return `${status} / ${createdAt}`;
}

function channelQueueHref(channelId: string, anchor: string) {
  return `/queue?channel_id=${encodeURIComponent(channelId)}${anchor}`;
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
        {registry.channels.map((channel) => (
          <article key={channel.id} id={`channel-${channel.id}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            {(() => {
              const item = readinessByChannel.get(channel.id);
              const health = channelReadinessLabel(item, channel.enabled);
              const issues = item?.issues || [];
              const nextAction = buildChannelNextAction(item, channel.enabled);
              return (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{channel.display_name || channel.id}</h4>
                      <p className="mt-1 text-sm text-gray-500">{channelProfileLabel(channel)}</p>
                    </div>
                    <span className={`ta-status ${health.tone}`}>{health.label}</span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Channel</span>
                      <strong className="text-gray-900">{channel.display_name || channel.id}</strong>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Strategy / profile</span>
                      <strong className="text-gray-900">{channelProfileLabel(channel)}</strong>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Status</span>
                      <strong className="text-gray-900">{item?.upload_ready ? "Siap" : issues.includes("missing_token") ? "Perlu Login YouTube" : issues.length ? "Perlu Review" : "Siap"}</strong>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Video aktif</span>
                      <strong className="text-gray-900">{overview.jobs_by_channel[channel.id] || 0}</strong>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Upload terakhir</span>
                      <strong className="text-gray-900">{lastUploadLabel(item?.last_upload as Record<string, unknown> | null | undefined)}</strong>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">Langkah berikutnya</span>
                      <strong className="text-gray-900">{nextAction.nextAction}</strong>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link className="rounded-lg border border-brand-100 bg-brand-25 px-3 py-2 text-sm font-semibold text-brand-700 hover:border-brand-200" href={channelQueueHref(channel.id, "#create-video")}>
                      Buat Video
                    </Link>
                    <Link className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href={channelQueueHref(channel.id, "#antrian")}>
                      Lihat Video
                    </Link>
                    <Link
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      href={item?.latest_job?.id ? `/jobs/${item.latest_job.id}` : nextAction.targetLink}
                    >
                      {item?.latest_job?.id ? "Cek Upload Terakhir" : nextAction.nextAction}
                    </Link>
                  </div>

                  <div className="mt-4 rounded-xl border border-brand-100 bg-brand-25 p-3 text-sm text-gray-700">
                    <p className="ta-label text-brand-600">Langkah berikutnya</p>
                    <p className="mt-2">{nextAction.reason}</p>
                    <div className="mt-3">
                      <Link className="ta-button" href={nextAction.targetLink}>
                        {nextAction.nextAction}
                      </Link>
                    </div>
                  </div>

                  <details className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between gap-3">
                        <span className="ta-label text-brand-600">Detail Teknis</span>
                        <span className="ta-status bg-gray-100 text-gray-700">Tutup / buka</span>
                      </div>
                    </summary>
                    <div className="mt-3 space-y-3 text-sm text-gray-700">
                      <div className="flex justify-between gap-4">
                        <span>Language</span>
                        <strong>{channel.language}</strong>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Publish slots</span>
                        <strong>{(channel.publish_slots.length ? channel.publish_slots : registry.default_publish_slots).join(", ")}</strong>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>OAuth token</span>
                        <strong>{item?.paths.token_exists ? "tersedia" : "belum ada"}</strong>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Client secret</span>
                        <strong>{item?.paths.client_secret_exists ? "tersedia" : "belum ada"}</strong>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span>Issue list</span>
                        <strong>{issues.length ? issues.join(", ") : "Tidak ada"}</strong>
                      </div>
                    </div>
                    </details>
                </>
              );
            })()}
          </article>
        ))}
      </div>
    </section>
  );
}
