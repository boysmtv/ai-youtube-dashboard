"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublishQueueItem } from "../lib/engine-types";
import { businessJobStatus, businessUploadStatus } from "../lib/business-copy";
import { formatChannelProfile, formatChannelName, formatUploadMode } from "../lib/localization";

type SortKey = "id" | "channel" | "title" | "status" | "system" | "upload" | "updated";

function toneBadge(value: boolean | undefined) {
  if (value === true) return "bg-success-50 text-success-700";
  if (value === false) return "bg-warning-50 text-warning-700";
  return "bg-gray-100 text-gray-700";
}

function normalizeHashtag(tag: string) {
  const cleaned = String(tag || "").trim();
  if (!cleaned) return "";
  const withoutPrefix = cleaned.replace(/^#+/, "");
  const normalized = withoutPrefix.replace(/[^A-Za-z0-9_]+/g, "");
  if (!normalized) return "";
  return normalized.toLowerCase() === "shorts" ? "#Shorts" : `#${normalized}`;
}

function HashtagPills({ hashtags }: Readonly<{ hashtags: string[] }>) {
  const normalized = Array.from(
    new Map(
      hashtags
        .map(normalizeHashtag)
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item]),
    ).values(),
  );

  if (!normalized.length) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {normalized.slice(0, 4).map((tag) => (
        <span key={tag} className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600">
          {tag}
        </span>
      ))}
    </div>
  );
}

function sortableValue(item: PublishQueueItem, key: SortKey) {
  switch (key) {
    case "id":
      return item.job.id;
    case "channel":
      return item.job.channel_id.toLowerCase();
    case "title":
      return (item.review_summary?.final_title || item.selected_title || item.job.selected_title || "").toLowerCase();
    case "status":
      return item.status.toLowerCase();
    case "system":
      return item.review_summary?.auto_copyright_approved ? 1 : 0;
    case "upload":
      return (item.publish_state.youtube.status || "").toLowerCase();
    case "updated":
      return new Date(item.job.updated_at || item.job.publish_at || 0).getTime();
    default:
      return 0;
  }
}

export function PublishQueueTable({
  items,
  title = "Video yang perlu ditinjau",
}: Readonly<{
  items: PublishQueueItem[];
  title?: string;
}>) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const filtered = items.filter((item) => {
    if (!query.trim()) return true;
    const haystack = [item.job.id, item.job.channel_id, item.job.niche, item.status, item.review_summary?.final_title, item.selected_title, item.publish_state.youtube.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const sorted = [...filtered].sort((a, b) => {
    const left = sortableValue(a, sortKey);
    const right = sortableValue(b, sortKey);
    if (left < right) return direction === "asc" ? -1 : 1;
    if (left > right) return direction === "asc" ? 1 : -1;
    return b.job.id - a.job.id;
  });

  const updateSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection(key === "id" || key === "updated" ? "desc" : "asc");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <p className="ta-label text-brand-600">{title}</p>
          <p className="mt-1 text-xs text-gray-500">{sorted.length} item ditampilkan</p>
        </div>
        <input
          aria-label="Search queue items"
          className="min-w-[240px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-300"
          placeholder="Cari judul, channel, status..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                <button className="text-xs font-semibold uppercase tracking-wide hover:text-brand-600" type="button" onClick={() => updateSort("id")}>
                  ID Video
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                <button className="text-xs font-semibold uppercase tracking-wide hover:text-brand-600" type="button" onClick={() => updateSort("channel")}>
                  Channel
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                <button className="text-xs font-semibold uppercase tracking-wide hover:text-brand-600" type="button" onClick={() => updateSort("title")}>
                  Judul
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                <button className="text-xs font-semibold uppercase tracking-wide hover:text-brand-600" type="button" onClick={() => updateSort("status")}>
                  Status
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                <button className="text-xs font-semibold uppercase tracking-wide hover:text-brand-600" type="button" onClick={() => updateSort("system")}>
                  Sistem
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                <button className="text-xs font-semibold uppercase tracking-wide hover:text-brand-600" type="button" onClick={() => updateSort("upload")}>
                  Upload
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                <button className="text-xs font-semibold uppercase tracking-wide hover:text-brand-600" type="button" onClick={() => updateSort("updated")}>
                  Update Terakhir
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length ? (
              sorted.map((item) => {
                const reviewAllowed = Boolean(item.review_summary?.auto_copyright_approved);
                const copyStatus = item.review_summary?.system_compliance_label || (reviewAllowed ? "Aman berdasarkan aturan sistem" : "Belum siap");
                const uploadStatus = item.publish_state.youtube.status || item.status;
                const reviewSummary = item.review_summary as
                  | {
                      final_title?: string | null;
                      recommended_title?: string | null;
                      final_hashtags?: string[];
                      recommended_hashtags?: string[];
                    }
                  | undefined;
                const hashtagSource = reviewSummary?.final_hashtags?.length ? reviewSummary.final_hashtags : reviewSummary?.recommended_hashtags || [];
                return (
                  <tr key={item.job.id} className="cursor-pointer border-b border-gray-100 text-gray-700 last:border-b-0 hover:bg-gray-50" onClick={() => router.push(`/jobs/${item.job.id}`)}>
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${item.job.id}`}>
                      {item.review_summary?.final_title || item.selected_title || item.job.selected_title || "Judul belum dipilih"}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">Video #{item.job.id}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatChannelProfile({ id: item.job.channel_id, niche: item.job.niche })}</p>
                    <HashtagPills hashtags={hashtagSource} />
                  </td>
                  <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{formatChannelName({ id: item.job.channel_id, niche: item.job.niche })}</div>
                      <p className="mt-1 text-xs text-gray-500">{item.job.publish_at}</p>
                  </td>
                  <td className="px-4 py-3">
                      <p className="max-w-sm truncate text-gray-900">{item.review_summary?.final_title || item.selected_title || item.job.selected_title || "Judul belum dipilih"}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatUploadMode(item.review_summary?.selected_upload_mode || "private_validation")}</p>
                  </td>
                    <td className="px-4 py-3">
                      <span className={`ta-status ${toneBadge(reviewAllowed)}`}>{businessJobStatus(item.status)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`ta-status ${toneBadge(reviewAllowed)}`}>{copyStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`ta-status ${uploadStatus === "uploaded" || uploadStatus === "published" || uploadStatus === "draft_ready" ? "bg-success-50 text-success-700" : "bg-gray-100 text-gray-700"}`}>{businessUploadStatus(uploadStatus)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{item.job.updated_at || item.job.publish_at}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2" onClick={(event) => event.stopPropagation()}>
                        <Link className="inline-flex rounded-lg border border-brand-100 bg-brand-25 px-3 py-2 text-sm font-semibold text-brand-700 hover:border-brand-200" href={`/jobs/${item.job.id}`}>
                          Detail
                        </Link>
                        <Link className="inline-flex rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href="/publish">
                          Review
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={8}>
                  Tidak ada hasil untuk pencarian ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
