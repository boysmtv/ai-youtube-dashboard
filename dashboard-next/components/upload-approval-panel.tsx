"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveUploadJob, revokeUploadJob } from "../lib/engine-api";
import type { PublishQueueItem, UploadGuard } from "../lib/engine-types";

function platformLabel(platform: "youtube" | "tiktok") {
  return platform === "youtube" ? "YouTube" : "TikTok";
}

function approvalTone(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "bg-success-50 text-success-700";
  if (normalized === "expired") return "bg-warning-50 text-warning-700";
  if (normalized === "revoked") return "bg-error-50 text-error-700";
  return "bg-gray-100 text-gray-700";
}

export function UploadApprovalPanel({
  items,
  uploadGuard,
  title = "Ready items",
}: Readonly<{
  items: PublishQueueItem[];
  uploadGuard: UploadGuard;
  title?: string;
}>) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const submitApproval = (jobId: number, platform: "youtube" | "tiktok", form: HTMLFormElement) => {
    const formData = new FormData(form);
    const approvedBy = String(formData.get("approved_by") || "").trim();
    const note = String(formData.get("note") || "").trim();
    const expiresInMinutesText = String(formData.get("expires_in_minutes") || "").trim();
    const expiresInMinutes = expiresInMinutesText ? Number(expiresInMinutesText) : uploadGuard.session_minutes;
    setPendingKey(`${jobId}:${platform}:approve`);
    setNotice("");
    startTransition(async () => {
      try {
        await approveUploadJob(jobId, platform, {
          approved_by: approvedBy,
          note: note || uploadGuard.reason,
          expires_in_minutes: Number.isFinite(expiresInMinutes) ? expiresInMinutes : uploadGuard.session_minutes,
        });
        setNotice(`${platformLabel(platform)} untuk job #${jobId} sudah disetujui.`);
        router.refresh();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Approval gagal.");
      } finally {
        setPendingKey(null);
      }
    });
  };

  const submitRevocation = (jobId: number, platform: "youtube" | "tiktok", form: HTMLFormElement) => {
    const formData = new FormData(form);
    const revokedBy = String(formData.get("revoked_by") || "").trim();
    const note = String(formData.get("note") || "").trim();
    setPendingKey(`${jobId}:${platform}:revoke`);
    setNotice("");
    startTransition(async () => {
      try {
        await revokeUploadJob(jobId, platform, {
          revoked_by: revokedBy,
          note: note || "Approval revoked by operator.",
        });
        setNotice(`${platformLabel(platform)} untuk job #${jobId} sudah dicabut.`);
        router.refresh();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Revocation gagal.");
      } finally {
        setPendingKey(null);
      }
    });
  };

  return (
    <div className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Butuh persetujuan</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <span className="ta-status bg-warning-50 font-mono text-warning-700">{items.length} item(s)</span>
      </div>
      {notice ? <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{notice}</div> : null}
      <div className="mt-5 grid gap-4">
        {items.length === 0 ? (
          <div className="ta-empty">No items are waiting for manual approval.</div>
        ) : (
          items.map((item) => (
            <div key={item.job.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link className="font-mono text-sm font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${item.job.id}`}>
                    Job #{item.job.id}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.job.channel_id} / {item.job.niche}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Publish {item.job.publish_at}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="ta-status bg-white text-gray-700">{item.selected_title || "Judul belum dipilih"}</span>
                  <span className="ta-status bg-gray-900 text-white">Skor potensi viral {item.viral_score ?? "Not set"}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {(["youtube", "tiktok"] as const).map((platform) => {
                  const approval = item.publish_state.approvals.by_platform[platform] as Record<string, unknown> | undefined;
                  const status = String(approval?.status || "missing");
                  const isActive = Boolean(approval?.is_active);
                  return (
                    <div key={`${item.job.id}-${platform}`} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="ta-label text-brand-600">{platformLabel(platform)}</p>
                          <strong className="mt-1 block text-gray-900">{isActive ? "Siap upload" : "Butuh persetujuan"}</strong>
                        </div>
                        <span className={`ta-status ${approvalTone(status)}`}>{status}</span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <p>Approved by: {String(approval?.approved_by || "Belum ada")}</p>
                        <p>Note: {String(approval?.note || uploadGuard.reason)}</p>
                        <p>Expires: {String(approval?.expires_at || "Not set")}</p>
                      </div>

                      {isActive ? (
                        <form
                          className="mt-4 grid gap-3"
                          onSubmit={(event) => {
                            event.preventDefault();
                            submitRevocation(item.job.id, platform, event.currentTarget as HTMLFormElement);
                          }}
                        >
                          <input name="revoked_by" placeholder="operator name" required />
                          <input name="note" placeholder="Reason for revocation" />
                          <button
                            className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            disabled={isPending && pendingKey === `${item.job.id}:${platform}:revoke`}
                            type="submit"
                          >
                            Cabut persetujuan
                          </button>
                        </form>
                      ) : (
                        <form
                          className="mt-4 grid gap-3"
                          onSubmit={(event) => {
                            event.preventDefault();
                            submitApproval(item.job.id, platform, event.currentTarget as HTMLFormElement);
                          }}
                        >
                          <input name="approved_by" placeholder="operator name" required={uploadGuard.require_operator_name} />
                          <input name="note" placeholder={uploadGuard.reason} required={uploadGuard.require_reason} />
                          <input name="expires_in_minutes" placeholder={`${uploadGuard.session_minutes}`} defaultValue={String(uploadGuard.session_minutes)} />
                          <button
                            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            disabled={isPending && pendingKey === `${item.job.id}:${platform}:approve`}
                            type="submit"
                          >
                            Setujui {platformLabel(platform)}
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
