"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveUploadJob, revokeUploadJob } from "../lib/engine-api";
import type { PublishQueueItem, UploadGuard } from "../lib/engine-types";
import { formatChannelProfile, formatUploadMode } from "../lib/localization";

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

function approvalLabel(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved") return "Disetujui";
  if (normalized === "expired") return "Kedaluwarsa";
  if (normalized === "revoked") return "Dicabut";
  return "Menunggu";
}

function normalizeHashtag(tag: string) {
  const cleaned = String(tag || "").trim();
  if (!cleaned) return "";
  const withoutPrefix = cleaned.replace(/^#+/, "");
  const normalized = withoutPrefix.replace(/[^A-Za-z0-9_]+/g, "");
  if (!normalized) return "";
  return normalized.toLowerCase() === "shorts" ? "#Shorts" : `#${normalized}`;
}

function HashtagPills({ hashtags }: Readonly<{ hashtags: string[] }>) {
  const normalized = Array.from(
    new Map(
      hashtags
        .map(normalizeHashtag)
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item]),
    ).values(),
  );

  if (!normalized.length) {
    return <span className="text-xs text-gray-500">Belum ada hashtag</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {normalized.slice(0, 5).map((tag) => (
        <span key={tag} className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700">
          {tag}
        </span>
      ))}
    </div>
  );
}

export function UploadApprovalPanel({
  items,
  uploadGuard,
  title = "Video siap review",
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
        <span className="ta-status bg-warning-50 text-warning-700">{items.length} video</span>
      </div>
      <div className="mt-4 rounded-xl border border-warning-200 bg-warning-50 p-4 text-sm text-warning-900">
        <strong className="block">Status sistem</strong>
        <p className="mt-2">
          Pastikan sumber video/audio memenuhi aturan sistem sebelum upload dijalankan.
        </p>
      </div>
      {notice ? <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">{notice}</div> : null}
      <div className="mt-5 grid gap-4">
        {items.length === 0 ? (
          <div className="ta-empty">Belum ada video yang menunggu keputusan upload.</div>
        ) : (
          items.map((item) => {
            const reviewSummary = item.review_summary as
              | {
                  final_title?: string | null;
                  recommended_title?: string | null;
                  final_hashtags?: string[];
                  recommended_hashtags?: string[];
                  production_ready?: boolean;
                  system_compliance_reason?: string | null;
                  system_compliance_label?: string | null;
                }
              | undefined;
            const hashtagSource = reviewSummary?.final_hashtags?.length ? reviewSummary.final_hashtags : reviewSummary?.recommended_hashtags || [];
            const titleSource = reviewSummary?.final_title || reviewSummary?.recommended_title || item.selected_title || "Belum dipilih";
            const previewReady = Boolean(item.publish_state.youtube.available);
            const productionReady = Boolean(reviewSummary?.production_ready ?? item.review_summary?.auto_copyright_approved);
            const approvalBlockedReason = !previewReady
              ? "Preview video belum tersedia. Buka detail video untuk meninjau hasil render."
              : !productionReady
                ? reviewSummary?.system_compliance_reason || reviewSummary?.system_compliance_label || "Aset belum aman untuk approval."
                : null;

            return (
            <div key={item.job.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link className="text-sm font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${item.job.id}`}>
                    Video #{item.job.id}
                  </Link>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatChannelProfile({ id: item.job.channel_id, niche: item.job.niche })}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">Judul Shorts: {titleSource}</p>
                  <div className="mt-2">
                    <HashtagPills hashtags={hashtagSource} />
                  </div>
                  <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-600">
                    <p className="font-semibold text-gray-900">Review gate</p>
                    <p className="mt-1">Preview video: {previewReady ? "Tersedia" : "Belum tersedia"}</p>
                    <p className="mt-1">Production gate: {productionReady ? "Lulus" : "Belum lulus"}</p>
                    {approvalBlockedReason ? <p className="mt-2 text-warning-700">{approvalBlockedReason}</p> : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Waktu target {item.job.publish_at}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="ta-status bg-white text-gray-700">{item.selected_title || "Judul belum dipilih"}</span>
                  <span className="ta-status bg-gray-900 text-white">Skor potensi viral {item.viral_score ?? "Belum ada"}</span>
                  <span className={`ta-status ${item.review_summary?.auto_copyright_approved ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700"}`}>
                    {formatUploadMode(item.review_summary?.selected_upload_mode || "private_validation")}
                  </span>
                </div>
              </div>

              {item.review_summary ? (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                  <p className="ta-label text-brand-600">Ringkasan sistem</p>
                  <p className="mt-2">
                    {item.review_summary.system_compliance_label || (item.review_summary.auto_copyright_approved ? "Aman berdasarkan aturan sistem." : "Belum siap untuk production.")}{" "}
                    {item.review_summary.system_compliance_reason || "Tidak ada hambatan sistem."}
                  </p>
                  {item.review_summary.system_compliance_next_action ? <p className="mt-2 text-xs text-gray-500">Langkah berikutnya: {item.review_summary.system_compliance_next_action}</p> : null}
                  <p className="mt-2 text-xs text-gray-500">Mode upload: {formatUploadMode(item.review_summary.selected_upload_mode || "private_validation")}</p>
                </div>
              ) : null}

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
                        <span className={`ta-status ${approvalTone(status)}`}>{approvalLabel(status)}</span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <p>Disetujui oleh: {String(approval?.approved_by || "Belum ada")}</p>
                        <p>Catatan: {String(approval?.note || uploadGuard.reason)}</p>
                        <p>Kedaluwarsa: {String(approval?.expires_at || "Belum diatur")}</p>
                      </div>

                      {isActive ? (
                        <form
                          className="mt-4 grid gap-3"
                          onSubmit={(event) => {
                            event.preventDefault();
                            submitRevocation(item.job.id, platform, event.currentTarget as HTMLFormElement);
                          }}
                        >
                          <input name="revoked_by" placeholder="Nama operator" required />
                          <input name="note" placeholder="Alasan pencabutan" />
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
                          <input name="approved_by" placeholder="Nama operator" required={uploadGuard.require_operator_name} />
                          <input name="note" placeholder={uploadGuard.reason} required={uploadGuard.require_reason} />
                          <input name="expires_in_minutes" placeholder={`${uploadGuard.session_minutes}`} defaultValue={String(uploadGuard.session_minutes)} />
                          <button
                            className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                            disabled={Boolean(approvalBlockedReason) || (isPending && pendingKey === `${item.job.id}:${platform}:approve`)}
                            type="submit"
                          >
                            Setujui {platformLabel(platform)}
                          </button>
                          {approvalBlockedReason ? <p className="text-xs text-warning-700">{approvalBlockedReason}</p> : null}
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
