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
        <p className="ta-label text-brand-600">Read only</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Akses kontrol dibatasi.</h3>
        <p className="mt-2 text-sm text-gray-500">Akun viewer bisa melihat video, tapi tidak bisa mengubah status proses.</p>
      </div>
    );
  }

  return (
    <div className="ta-panel p-5">
      <div>
        <p className="ta-label text-brand-600">Kontrol teknis</p>
        <h3 className="mt-2 text-lg font-semibold text-gray-900">Jalankan dengan parameter eksplisit</h3>
        <p className="mt-1 text-sm text-gray-500">Jalur publish tetap dijaga oleh parameter review yang jelas.</p>
      </div>
      <form action={runDashboardJob} className="mt-5 grid gap-4">
        <input name="job_id" type="hidden" value={job.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Upload approval
            <input name="upload_approval" placeholder={uploadGuard.confirmation_text} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Max retries
            <input name="max_retries" type="number" min="0" max="10" placeholder="3" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Operator
            <input name="approval_operator_name" placeholder="operator name" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Reason
            <input name="approval_reason" placeholder={uploadGuard.reason} />
          </label>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-gray-700">
          <label className="flex items-center gap-2">
            <input className="ta-check" name="enable_upload" type="checkbox" />
            Enable upload
          </label>
          <label className="flex items-center gap-2">
            <input className="ta-check" name="require_credentials" type="checkbox" />
            Require credentials
          </label>
          <label className="flex items-center gap-2">
            <input className="ta-check" name="keep_downloads" type="checkbox" />
            Keep downloads
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {job.status === "queued" ? (
            <ConfirmSubmitButton className="px-5 py-3 text-sm" message={`Run job #${job.id} with the parameters entered above?`} pendingText="Running...">
              Run
            </ConfirmSubmitButton>
          ) : null}
        </div>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        {["queued", "rendered"].includes(job.status) ? (
          <form action={pauseDashboardJob}>
            <input name="job_id" type="hidden" value={job.id} />
            <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Pause job #${job.id}?`} tone="warning" pendingText="Pausing...">
              Pause
            </ConfirmSubmitButton>
          </form>
        ) : null}
        {job.status === "paused" ? (
          <form action={resumeDashboardJob}>
            <input name="job_id" type="hidden" value={job.id} />
            <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Resume job #${job.id}?`} tone="success" pendingText="Resuming...">
              Resume
            </ConfirmSubmitButton>
          </form>
        ) : null}
        {["failed", "rendered"].includes(job.status) ? (
          <form action={requeueDashboardJob}>
            <input name="job_id" type="hidden" value={job.id} />
            <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Requeue job #${job.id}? This creates another processing attempt.`} tone="muted" pendingText="Requeueing...">
              Requeue
            </ConfirmSubmitButton>
          </form>
        ) : null}
        {["queued", "paused", "failed", "rendered"].includes(job.status) ? (
          <form action={cancelDashboardJob}>
            <input name="job_id" type="hidden" value={job.id} />
            <ConfirmSubmitButton className="px-4 py-2 text-sm" message={`Cancel job #${job.id}?`} tone="danger" pendingText="Cancelling...">
              Cancel
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>
    </div>
  );
}
