"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublishHistoryPayload } from "../lib/engine-types";
import { businessJobStatus, businessUploadStatus, summaryText } from "../lib/business-copy";
import { formatChannelProfile } from "../lib/localization";

type SortKey = "video" | "status" | "upload" | "note";

function StatusBadge({ status }: Readonly<{ status: string }>) {
  const normalized = status.toLowerCase();
  const className =
    normalized === "published" || normalized === "uploaded" || normalized === "draft_ready"
      ? "bg-success-50 text-success-700"
      : normalized === "ready"
        ? "bg-brand-50 text-brand-700"
        : normalized === "failed"
          ? "bg-error-50 text-error-700"
          : "bg-gray-100 text-gray-700";
  return <span className={`ta-status ${className}`}>{businessUploadStatus(status)}</span>;
}

function sortableValue(item: PublishHistoryPayload["items"][number], key: SortKey) {
  switch (key) {
    case "video":
      return item.job_id;
    case "status":
      return item.status.toLowerCase();
    case "upload":
      return item.platform.toLowerCase();
    case "note":
      return (item.error_message || item.privacy_status || "").toLowerCase();
    default:
      return item.created_at;
  }
}

export function PublishHistoryTable({
  history,
  limitLabel = "Recent history",
}: Readonly<{
  history: PublishHistoryPayload;
  limitLabel?: string;
}>) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("upload");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const filtered = history.items.filter((item) => {
    if (!query.trim()) return true;
    const haystack = [item.job_id, item.channel_id, item.platform, item.status, item.privacy_status, item.error_message, item.youtube_url, item.tiktok_publish_id, item.tiktok_post_id]
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
    return b.record_id - a.record_id;
  });
  const updateSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setDirection(key === "video" ? "desc" : "asc");
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <p className="ta-label text-brand-600">{limitLabel}</p>
          <p className="mt-1 text-xs text-gray-500">
            {history.total} riwayat dari {history.generated_at}
          </p>
        </div>
        <input
          aria-label="Search publish history"
          className="min-w-[240px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-brand-300"
          placeholder="Cari video, status, atau catatan..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                <button className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-brand-600" type="button" onClick={() => updateSort("video")}>
                  Video
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                <button className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-brand-600" type="button" onClick={() => updateSort("status")}>
                  Status Upload
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                <button className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-brand-600" type="button" onClick={() => updateSort("upload")}>
                  Riwayat Upload
                </button>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">
                <button className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-brand-600" type="button" onClick={() => updateSort("note")}>
                  Catatan
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.length ? (
              sorted.map((item) => (
                <tr key={`${item.platform}-${item.record_id}`} className="cursor-pointer border-b border-gray-100 text-gray-700 last:border-b-0 hover:bg-gray-50" onClick={() => router.push(`/jobs/${item.job_id}`)}>
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${item.job_id}`}>
                      {item.youtube_url ? "Upload YouTube" : "Riwayat Upload"}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">Video #{item.job_id}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatChannelProfile({ id: item.channel_id, niche: item.channel_id })}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                    <p className="mt-1 text-xs text-gray-500">{businessJobStatus(item.job_status)}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.created_at}</td>
                  <td className="max-w-md px-4 py-3 text-gray-500">
                    {summaryText(item.error_message || item.privacy_status || "Tidak ada catatan.")}
                  </td>
                </tr>
              ))
            ) : null}
          </tbody>
        </table>
      </div>
      {!sorted.length ? <div className="border-t border-gray-100 px-4 py-6 text-sm text-gray-500">Belum ada riwayat publish.</div> : null}
    </div>
  );
}
