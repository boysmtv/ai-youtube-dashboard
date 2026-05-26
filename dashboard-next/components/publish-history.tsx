import Link from "next/link";
import type { PublishHistoryPayload } from "../lib/engine-types";
import { businessJobStatus, businessUploadStatus, summaryText } from "../lib/business-copy";

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

export function PublishHistoryTable({
  history,
  limitLabel = "Recent history",
}: Readonly<{
  history: PublishHistoryPayload;
  limitLabel?: string;
}>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
        <div>
          <p className="ta-label text-brand-600">{limitLabel}</p>
          <p className="mt-1 text-xs text-gray-500">
            {history.total} riwayat dari {history.generated_at}
          </p>
        </div>
        <span className="ta-status bg-gray-100 text-gray-700">Riwayat upload</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Video</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Status Upload</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Riwayat Upload</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {history.items.length ? (
              history.items.map((item) => (
                <tr key={`${item.platform}-${item.record_id}`} className="border-b border-gray-100 text-gray-700 last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono">
                    <Link className="font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${item.job_id}`}>
                      Video #{item.job_id}
                    </Link>
                    <p className="mt-1 text-xs text-gray-500">{item.channel_id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                    <p className="mt-1 text-xs text-gray-500">{businessJobStatus(item.job_status)}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.created_at}</td>
                  <td className="max-w-md px-4 py-3 text-gray-500">
                    {summaryText(item.error_message || item.privacy_status || "Tidak ada catatan.")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-gray-500" colSpan={4}>
                  Belum ada riwayat publish.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
