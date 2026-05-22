import Link from "next/link";
import { approveUploadJob } from "../app/approvals/actions";
import { ConfirmSubmitButton } from "./confirm-submit-button";
import { StatusBadge } from "./status-badge";
import type { JobRecord, UploadGuard } from "../lib/engine-types";

export function UploadApprovalPanel({
  jobs,
  uploadGuard,
}: Readonly<{
  jobs: JobRecord[];
  uploadGuard: UploadGuard;
}>) {
  return (
    <div className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Ready items</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Approve and push selected items</h3>
        </div>
        <span className="ta-status bg-warning-50 font-mono text-warning-700">{jobs.length} rendered</span>
      </div>
      <div className="mt-5 grid gap-4">
        {jobs.length === 0 ? (
          <div className="ta-empty">No items are waiting for publish approval.</div>
        ) : (
          jobs.map((job) => (
            <form key={job.id} action={approveUploadJob} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <input name="job_id" type="hidden" value={job.id} />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link className="font-mono text-sm font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${job.id}`}>
                    Job #{job.id}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500">{job.channel_id} / {job.niche}</p>
                  <p className="mt-1 text-xs text-gray-500">Publish {job.publish_at}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Approval phrase
                  <input
                    name="upload_approval"
                    required={uploadGuard.enabled}
                    placeholder={uploadGuard.confirmation_text}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Operator
                  <input
                    name="approval_operator_name"
                    required={uploadGuard.require_operator_name}
                    placeholder="operator name"
                  />
                </label>
              </div>
              <label className="mt-4 grid gap-2 text-sm font-semibold text-gray-700">
                Approval reason
                <textarea
                  name="approval_reason"
                  required={uploadGuard.require_reason}
                  placeholder={uploadGuard.reason}
                  className="min-h-24"
                />
              </label>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-4 text-sm font-semibold text-gray-700">
                  <label className="flex items-center gap-2">
                    <input className="ta-check" name="require_credentials" type="checkbox" defaultChecked />
                    Require credentials
                  </label>
                  <label className="flex items-center gap-2">
                    <input className="ta-check" name="keep_downloads" type="checkbox" />
                    Keep downloads
                  </label>
                </div>
                <ConfirmSubmitButton className="px-5 py-3 text-sm" message={`Approve publish for job #${job.id}? This can publish to YouTube when credentials and guard pass.`}>
                  Approve and push
                </ConfirmSubmitButton>
              </div>
            </form>
          ))
        )}
      </div>
    </div>
  );
}
