import {
  cancelDashboardJob,
  pauseDashboardJob,
  requeueDashboardJob,
  resumeDashboardJob,
  runDashboardJob,
} from "../app/jobs/actions";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import type { JobRecord, UploadGuard } from "../lib/engine-types";

export function JobControlPanel({ job, uploadGuard, canOperate }: Readonly<{ job: JobRecord; uploadGuard: UploadGuard; canOperate: boolean }>) {
  if (!canOperate) {
    return (
      <div className="ta-panel p-5">
        <p className="ta-label text-brand-600">Hanya lihat</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Akses kontrol dibatasi.</h3>
        <p className="mt-2 text-sm text-gray-500">Akun viewer bisa melihat video, tapi tidak bisa mengubah status proses.</p>
      </div>
    );
  }

  return (
    <div className="ta-panel p-5">
      <div>
        <p className="ta-label text-brand-600">Kontrol video</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Jalankan proses sesuai kebutuhan</h3>
        <p className="mt-1 text-sm text-gray-500">Jalur publish tetap dijaga oleh parameter review yang jelas.</p>
      </div>
      <form action={runDashboardJob} className="mt-5 grid gap-4">
        <input name="job_id" type="hidden" value={job.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Persetujuan upload
            <input name="upload_approval" placeholder={uploadGuard.confirmation_text} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Maksimal percobaan
            <input name="max_retries" type="number" min="0" max="10" placeholder="3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Nama operator
            <input name="approval_operator_name" placeholder="operator name" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Alasan
            <input name="approval_reason" placeholder={uploadGuard.reason} />
          </label>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-gray-700">
          <label className="flex items-center gap-2">
            <input className="ta-check" name="enable_upload" type="checkbox" />
            Aktifkan upload
          </label>
          <label className="flex items-center gap-2">
            <input className="ta-check" name="require_credentials" type="checkbox" />
            Wajib kredensial
          </label>
          <label className="flex items-center gap-2">
            <input className="ta-check" name="keep_downloads" type="checkbox" />
            Simpan unduhan
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {job.status === "queued" ? (
            <ConfirmSubmitButton className="px-5 py-3 text-sm" message={`Run job #${job.id} with the parameters entered above?`} pendingText="Running...">
              Jalankan
            </ConfirmSubmitButton>
          ) : null}
        </div>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {["queued", "ready_for_approval", "approval_required"].includes(job.status) ? (
          <form action={pauseDashboardJob}>
            <input name="job_id" type="hidden" value={job.id} />
            <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Pause job #${job.id}?`} tone="warning" pendingText="Pausing...">
              Jeda
            </ConfirmSubmitButton>
          </form>
        ) : null}
        {job.status === "paused" ? (
          <form action={resumeDashboardJob}>
            <input name="job_id" type="hidden" value={job.id} />
            <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Resume job #${job.id}?`} tone="success" pendingText="Resuming...">
              Lanjutkan
            </ConfirmSubmitButton>
          </form>
        ) : null}
        {["failed", "failed_final", "ready_for_approval", "approval_required"].includes(job.status) ? (
          <form action={requeueDashboardJob}>
            <input name="job_id" type="hidden" value={job.id} />
            <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Requeue job #${job.id}? This creates another processing attempt.`} tone="muted" pendingText="Requeueing...">
              Masukkan lagi
            </ConfirmSubmitButton>
          </form>
        ) : null}
        {["queued", "paused", "failed", "failed_final", "ready_for_approval", "approval_required"].includes(job.status) ? (
          <form action={cancelDashboardJob}>
            <input name="job_id" type="hidden" value={job.id} />
            <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Cancel job #${job.id}?`} tone="danger" pendingText="Cancelling...">
              Batalkan
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>
    </div>
  );
}
