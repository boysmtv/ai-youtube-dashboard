"use client";

import Link from "next/link";
import { useState } from "react";
import type { ChannelReadinessItem, ChannelConfig } from "../lib/engine-types";
import { formatChannelName, formatChannelProfile, formatIssueList } from "../lib/localization";

type ChannelCardProps = Readonly<{
  channel: ChannelConfig;
  readiness: ChannelReadinessItem | undefined;
  jobsInChannel: number;
  pipelineCount: number;
  defaultPublishSlots: string[];
  healthLabel: string;
  healthTone: string;
  statusLabel: string;
  nextActionLabel: string;
  nextActionReason: string;
  nextActionHref: string;
  latestJobHref: string;
  latestJobLabel: string;
}>;

export function ChannelCard({
  channel,
  readiness,
  jobsInChannel,
  pipelineCount,
  defaultPublishSlots,
  healthLabel,
  healthTone,
  statusLabel,
  nextActionLabel,
  nextActionReason,
  nextActionHref,
  latestJobHref,
  latestJobLabel,
}: ChannelCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const issues = readiness?.issues || [];
  const publishSlots = channel.publish_slots.length ? channel.publish_slots : defaultPublishSlots;

  return (
    <article id={`channel-${channel.id}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{formatChannelName(channel)}</h4>
          <p className="mt-1 text-sm text-gray-500">{formatChannelProfile(channel)}</p>
        </div>
        <span className={`ta-status ${healthTone}`}>{healthLabel}</span>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Channel</span>
          <strong className="text-gray-900">{formatChannelName(channel)}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Profil channel</span>
          <strong className="text-gray-900">{formatChannelProfile(channel)}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Status</span>
          <strong className="text-gray-900">{statusLabel}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Video aktif</span>
          <strong className="text-gray-900">{jobsInChannel}</strong>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">Pipeline aktif</span>
          <strong className={pipelineCount >= 3 ? "text-warning-700" : "text-gray-900"}>{pipelineCount}</strong>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="rounded-lg border border-brand-100 bg-brand-25 px-3 py-2 text-sm font-semibold text-brand-700 hover:border-brand-200" href={`/queue?channel_id=${encodeURIComponent(channel.id)}#create-video`}>
          Buat Video
        </Link>
        <Link className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href={`/queue?channel_id=${encodeURIComponent(channel.id)}#antrian`}>
          Lihat Video
        </Link>
        <Link className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href={latestJobHref}>
          {latestJobLabel}
        </Link>
      </div>

      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-25 p-3 text-sm text-gray-700">
        <p className="ta-label text-brand-600">Langkah berikutnya</p>
        <p className="mt-2">{pipelineCount >= 3 ? "Batas 3 video per channel sudah penuh." : nextActionReason}</p>
        <div className="mt-3">
          <Link className="ta-button" href={nextActionHref}>
            {nextActionLabel}
          </Link>
        </div>
      </div>

      <button
        className="mt-4 inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        type="button"
        onClick={() => setDetailsOpen((current) => !current)}
      >
        {detailsOpen ? "Sembunyikan detail" : "Buka detail"}
      </button>

      {detailsOpen ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="ta-label text-brand-600">Detail Teknis</span>
            <span className="ta-status bg-gray-100 text-gray-700">Muat sesuai kebutuhan</span>
          </div>
          <div className="mt-3 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between gap-4">
              <span>Bahasa</span>
              <strong>{channel.language}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Slot kerja</span>
              <strong>{publishSlots.join(", ")}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Status login YouTube</span>
              <strong>{readiness?.paths.token_exists ? "tersedia" : "belum ada"}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Client secret</span>
              <strong>{readiness?.paths.client_secret_exists ? "tersedia" : "belum ada"}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Catatan teknis</span>
              <strong>{issues.length ? formatIssueList(issues) : "Tidak ada"}</strong>
            </div>
            <div className="flex justify-between gap-4">
              <span>Profil ringkas</span>
              <strong>{channel.enabled ? "Aktif" : "Nonaktif"}</strong>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
