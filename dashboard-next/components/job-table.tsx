import type { JobRecord } from "../lib/engine-types";
import Link from "next/link";
import { StatusBadge } from "./status-badge";
import { friendlyErrorMessage } from "../lib/business-copy";

function lower(value: string) {
  return value.trim().toLowerCase();
}

function jobPrimaryAction(job: JobRecord) {
  const status = lower(job.status);
  if (["queued", "searching", "downloaded", "transcribed", "planned", "voiceover", "rendering", "uploading", "processing"].includes(status)) {
    return { label: "Lihat Detail", href: `/jobs/${job.id}` };
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

export function JobTable({ jobs, canOperate = true }: Readonly<{ jobs: JobRecord[]; canOperate?: boolean }>) {
  if (!jobs.length) {
    return (
      <div className="ta-panel p-5">
        <p className="ta-label text-brand-600">Antrian kosong</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Tidak ada video dalam antrian.</h3>
        <p className="mt-2 text-sm text-gray-500">Mulai dari Buat Video untuk menaruh pekerjaan pertama, atau buka Review & Upload jika ada video yang sudah siap.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link className="ta-button" href="/queue#create-video">
            Buat Video Baru
          </Link>
          <Link className="ta-button-muted" href="/publish">
            Lihat Review & Upload
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-panel">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Video</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Channel</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Target Waktu</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Percobaan</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Alasan</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Aksi Utama</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-gray-100 text-gray-700 last:border-b-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono">
                  <Link className="font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${job.id}`}>
                    ID Video #{job.id}
                  </Link>
                  <div className="mt-2 space-y-1">
                    <p className="max-w-sm truncate text-xs text-gray-500">{job.selected_title || job.niche || "Topik belum dipilih"}</p>
                    <p className="text-xs text-gray-500">
                      {job.viral_score !== null && job.viral_score !== undefined ? `Skor potensi viral ${job.viral_score}` : "Skor potensi viral belum tersedia"}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">{job.channel_id}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{job.publish_at}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={job.status} />
                  <p className="mt-2 text-xs text-gray-500">
                    {job.current_stage ? `Tahap saat ini: ${job.current_stage}` : "Tahap belum tersedia"}
                    {job.progress_percent !== null && job.progress_percent !== undefined ? ` / ${job.progress_percent.toFixed(0)}%` : ""}
                  </p>
                </td>
                <td className="px-4 py-3">{job.retry_count}</td>
                <td className="max-w-md px-4 py-3 text-gray-500">{job.last_error ? friendlyErrorMessage(job.last_error) : "Tidak ada"}</td>
                <td className="px-4 py-3">
                  <Link className="inline-flex rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" href={`/jobs/${job.id}`}>
                    Lihat Preview
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {(() => {
                    const action = jobPrimaryAction(job);
                    return (
                      <div className="flex flex-col gap-2">
                        <Link className="inline-flex rounded-lg border border-brand-100 bg-brand-25 px-3 py-2 text-sm font-semibold text-brand-700 hover:border-brand-200" href={action.href}>
                          {action.label}
                        </Link>
                        <span className="text-xs text-gray-500">{canOperate ? "Aksi utama operator" : "Lihat detail untuk tindak lanjut."}</span>
                      </div>
                    );
                  })()}
                </td>
            </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
