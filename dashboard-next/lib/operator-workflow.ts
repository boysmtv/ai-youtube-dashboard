import type { ChannelReadinessItem, JobRecord, OverviewPayload, PublishStatePayload, ReviewSummary } from "./engine-types";
import { businessJobStatus, businessUploadStatus, friendlyErrorMessage } from "./business-copy";

export type OperatorWorkflowStatus = "done" | "current" | "blocked" | "pending";

export type OperatorWorkflowStep = {
  key: string;
  number: number;
  label: string;
  status: OperatorWorkflowStatus;
  explanation: string;
  recommendedAction: string;
  targetLink: string;
  blockerReason?: string | null;
  count?: number | string | null;
};

export type OperatorDecision = {
  label: string;
  tone: "good" | "warn" | "neutral" | "error";
  explanation: string;
  nextAction: string;
  targetLink: string;
  blockerReason?: string | null;
};

function lower(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function hasStatus(status: string, values: string[]) {
  return values.includes(lower(status));
}

function latestUploadState(reviewSummary: ReviewSummary | undefined, publishState: PublishStatePayload | undefined) {
  const upload = reviewSummary?.latest_upload || publishState?.latest_upload || null;
  return upload;
}

function uploadDone(reviewSummary: ReviewSummary | undefined, publishState: PublishStatePayload | undefined) {
  const upload = latestUploadState(reviewSummary, publishState);
  if (!upload) return false;
  return ["uploaded", "published", "draft_ready"].includes(lower(upload.status));
}

export function operatorDecisionForJob(job: JobRecord, reviewSummary?: ReviewSummary | null, publishState?: PublishStatePayload | null): OperatorDecision {
  const status = lower(job.status);
  const productionAllowed = Boolean(reviewSummary?.production_ready ?? reviewSummary?.auto_copyright_approved);
  const privateAllowed = Boolean(reviewSummary?.private_test_ready ?? reviewSummary?.private_validation_allowed ?? reviewSummary?.production_ready);
  const blockedReason = reviewSummary?.system_compliance_reason || friendlyErrorMessage(job.last_error || "") || null;

  if (status === "failed" || status === "cancelled" || status === "canceled") {
    return {
      label: "Proses Gagal",
      tone: "error",
      explanation: friendlyErrorMessage(job.last_error || "Video gagal diproses."),
      nextAction: "Cek masalah",
      targetLink: `/jobs/${job.id}#detail-teknis`,
      blockerReason: friendlyErrorMessage(job.last_error || "Video gagal diproses."),
    };
  }

  if (uploadDone(reviewSummary || undefined, publishState || undefined)) {
    if (productionAllowed) {
      return {
        label: "Siap Production",
        tone: "good",
        explanation: "Private test sudah lolos dan status sistem juga aman.",
        nextAction: "Lihat laporan",
        targetLink: "/analytics",
      };
    }
    return {
      label: "Siap Upload Private Test",
      tone: "good",
      explanation: "Upload private sudah selesai. Status sistem sudah bisa dibaca dari ringkasan compliance.",
      nextAction: "Lihat ringkasan sistem",
      targetLink: `/jobs/${job.id}#review`,
      blockerReason: blockedReason,
    };
  }

  if (productionAllowed) {
    return {
      label: "Siap Upload Private Test",
      tone: "good",
      explanation: reviewSummary?.system_compliance_label || "Review sudah aman berdasarkan aturan sistem.",
      nextAction: "Upload private test",
      targetLink: `/jobs/${job.id}#review`,
      blockerReason: null,
    };
  }

  if (reviewSummary?.system_compliance_status && reviewSummary.system_compliance_status !== "system_approved") {
    return {
      label: "Belum Bisa Upload",
      tone: "warn",
      explanation: reviewSummary.system_compliance_reason || "Masih ada status sistem yang perlu dibereskan.",
      nextAction: reviewSummary.system_compliance_next_action || "Lengkapi konfigurasi aset",
      targetLink: `/jobs/${job.id}#review`,
      blockerReason: blockedReason,
    };
  }

  if (status === "rendered") {
    return {
      label: "Perlu Review",
      tone: "warn",
      explanation: "Video sudah dirender, tapi metadata final belum disimpan.",
      nextAction: "Review video",
      targetLink: `/jobs/${job.id}#review`,
      blockerReason: null,
    };
  }

  if (hasStatus(status, ["queued", "searching"])) {
    return {
      label: "Perlu Review",
      tone: "neutral",
      explanation: "Video sudah dibuat dan sedang menunggu giliran proses.",
      nextAction: "Pantau proses",
      targetLink: "/queue#antrian",
    };
  }

  if (hasStatus(status, ["downloaded", "transcribed", "planned", "voiceover", "rendering", "uploading", "processing"])) {
    return {
      label: "Sedang Diproses",
      tone: "neutral",
      explanation: "Pipeline masih berjalan. Operator cukup memantau sampai siap review.",
      nextAction: "Lihat detail",
      targetLink: `/jobs/${job.id}`,
    };
  }

  if (privateAllowed) {
    return {
      label: "Siap Upload Private Test",
      tone: "good",
      explanation: "Review sudah cukup aman untuk validasi teknis private.",
      nextAction: "Upload private test",
      targetLink: `/jobs/${job.id}#review`,
    };
  }

    return {
      label: "Perlu Review",
      tone: "warn",
      explanation: "Metadata dan review belum lengkap.",
      nextAction: "Review video",
      targetLink: `/jobs/${job.id}#review`,
      blockerReason: blockedReason,
    };
}

export function buildJobWorkflowSteps(job: JobRecord, reviewSummary?: ReviewSummary | null, publishState?: PublishStatePayload | null): OperatorWorkflowStep[] {
  const status = lower(job.status);
  const productionAllowed = Boolean(reviewSummary?.production_ready ?? reviewSummary?.auto_copyright_approved);
  const privateAllowed = Boolean(reviewSummary?.private_test_ready ?? reviewSummary?.private_validation_allowed ?? reviewSummary?.production_ready);
  const uploaded = uploadDone(reviewSummary || undefined, publishState || undefined);
  const upload = latestUploadState(reviewSummary || undefined, publishState || undefined);
  const failed = hasStatus(status, ["failed", "cancelled", "canceled"]);
  const processing = hasStatus(status, ["queued", "searching", "downloaded", "transcribed", "planned", "voiceover", "rendering", "uploading", "processing"]);
  const rendered = status === "rendered";
  const uploadStatusLabel = upload?.status ? businessUploadStatus(upload.status) : "Belum ada";

  return [
    {
      key: "create",
      number: 1,
      label: "Buat Video",
      status: "done",
      explanation: `Video #${job.id} sudah dibuat untuk channel ${job.channel_id}.`,
      recommendedAction: "Lihat detail video",
      targetLink: `/jobs/${job.id}`,
    },
    {
      key: "process",
      number: 2,
      label: "Proses Video",
      status: failed ? "blocked" : processing ? "current" : rendered || uploaded ? "done" : "pending",
      explanation: failed
        ? friendlyErrorMessage(job.last_error || "Video gagal diproses.")
        : processing
          ? `Video masih diproses di tahap ${job.current_stage || businessJobStatus(job.status)}.`
          : "Proses utama sudah selesai dan video siap ditinjau.",
      recommendedAction: failed ? "Cek masalah" : "Pantau proses",
      targetLink: failed ? `/jobs/${job.id}#detail-teknis` : "/queue#antrian",
      blockerReason: failed ? friendlyErrorMessage(job.last_error || "Video gagal diproses.") : null,
    },
    {
      key: "review",
      number: 3,
      label: "Review Hasil",
      status: rendered ? "current" : uploaded || productionAllowed || privateAllowed ? "done" : "pending",
      explanation: rendered
        ? "Preview sudah tersedia. Operator perlu cek metadata final sebelum lanjut."
        : uploaded
          ? "Video sudah melewati private test."
          : "Review hasil belum bisa dilakukan sampai video selesai dirender.",
      recommendedAction: rendered ? "Review video" : "Lihat preview",
      targetLink: `/jobs/${job.id}#review`,
      blockerReason: rendered ? null : failed ? "Proses gagal sebelum preview siap." : null,
    },
    {
      key: "copyright",
      number: 4,
      label: "Cek Sistem",
      status: productionAllowed ? "done" : reviewSummary?.system_compliance_status && reviewSummary.system_compliance_status !== "system_approved" ? "blocked" : rendered || uploaded ? "current" : "pending",
      explanation: reviewSummary?.system_compliance_reason ? reviewSummary.system_compliance_reason : "Periksa compliance aset, label AI, dan kesiapan upload.",
      recommendedAction: productionAllowed ? "Lanjut private test" : "Lihat ringkasan sistem",
      targetLink: `/jobs/${job.id}#review`,
      blockerReason: reviewSummary?.system_compliance_reason || null,
    },
    {
      key: "private-upload",
      number: 5,
      label: "Upload Private Test",
      status: uploaded ? "done" : productionAllowed ? "current" : reviewSummary?.system_compliance_status && reviewSummary.system_compliance_status !== "system_approved" ? "blocked" : "pending",
      explanation: uploaded
        ? `Private upload ${uploadStatusLabel} sudah tercatat.`
        : productionAllowed
          ? "Private test aman dijalankan untuk validasi teknis."
          : reviewSummary?.system_compliance_next_action || "Upload private belum bisa dijalankan sampai sistem siap.",
      recommendedAction: uploaded ? "Lihat riwayat upload" : "Upload private test",
      targetLink: uploaded ? "/publish#history" : `/jobs/${job.id}#review`,
      blockerReason: uploaded ? null : reviewSummary?.system_compliance_reason || null,
    },
    {
      key: "production",
      number: 6,
      label: "Siap Production",
      status: productionAllowed ? "current" : reviewSummary?.system_compliance_status && reviewSummary.system_compliance_status !== "system_approved" ? "blocked" : "pending",
      explanation: productionAllowed
        ? "Aset aman berdasarkan aturan sistem. Production bisa diproses."
        : reviewSummary?.system_compliance_reason || "Production belum aman karena aturan sistem belum terpenuhi.",
      recommendedAction: productionAllowed ? "Lihat laporan" : reviewSummary?.system_compliance_next_action || "Lengkapi konfigurasi aset",
      targetLink: productionAllowed ? "/analytics" : `/jobs/${job.id}#review`,
      blockerReason: productionAllowed ? null : reviewSummary?.system_compliance_reason || null,
    },
  ];
}

export function buildQueueWorkflowSteps(summary: OverviewPayload, readyCount: number, blockedCount: number): OperatorWorkflowStep[] {
  const activeCount = ["searching", "downloaded", "transcribed", "planned", "voiceover", "rendering", "uploading", "processing"].reduce(
    (total, status) => total + (summary.job_counts[status] || 0),
    0,
  );
  return [
    {
      key: "create",
      number: 1,
      label: "Buat Video",
      status: "done",
      explanation: "Video baru dibuat dari halaman ini, lalu scheduler auto hanya menyiapkan satu job berikutnya.",
      recommendedAction: "Buat video baru",
      targetLink: "/queue#create-video",
      count: summary.job_counts.queued || 0,
    },
    {
      key: "process",
      number: 2,
      label: "Pantau Proses",
      status: activeCount > 0 || (summary.job_counts.queued || 0) > 0 ? "current" : "pending",
      explanation: "Lihat video yang masih menunggu atau sedang diproses, satu per satu.",
      recommendedAction: "Lihat antrian",
      targetLink: "/queue#antrian",
      count: activeCount || summary.job_counts.queued || 0,
    },
    {
      key: "review",
      number: 3,
      label: "Review Hasil",
      status: readyCount > 0 ? "current" : "pending",
      explanation: "Video siap dicek sebelum masuk tahap upload private.",
      recommendedAction: "Review video siap upload",
      targetLink: "/publish",
      count: readyCount,
    },
    {
      key: "copyright",
      number: 4,
      label: "Cek Sistem",
      status: blockedCount > 0 ? "blocked" : "pending",
      explanation: "Periksa status compliance sebelum production.",
      recommendedAction: "Lihat ringkasan sistem",
      targetLink: "/publish",
      count: blockedCount,
      blockerReason: blockedCount > 0 ? "Ada video yang belum memenuhi aturan sistem." : null,
    },
    {
      key: "private-upload",
      number: 5,
      label: "Upload Private Test",
      status: readyCount > 0 ? "current" : "pending",
      explanation: "Private test dipakai untuk validasi teknis, bukan publikasi.",
      recommendedAction: "Review & upload",
      targetLink: "/publish",
      count: readyCount,
    },
    {
      key: "report",
      number: 6,
      label: "Lihat Laporan",
      status: "pending",
      explanation: "Pantau hasil upload dan video yang butuh tindak lanjut.",
      recommendedAction: "Buka laporan",
      targetLink: "/analytics",
      count: summary.job_counts.failed || 0,
    },
  ];
}

export function buildHomeWorkflowSteps({
  overview,
  readyCount,
  blockedCount,
  channelReadyCount,
  uploadedCount,
  reportCount,
}: Readonly<{
  overview: OverviewPayload;
  readyCount: number;
  blockedCount: number;
  channelReadyCount: number;
  uploadedCount: number;
  reportCount: number;
}>): OperatorWorkflowStep[] {
  const activeCount = ["searching", "downloaded", "transcribed", "planned", "voiceover", "rendering", "uploading", "processing"].reduce(
    (total, status) => total + (overview.job_counts[status] || 0),
    0,
  );
  return [
    {
      key: "create",
      number: 1,
      label: "Buat Video Baru",
      status: channelReadyCount > 0 ? "current" : "pending",
      explanation: "Pilih channel, masukkan ide, lalu simpan ke antrian manual.",
      recommendedAction: "Buat video baru",
      targetLink: "/queue#create-video",
      count: channelReadyCount,
    },
    {
      key: "process",
      number: 2,
      label: "Pantau Antrian",
      status: activeCount > 0 || (overview.job_counts.queued || 0) > 0 ? "current" : "pending",
      explanation: "Lihat video yang sedang diproses atau masih menunggu giliran pertama.",
      recommendedAction: "Lihat antrian",
      targetLink: "/queue#antrian",
      count: activeCount + (overview.job_counts.queued || 0),
    },
    {
      key: "review",
      number: 3,
      label: "Review Video Siap Upload",
      status: readyCount > 0 ? "current" : "pending",
      explanation: "Cek preview, title, caption, dan hashtag sebelum upload private.",
      recommendedAction: "Review sekarang",
      targetLink: "/publish",
      count: readyCount,
    },
    {
      key: "copyright",
      number: 4,
      label: "Cek Sistem",
      status: blockedCount > 0 ? "blocked" : "pending",
      explanation: "Pastikan aset, musik, visual, dan label AI sudah sesuai aturan sistem.",
      recommendedAction: "Lihat ringkasan sistem",
      targetLink: "/publish",
      count: blockedCount,
      blockerReason: blockedCount > 0 ? "Ada video yang belum memenuhi aturan sistem." : null,
    },
    {
      key: "private-upload",
      number: 5,
      label: "Upload Private Test",
      status: uploadedCount > 0 ? "done" : "pending",
      explanation: "Private test dipakai untuk validasi teknis, bukan publikasi publik.",
      recommendedAction: "Lihat riwayat upload",
      targetLink: "/publish#history",
      count: uploadedCount,
    },
    {
      key: "report",
      number: 6,
      label: "Lihat Laporan",
      status: reportCount > 0 ? "current" : "pending",
      explanation: "Pantau hasil upload dan tindak lanjut video bermasalah.",
      recommendedAction: "Buka laporan",
      targetLink: "/analytics",
      count: reportCount,
    },
  ];
}

export function buildChannelNextAction(item: ChannelReadinessItem | undefined, enabled: boolean) {
  const readableIssue = (issue: string) => {
    if (issue === "missing_token") return "Channel perlu login ulang YouTube";
    if (issue === "missing_client_secret") return "Client secret belum tersedia";
    if (issue === "missing_curated_sources") return "Sumber kurasi belum lengkap";
    return issue.replaceAll("_", " ");
  };

  if (!enabled) {
    return {
      label: "Bermasalah",
      nextAction: "Lihat detail teknis",
      targetLink: "#detail-teknis",
      reason: "Channel nonaktif.",
    };
  }
  if (!item) {
    return {
      label: "Perlu Review",
      nextAction: "Cek pengaturan channel",
      targetLink: "/settings",
      reason: "Kesiapan channel belum terbaca.",
    };
  }
  if (item.issues.includes("missing_token")) {
    return {
      label: "Perlu Login YouTube",
      nextAction: "Login ulang YouTube",
      targetLink: "/settings",
      reason: "Token YouTube belum tersedia.",
    };
  }
  if (item.upload_ready) {
    return {
      label: "Siap",
      nextAction: "Buat Video untuk Channel Ini",
      targetLink: `/queue?channel_id=${encodeURIComponent(item.channel_id)}#create-video`,
      reason: "Channel siap dipakai untuk produksi video baru.",
    };
  }
  if (item.issues.length) {
    return {
      label: "Perlu Review",
      nextAction: "Cek detail teknis",
      targetLink: "#detail-teknis",
      reason: item.issues.map((issue) => readableIssue(issue)).join(" | "),
    };
  }
  return {
    label: "Siap",
    nextAction: "Buat Video untuk Channel Ini",
    targetLink: `/queue?channel_id=${encodeURIComponent(item.channel_id)}#create-video`,
    reason: "Tidak ada blocker utama.",
  };
}

export function operatorStatusTone(status: OperatorWorkflowStatus) {
  if (status === "done") return "bg-success-50 text-success-700";
  if (status === "current") return "bg-brand-50 text-brand-700";
  if (status === "blocked") return "bg-error-50 text-error-700";
  return "bg-gray-100 text-gray-700";
}

export function operatorStatusLabel(status: OperatorWorkflowStatus) {
  if (status === "done") return "Aman";
  if (status === "current") return "Sedang";
  if (status === "blocked") return "Diblokir";
  return "Menunggu";
}
