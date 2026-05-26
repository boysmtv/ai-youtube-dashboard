import { businessJobStatus, businessJobStatusTone } from "../lib/business-copy";

export function StatusBadge({ status }: Readonly<{ status: string }>) {
  return <span className={`ta-status ${businessJobStatusTone(status)}`}>{businessJobStatus(status)}</span>;
}
