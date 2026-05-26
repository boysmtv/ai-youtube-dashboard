import type { ApprovalAudit } from "../lib/engine-types";

export function ApprovalList({ approvals }: Readonly<{ approvals: ApprovalAudit[] }>) {
  return (
    <div className="grid gap-3">
      {approvals.length === 0 ? (
        <div className="ta-empty">Belum ada riwayat persetujuan.</div>
      ) : (
        approvals.map((approval) => (
          <article key={approval.id} className="ta-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="ta-label text-brand-600">
                  {approval.job_id ? `Job #${approval.job_id}` : "Worker run"}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">Riwayat persetujuan</h3>
              </div>
              <span className="ta-status bg-warning-50 font-mono text-warning-700">{approval.session_minutes}m session</span>
            </div>
            <p className="mt-4 text-gray-700">{approval.action}</p>
            <p className="mt-2 text-gray-700">{approval.approval_reason || "Belum ada alasan."}</p>
            <p className="mt-4 font-mono text-xs text-gray-500">
              {approval.operator_name || "unknown operator"} / {approval.created_at}
            </p>
          </article>
        ))
      )}
    </div>
  );
}
