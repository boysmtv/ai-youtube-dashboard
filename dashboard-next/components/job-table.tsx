"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JobRecord } from "../lib/engine-types";
import { businessJobStatus } from "../lib/business-copy";
import { formatChannelProfile, formatChannelName } from "../lib/localization";
import { StatusBadge } from "./status-badge";

function lower(value: string) {
  return value.trim().toLowerCase();
}

function jobPrimaryAction(job: JobRecord) {
  const status = lower(job.status);
  if (["queued", "searching", "downloaded", "transcribed", "planned", "voiceover", "rendering", "uploading", "processing"].includes(status)) {
    return { label: "Lihat Proses", href: `/jobs/${job.id}` };
  }
  if (status === "rendered") {
    return { label: "Review Video", href: `/jobs/${job.id}#review` };
  }
  if (["failed", "cancelled", "canceled", "blocked"].includes(status)) {
    return { label: "Cek Masalah", href: `/jobs/${job.id}#detail-teknis` };
  }
  if (["uploaded", "published", "draft_ready", "completed"].includes(status)) {
    return { label: "Lihat Riwayat Upload", href: "/publish#history" };
  }
  if (status === "paused") {
    return { label: "Lanjutkan", href: `/jobs/${job.id}` };
  }
  return { label: "Lihat Detail", href: `/jobs/${job.id}` };
}

type SortKey = "id" | "channel" | "title" | "status" | "progress" | "stage" | "updated" | "upload";

function sortableValue(job: JobRecord, key: SortKey) {
  switch (key) {
    case "id":
      return job.id;
    case "channel":
      return job.channel_id.toLowerCase();
    case "title":
      return (job.selected_title || formatChannelProfile({ id: job.channel_id, niche: job.niche }) || "").toLowerCase();
    case "status":
      return job.status.toLowerCase();
    case "progress":
      return Number(job.progress_percent ?? 0);
    case "stage":
      return (job.current_stage || job.status).toLowerCase();
    case "updated":
      return new Date(job.updated_at || job.publish_at || 0).getTime();
    case "upload":
      return ["uploaded", "published", "draft_ready", "completed"].includes(job.status.toLowerCase()) ? 1 : 0;
    default:
      return 0;
  }
}

function SortHeader({
  label,
  keyName,
  activeKey,
  direction,
  onClick,
}: Readonly<{
  label: string;
  keyName: SortKey;
  activeKey: SortKey;
  direction: "asc" | "desc";
  onClick: (key: SortKey) => void;
}>) {
  const active = activeKey === keyName;
  return (
    <button
      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-brand-600"
      type="button"
      onClick={() => onClick(keyName)}
    >
      {label}
      <span className={`text-[10px] ${active ? "text-brand-600" : "text-gray-300"}`}>{active ? (direction === "asc" ? "^" : "v") : "<>"}</span>
    </button>
  );
}

export function JobTable({ jobs, canOperate = true }: Readonly<{ jobs: JobRecord[]; canOperate?: boolean }>) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  if (!jobs.length) {
    return (
      <div className="ta-panel p-5">
        <p className="ta-label text-brand-600">Antrian kosong</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Belum ada video.</h3>
        <p className="mt-2 text-sm text-gray-500">Mulai dari buat video baru, atau buka Review & Upload jika ada video yang sudah siap dicek.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="ta-button" href="/queue#create-video">
            Buat Video Baru
          </Link>
          <Link className="ta-button-muted" href="/publish">
            Review & Upload
          </Link>
          <Link className="ta-button-muted" href="/channels">
            Cek Channel
          </Link>
        </div>
      </div>
    );
  }

  const filtered = jobs.filter((job) => {
    if (!query.trim()) return true;
    const haystack = [job.id, job.channel_id, job.niche, job.status, job.current_stage, job.last_error, job.selected_title, job.viral_score, job.publish_at]
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
    return b.id - a.id;
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
          <p className="ta-label text-brand-600">Daftar video</p>
          <p className="text-sm text-gray-500">{sorted.length} item ditampilkan</p>
        </div>
        <input
          aria-label="Search jobs"
          className="min-w-[240px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none ring-0 focus:border-brand-300"
          placeholder="Cari judul, channel, status..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3">
                <SortHeader label="Video" keyName="id" activeKey={sortKey} direction={direction} onClick={updateSort} />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Channel" keyName="channel" activeKey={sortKey} direction={direction} onClick={updateSort} />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Judul" keyName="title" activeKey={sortKey} direction={direction} onClick={updateSort} />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Status" keyName="status" activeKey={sortKey} direction={direction} onClick={updateSort} />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Progress" keyName="progress" activeKey={sortKey} direction={direction} onClick={updateSort} />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Tahap" keyName="stage" activeKey={sortKey} direction={direction} onClick={updateSort} />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Update Terakhir" keyName="updated" activeKey={sortKey} direction={direction} onClick={updateSort} />
              </th>
              <th className="px-4 py-3">
                <SortHeader label="Upload" keyName="upload" activeKey={sortKey} direction={direction} onClick={updateSort} />
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((job) => {
              const action = jobPrimaryAction(job);
              const uploaded = ["uploaded", "published", "draft_ready", "completed"].includes(job.status.toLowerCase());
              return (
                <tr
                  key={job.id}
                  className="cursor-pointer border-b border-gray-100 text-gray-700 last:border-b-0 hover:bg-gray-50"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-sm">
                    <div className="font-semibold text-gray-900">{job.selected_title || "Judul belum dipilih"}</div>
                    <p className="mt-1 text-xs text-gray-500">Video #{job.id}</p>
                    <p className="mt-1 text-xs text-gray-500">{job.publish_at}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{formatChannelName({ id: job.channel_id, niche: job.niche })}</div>
                    <p className="mt-1 text-xs text-gray-500">{formatChannelProfile({ id: job.channel_id, niche: job.niche })}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="max-w-sm truncate text-gray-900">{job.selected_title || "Judul belum dipilih"}</p>
                    <p className="mt-1 text-xs text-gray-500">{job.viral_score !== null && job.viral_score !== undefined ? `Skor viral ${job.viral_score}` : "Skor viral belum tersedia"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{Math.round(Number(job.progress_percent ?? 0))}%</div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.max(0, Math.min(100, Number(job.progress_percent ?? 0)))}%` }} />
                    </div>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 text-sm text-gray-600">
                    <p>{job.current_stage ? businessJobStatus(job.current_stage) : businessJobStatus(job.status)}</p>
                    {job.retry_count ? <p className="mt-1 text-xs text-gray-500">Retry {job.retry_count}x</p> : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{job.updated_at || job.publish_at}</td>
                  <td className="px-4 py-3">
                    <span className={`ta-status ${uploaded ? "bg-success-50 text-success-700" : "bg-gray-100 text-gray-700"}`}>{uploaded ? "Sudah Upload Private" : "Menunggu"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2" onClick={(event) => event.stopPropagation()}>
                      <Link className="inline-flex rounded-lg border border-brand-100 bg-brand-25 px-3 py-2 text-sm font-semibold text-brand-700 hover:border-brand-200" href={action.href}>
                        {action.label}
                      </Link>
                      <span className="text-xs text-gray-500">{canOperate ? "Aksi operator" : "Lihat detail untuk tindak lanjut."}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!sorted.length ? <div className="border-t border-gray-100 p-4 text-sm text-gray-500">Tidak ada hasil untuk pencarian ini.</div> : null}
    </div>
  );
}
