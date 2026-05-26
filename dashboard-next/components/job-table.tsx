import type { JobRecord } from "../lib/engine-types";
import Link from "next/link";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import { StatusBadge } from "./status-badge";
import { friendlyErrorMessage } from "../lib/business-copy";
import {
  cancelDashboardJob,
  pauseDashboardJob,
  requeueDashboardJob,
  resumeDashboardJob,
  runDashboardJob,
} from "../app/jobs/actions";

export function JobTable({ jobs, canOperate = true }: Readonly<{ jobs: JobRecord[]; canOperate?: boolean }>) {
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
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Akses</th>
              {canOperate ? <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Aksi</th> : null}
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
                {canOperate ? (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {job.status === "queued" ? (
                        <form action={runDashboardJob}>
                          <input name="job_id" type="hidden" value={job.id} />
                          <input name="max_retries" type="hidden" value="3" />
                          <ConfirmSubmitButton message={`Jalankan video #${job.id}? Upload tetap nonaktif kecuali jalur review mengizinkan.`} pendingText="Running...">
                            Proses
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                      {["queued", "rendered"].includes(job.status) ? (
                        <form action={pauseDashboardJob}>
                          <input name="job_id" type="hidden" value={job.id} />
                          <ConfirmSubmitButton message={`Pause job #${job.id}?`} tone="warning" pendingText="Pausing...">
                            Jeda
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                      {job.status === "paused" ? (
                        <form action={resumeDashboardJob}>
                          <input name="job_id" type="hidden" value={job.id} />
                          <ConfirmSubmitButton message={`Resume job #${job.id}?`} tone="success" pendingText="Resuming...">
                            Lanjut
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                      {["failed", "rendered"].includes(job.status) ? (
                        <form action={requeueDashboardJob}>
                          <input name="job_id" type="hidden" value={job.id} />
                          <ConfirmSubmitButton message={`Requeue job #${job.id}? This may create another processing attempt.`} tone="muted" pendingText="Requeueing...">
                            Coba lagi
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                      {["queued", "paused", "failed", "rendered"].includes(job.status) ? (
                        <form action={cancelDashboardJob}>
                          <input name="job_id" type="hidden" value={job.id} />
                          <ConfirmSubmitButton message={`Cancel job #${job.id}?`} tone="danger" pendingText="Cancelling...">
                            Batalkan
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
