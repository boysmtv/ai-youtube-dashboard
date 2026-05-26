import type { ChannelConfig, ChannelReadinessItem, JobRecord, PublishHistoryItem, ReviewModeOption, ReviewSummary } from "./engine-types";

function lower(value: string) {
  return value.trim().toLowerCase();
}

export function businessJobStatus(status: string) {
  const normalized = lower(status);
  if (["queued", "searching", "pending"].includes(normalized)) return "Menunggu Diproses";
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
  const value = lower(channel.niche || channel.id);
  if (value.includes("game")) return "Gaming";
  if (value.includes("talk") || value.includes("viral") || value.includes("cerita")) return "Hot Talk / Cerita Viral";
  if (value.includes("foot") || value.includes("goal")) return "Football";
  if (value.includes("short") || value.includes("fact")) return "Short Facts / Recap";
  return channel.display_name || channel.id;
}

export function businessRightsStatus(summary: ReviewSummary | undefined | null) {
  if (!summary) return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
  if (summary.production_allowed) return { label: "Aman", tone: "bg-success-50 text-success-700" };
  if (summary.production_blockers.length) return { label: "Diblokir", tone: "bg-error-50 text-error-700" };
  return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
}

export function businessAiDisclosureStatus(summary: ReviewSummary | undefined | null) {
  if (!summary) return { label: "Perlu Review", tone: "bg-warning-50 text-warning-700" };
  if (!summary.needs_ai_disclosure) return { label: "Tidak perlu", tone: "bg-success-50 text-success-700" };
  if (summary.ai_disclosure_acknowledged || summary.ai_disclosure_override) {
    return { label: "Sudah", tone: "bg-success-50 text-success-700" };
  }
  return { label: "Belum", tone: "bg-error-50 text-error-700" };
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
  if (text.includes("copyright_acknowledged missing") || text.includes("copyright_acknowledged=false")) {
    return "Copyright belum disetujui.";
  }
  if (text.includes("reused_content_risk=high")) {
    return "Risiko konten ulang terlalu tinggi. Upload production diblokir.";
  }
  if (text.includes("reused content") && text.includes("high")) {
    return "Risiko konten ulang tinggi. Production diblokir.";
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
  if (text.includes("copyright_acknowledged missing") || text.includes("copyright_acknowledged=false")) {
    return {
      problem: "Copyright belum disetujui.",
      impact: "Production tetap diblokir.",
      nextStep: "Lengkapi review copyright di halaman Review & Upload.",
    };
  }
  if (text.includes("reused_content_risk=high") || (text.includes("reused content") && text.includes("high"))) {
    return {
      problem: "Risiko konten ulang tinggi.",
      impact: "Production diblokir oleh gate rights.",
      nextStep: "Perbaiki sumber, visual, atau rights assessment dulu.",
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
  return {
    problem: friendlyErrorMessage(message),
    impact: "Video tertahan pada langkah saat ini.",
    nextStep: "Buka detail teknis untuk melihat akar masalah.",
  };
}

export function summaryText(value?: string | null) {
  return value && String(value).trim() ? value : "Belum diisi";
}
