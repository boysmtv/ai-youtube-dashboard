import type { ChannelConfig, ChannelReadinessItem, JobRecord, PublishHistoryItem, ReviewModeOption, ReviewSummary } from "./engine-types";
import { getChannelBusinessProfile } from "./channel-profiles";

function lower(value: string) {
  return value.trim().toLowerCase();
}

export function businessJobStatus(status: string) {
  const normalized = lower(status);
  if (["queued", "searching", "pending"].includes(normalized)) return "Menunggu";
  if (["downloaded", "transcribed", "planned", "voiceover", "rendering", "uploading", "processing"].includes(normalized)) return "Sedang Diproses";
  if (normalized === "rendered") return "Siap Review";
  if (["uploaded", "published", "draft_ready"].includes(normalized)) return "Sudah Upload Private";
  if (normalized === "completed") return "Selesai";
  if (normalized === "paused") return "Dijeda";
  if (normalized === "blocked") return "Diblokir";
  if (["failed", "cancelled", "canceled"].includes(normalized)) return "Perlu Diperbaiki";
  return status;
}

export function businessJobStatusTone(status: string) {
  const normalized = lower(status);
  if (["uploaded", "published", "draft_ready", "completed"].includes(normalized)) return "bg-success-50 text-success-700";
  if (normalized === "rendered") return "bg-warning-50 text-warning-700";
  if (["queued", "searching", "pending", "downloaded", "transcribed", "planned", "voiceover", "rendering", "uploading", "processing"].includes(normalized)) {
    return "bg-brand-50 text-brand-700";
  }
  if (normalized === "paused") return "bg-gray-100 text-gray-700";
  if (normalized === "blocked") return "bg-error-50 text-error-700";
  if (["failed", "cancelled", "canceled"].includes(normalized)) return "bg-warning-50 text-warning-700";
  return "bg-gray-100 text-gray-700";
}

export function businessUploadStatus(status: string) {
  const normalized = lower(status);
  if (["uploaded", "published"].includes(normalized)) return "Sudah Upload Private";
  if (normalized === "draft_ready") return "Siap Review";
  if (normalized === "ready") return "Siap";
  if (normalized === "failed") return "Gagal";
  return status;
}

export function businessUploadModeLabel(mode: string) {
  const normalized = lower(mode);
  if (normalized === "private_validation") return "Upload Private Test";
  if (normalized === "production_private") return "Production Private";
  if (normalized === "production_public_or_scheduled") return "Production Public / Scheduled";
  return mode;
}

export function uploadModeTone(mode: string) {
  const normalized = lower(mode);
  if (normalized === "private_validation") return "bg-success-50 text-success-700";
  if (normalized === "production_private") return "bg-warning-50 text-warning-700";
  if (normalized === "production_public_or_scheduled") return "bg-error-50 text-error-700";
  return "bg-gray-100 text-gray-700";
}

export function businessUploadModeOptions(options: ReviewModeOption[] | undefined) {
  if (!options?.length) {
    return [
      { mode: "private_validation", label: "Upload Private Test", allowed: true },
      { mode: "production_private", label: "Production Private", allowed: false },
      { mode: "production_public_or_scheduled", label: "Production Public / Scheduled", allowed: false },
    ] satisfies ReviewModeOption[];
  }
  return options.map((option) => ({
    ...option,
    label: businessUploadModeLabel(option.mode),
  }));
}

export function channelReadinessLabel(item: ChannelReadinessItem | undefined, enabled: boolean) {
  if (!enabled) {
    return { label: "Bermasalah", tone: "bg-gray-100 text-gray-700" };
  }
  if (!item) {
    return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
  }
  if (item.upload_ready) {
    return { label: "Siap", tone: "bg-success-50 text-success-700" };
  }
  if (item.issues.includes("missing_token")) {
    return { label: "Perlu Login YouTube", tone: "bg-warning-50 text-warning-700" };
  }
  if (item.issues.length) {
    return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
  }
  return { label: "Siap", tone: "bg-success-50 text-success-700" };
}

export function channelProfileLabel(channel: Pick<ChannelConfig, "niche" | "id"> & { display_name?: string | null }) {
  return getChannelBusinessProfile(channel).niche_label;
}

export function channelBusinessProfile(channel: Pick<ChannelConfig, "niche" | "id"> & { display_name?: string | null }) {
  return getChannelBusinessProfile(channel);
}

export function businessRightsStatus(summary: ReviewSummary | undefined | null) {
  if (!summary) return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
  if (summary.system_compliance_status === "system_approved" || summary.auto_copyright_approved) {
    return { label: summary.system_compliance_label || "Aman berdasarkan aturan sistem", tone: "bg-success-50 text-success-700" };
  }
  if (summary.system_compliance_status === "blocked_missing_assets") {
    return { label: summary.system_compliance_label || "Aset belum memenuhi syarat sistem", tone: "bg-warning-50 text-warning-700" };
  }
  if (summary.system_compliance_status === "blocked_ai_disclosure") {
    return { label: summary.system_compliance_label || "Label AI perlu dikonfigurasi", tone: "bg-warning-50 text-warning-700" };
  }
  if (summary.system_compliance_status === "blocked_unknown_rights") {
    return { label: summary.system_compliance_label || "Sumber belum terdaftar aman", tone: "bg-warning-50 text-warning-700" };
  }
  if (summary.system_compliance_status === "blocked_system_requirement") {
    return { label: summary.system_compliance_label || "Perlu konfigurasi aset aman", tone: "bg-warning-50 text-warning-700" };
  }
  if (summary.system_compliance_status === "private_test_only") {
    return { label: summary.system_compliance_label || "Siap private test", tone: "bg-warning-50 text-warning-700" };
  }
  if (summary.system_compliance_label) {
    return { label: summary.system_compliance_label, tone: "bg-error-50 text-error-700" };
  }
  if (summary.production_ready ?? summary.auto_copyright_approved) return { label: "Aman berdasarkan aturan sistem", tone: "bg-success-50 text-success-700" };
  return { label: "Belum siap", tone: "bg-warning-50 text-warning-700" };
}

export function businessRiskStatus(value?: string | null) {
  const normalized = lower(value || "");
  if (!normalized) return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
  if (["low", "aman", "safe", "ok"].includes(normalized)) return { label: "Aman", tone: "bg-success-50 text-success-700" };
  if (["high", "blocked", "diblokir", "unsafe"].includes(normalized)) return { label: "Diblokir", tone: "bg-error-50 text-error-700" };
  return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
}

export function businessAiDisclosureStatus(summary: ReviewSummary | undefined | null) {
  if (!summary) return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
  if (!summary.needs_ai_disclosure) return { label: "Tidak perlu", tone: "bg-success-50 text-success-700" };
  if (summary.ai_disclosure_acknowledged || summary.ai_disclosure_override) {
    return { label: "Sudah dikonfigurasi", tone: "bg-success-50 text-success-700" };
  }
  return { label: "Perlu konfigurasi", tone: "bg-error-50 text-error-700" };
}

export function businessChecklistState(value?: boolean | null) {
  if (value === true) return { label: "Aman", tone: "bg-success-50 text-success-700" };
  if (value === false) return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
  return { label: "Belum Ada", tone: "bg-gray-100 text-gray-700" };
}

export function friendlyErrorMessage(message: string) {
  const text = message.toLowerCase();
  if (text.includes("source_rate_limited")) {
    return "Sumber video sedang dibatasi. Coba sumber lokal atau tunggu beberapa saat.";
  }
  if (text.includes("local_source_invalid")) {
    return "File sumber tidak ditemukan atau tidak valid.";
  }
  if (text.includes("oauth token missing") || text.includes("token missing") || text.includes("invalid token")) {
    return "Channel perlu login ulang YouTube.";
  }
  if (text.includes("preview missing") || text.includes("preview_unavailable")) {
    return "Preview video belum tersedia.";
  }
  if (text.includes("audio not ready") || text.includes("audio_not_ready")) {
    return "Audio belum siap. Cek mode voice-over atau source audio.";
  }
  if (text.includes("database_unavailable")) {
    return "PostgreSQL belum tersedia.";
  }
  if (text.includes("queue_unavailable")) {
    return "Antrian belum aktif.";
  }
  if (text.includes("worker_unavailable")) {
    return "Worker belum aktif.";
  }
  if (text.includes("publisher_unavailable")) {
    return "Publisher belum aktif.";
  }
  if (text.includes("production_policy_not_configured") || text.includes("safe_source_missing") || text.includes("licensed_music_missing")) {
    return "Aset belum memenuhi syarat sistem.";
  }
  if (text.includes("reused_content_risk=high")) {
    return "Aset belum memenuhi syarat sistem.";
  }
  if (text.includes("reused content") && text.includes("high")) {
    return "Aset belum memenuhi syarat sistem.";
  }
  if (text.includes("label ai perlu dikonfigurasi")) {
    return "Label AI perlu dikonfigurasi.";
  }
  if (text.includes("musik berlisensi belum tersedia")) {
    return "Musik berlisensi belum tersedia.";
  }
  if (text.includes("sumber belum terdaftar aman")) {
    return "Sumber belum terdaftar aman.";
  }
  return message;
}

export function businessBlockerDetail(message: string) {
  const text = message.toLowerCase();
  if (text.includes("source_rate_limited")) {
    return {
      problem: "Sumber video sedang dibatasi.",
      impact: "Pipeline harus menunggu atau memakai sumber lokal.",
      nextStep: "Gunakan sumber lokal atau coba lagi nanti.",
    };
  }
  if (text.includes("local_source_invalid")) {
    return {
      problem: "File sumber tidak ditemukan atau tidak valid.",
      impact: "Video tidak bisa diproses sampai sumber diperbaiki.",
      nextStep: "Periksa path file sumber dan unggah ulang jika perlu.",
    };
  }
  if (text.includes("oauth token missing") || text.includes("token missing") || text.includes("invalid token")) {
    return {
      problem: "Channel perlu login ulang YouTube.",
      impact: "Upload dan preflight channel tertahan.",
      nextStep: "Buka pengaturan channel dan login ulang YouTube.",
    };
  }
  if (text.includes("reused_content_risk=high") || (text.includes("reused content") && text.includes("high"))) {
    return {
      problem: "Aset belum memenuhi syarat sistem.",
      impact: "Production belum bisa dilanjutkan.",
      nextStep: "Gunakan aset owned, generated, stock licensed, atau licensed.",
    };
  }
  if (text.includes("audio not ready") || text.includes("audio_not_ready")) {
    return {
      problem: "Audio belum siap.",
      impact: "Review final dan production tidak bisa lanjut.",
      nextStep: "Cek mode voice-over atau source audio.",
    };
  }
  if (text.includes("preview missing") || text.includes("preview_unavailable")) {
    return {
      problem: "Preview video belum tersedia.",
      impact: "Operator belum bisa memverifikasi hasil render.",
      nextStep: "Tunggu render selesai lalu buka ulang detail video.",
    };
  }
  if (text.includes("database_unavailable")) {
    return {
      problem: "PostgreSQL belum tersedia.",
      impact: "Sistem belum bisa membaca data runtime.",
      nextStep: "Periksa koneksi PostgreSQL lalu muat ulang dashboard.",
    };
  }
  if (text.includes("queue_unavailable")) {
    return {
      problem: "Antrian belum aktif.",
      impact: "Pipeline tidak bisa mengambil job baru.",
      nextStep: "Periksa Redis atau service queue.",
    };
  }
  if (text.includes("worker_unavailable")) {
    return {
      problem: "Worker belum aktif.",
      impact: "Proses video tidak bisa berjalan.",
      nextStep: "Nyalakan worker lalu coba lagi.",
    };
  }
  if (text.includes("publisher_unavailable")) {
    return {
      problem: "Publisher belum aktif.",
      impact: "Upload tidak bisa diteruskan.",
      nextStep: "Periksa service publisher lalu ulangi proses.",
    };
  }
  if (text.includes("production_policy_not_configured")) {
    return {
      problem: "Aturan produksi belum lengkap.",
      impact: "Video belum aman untuk production.",
      nextStep: "Lengkapi source aman, musik berlisensi, atau label AI.",
    };
  }
  return {
    problem: friendlyErrorMessage(message),
    impact: "Video tertahan pada langkah saat ini.",
    nextStep: "Periksa kebutuhan sistem atau buka detail teknis di area advanced.",
  };
}

export function summaryText(value?: string | null) {
  return value && String(value).trim() ? value : "Belum diisi";
}
