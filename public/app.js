const state = {
  engineUrl: localStorage.getItem("engineUrl")
    || window.DASHBOARD_CONFIG?.engineApiBaseUrl
    || "http://localhost:8080",
  socket: null,
  selectedJobId: null,
  selectedJob: null,
  latestOverview: null,
  latestJobs: [],
  latestApprovals: [],
  selectedFileKey: "",
  uploadUnlockUntil: 0,
  uploadGuard: {
    enabled: true,
    confirmationText: "ENABLE_REAL_UPLOAD",
    reason: "Manual operator approval is required before a live YouTube upload can start.",
    sessionMinutes: 10,
    requireOperatorName: true,
    requireReason: true,
  },
  filters: {
    status: "",
    channelId: "",
  },
};

const els = {
  connectionForm: document.getElementById("connection-form"),
  engineUrl: document.getElementById("engine-url"),
  connectionStatus: document.getElementById("connection-status"),
  overviewCards: document.getElementById("overview-cards"),
  jobsBody: document.getElementById("jobs-body"),
  attemptsList: document.getElementById("attempts-list"),
  eventsList: document.getElementById("events-list"),
  approvalAuditList: document.getElementById("approval-audit-list"),
  registryEditor: document.getElementById("registry-editor"),
  refreshOverview: document.getElementById("refresh-overview"),
  refreshApprovals: document.getElementById("refresh-approvals"),
  loadRegistry: document.getElementById("load-registry"),
  saveRegistry: document.getElementById("save-registry"),
  createJobs: document.getElementById("create-jobs"),
  runWorker: document.getElementById("run-worker"),
  enableUpload: document.getElementById("enable-upload"),
  uploadApprovalText: document.getElementById("upload-approval-text"),
  uploadOperatorName: document.getElementById("upload-operator-name"),
  uploadApprovalReason: document.getElementById("upload-approval-reason"),
  uploadApprovalStatus: document.getElementById("upload-approval-status"),
  jobFilterStatus: document.getElementById("job-filter-status"),
  jobFilterChannel: document.getElementById("job-filter-channel"),
  jobDetailTitle: document.getElementById("job-detail-title"),
  jobDetailEmpty: document.getElementById("job-detail-empty"),
  jobDetailContent: document.getElementById("job-detail-content"),
  jobDetailSummary: document.getElementById("job-detail-summary"),
  jobDetailAttempts: document.getElementById("job-detail-attempts"),
  jobDetailArtifacts: document.getElementById("job-detail-artifacts"),
  jobDetailUploads: document.getElementById("job-detail-uploads"),
  jobDetailApprovals: document.getElementById("job-detail-approvals"),
  jobDetailEvents: document.getElementById("job-detail-events"),
  jobDetailManifest: document.getElementById("job-detail-manifest"),
  jobRetryUpload: document.getElementById("job-retry-upload"),
  jobRun: document.getElementById("job-run"),
  jobRequeue: document.getElementById("job-requeue"),
  jobActionStatus: document.getElementById("job-action-status"),
  jobFileTranscript: document.getElementById("job-file-transcript"),
  jobFilePlan: document.getElementById("job-file-plan"),
  jobFileStatus: document.getElementById("job-file-status"),
  jobFileContent: document.getElementById("job-file-content"),
};

function setStatus(text, isError = false) {
  els.connectionStatus.textContent = text;
  els.connectionStatus.style.color = isError ? "var(--warning)" : "var(--muted)";
}

function apiUrl(path) {
  return `${state.engineUrl}${path}`;
}

function wsUrl(path) {
  return `${state.engineUrl.replace(/^http/, "ws")}${path}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function fetchJson(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  return response.json();
}

function jobStatusCount(payload) {
  return (payload.job_counts.searching || 0)
    + (payload.job_counts.downloaded || 0)
    + (payload.job_counts.transcribed || 0)
    + (payload.job_counts.planned || 0)
    + (payload.job_counts.voiceover || 0)
    + (payload.job_counts.rendered || 0)
    + (payload.job_counts.uploading || 0);
}

function firstInterestingJobId(items) {
  const active = items.find((job) => job.status !== "queued");
  return active?.id || items[0]?.id || null;
}

function renderOverview(payload) {
  state.latestOverview = payload;
  if (payload.upload_guard) {
    setUploadGuard(payload.upload_guard);
  }
  const cards = [
    ["Timezone", payload.timezone],
    ["Channels", `${payload.channels.enabled}/${payload.channels.configured}`],
    ["Queued", payload.job_counts.queued || 0],
    ["Active", jobStatusCount(payload)],
    ["Free Disk", `${payload.storage.free_gb} GB`],
    ["Storage Budget", `${payload.storage.managed_gb}/${payload.storage.budget_gb} GB`],
  ];
  els.overviewCards.innerHTML = cards
    .map(([label, value]) => `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`)
    .join("");

  els.attemptsList.innerHTML = payload.recent_attempts
    .map((attempt) => `
      <li>
        <strong>#${attempt.job_id} ${escapeHtml(attempt.stage)}</strong>
        <small>${escapeHtml(attempt.started_at)}</small>
        <div>${escapeHtml(attempt.status)}${attempt.error_message ? ` - ${escapeHtml(attempt.error_message)}` : ""}</div>
      </li>
    `)
    .join("");

  els.eventsList.innerHTML = payload.recent_events
    .map((event) => `
      <li>
        <strong>${escapeHtml(event.command)}:${escapeHtml(event.event)}</strong>
        <small>${escapeHtml(event.timestamp)} - ${escapeHtml(event.log_file)}</small>
        <div>${escapeHtml(JSON.stringify(event.details || {}))}</div>
      </li>
    `)
    .join("");
}

function renderJobs(items) {
  state.latestJobs = items;
  els.jobsBody.innerHTML = items
    .map((job) => `
      <tr data-job-id="${job.id}" class="${job.id === state.selectedJobId ? "is-selected" : ""}">
        <td>${job.id}</td>
        <td>${escapeHtml(job.channel_id)}</td>
        <td><span class="mono">${escapeHtml(job.publish_at)}</span></td>
        <td><span class="status-pill">${escapeHtml(job.status)}</span></td>
        <td>${job.retry_count}</td>
        <td>${escapeHtml(job.last_error || "")}</td>
      </tr>
    `)
    .join("");

  els.jobsBody.querySelectorAll("tr[data-job-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const jobId = Number(row.dataset.jobId);
      loadJobDetail(jobId).catch((error) => setStatus(error.message, true));
    });
  });
}

function renderDetailList(element, items, renderItem) {
  element.innerHTML = items.length ? items.map(renderItem).join("") : "<li>No data yet.</li>";
}

function approvalSummary(approval) {
  const jobLabel = approval.job_id ? `Job #${approval.job_id}` : "Worker run";
  return `${jobLabel} - ${approval.action} - ${approval.operator_name || "unknown operator"}`;
}

function renderApprovalItem(approval) {
  return `
    <li>
      <strong>${escapeHtml(approvalSummary(approval))}</strong>
      <small>${escapeHtml(approval.created_at)} - session ${escapeHtml(approval.session_minutes)}m</small>
      <div>${escapeHtml(approval.approval_reason || "No reason recorded.")}</div>
    </li>
  `;
}

function clearFileInspector(message) {
  els.jobFileStatus.textContent = message;
  els.jobFileContent.textContent = "";
}

function setJobActionStatus(text, isError = false) {
  els.jobActionStatus.textContent = text;
  els.jobActionStatus.style.color = isError ? "var(--warning)" : "var(--muted)";
}

function normalizeUploadGuard(guard) {
  return {
    enabled: guard?.enabled !== false,
    confirmationText: String(guard?.confirmation_text || "ENABLE_REAL_UPLOAD"),
    reason: String(
      guard?.reason || "Manual operator approval is required before a live YouTube upload can start.",
    ),
    sessionMinutes: Number(guard?.session_minutes || 10),
    requireOperatorName: guard?.require_operator_name !== false,
    requireReason: guard?.require_reason !== false,
  };
}

function approvalSessionActive() {
  return state.uploadUnlockUntil > Date.now();
}

function approvalMetadataMissing() {
  if (state.uploadGuard.requireOperatorName && !els.uploadOperatorName.value.trim()) {
    return "Operator name is required before a live upload can be enabled.";
  }
  if (state.uploadGuard.requireReason && !els.uploadApprovalReason.value.trim()) {
    return "Approval reason is required before a live upload can be enabled.";
  }
  return "";
}

function hasUploadApproval() {
  if (!state.uploadGuard.enabled) {
    return true;
  }
  return els.uploadApprovalText.value.trim() === state.uploadGuard.confirmationText
    && approvalSessionActive()
    && !approvalMetadataMissing();
}

function grantUploadApprovalSession() {
  if (!state.uploadGuard.enabled) {
    state.uploadUnlockUntil = 0;
    return;
  }
  if (els.uploadApprovalText.value.trim() !== state.uploadGuard.confirmationText) {
    state.uploadUnlockUntil = 0;
    return;
  }
  if (!approvalSessionActive()) {
    state.uploadUnlockUntil = Date.now() + (state.uploadGuard.sessionMinutes * 60 * 1000);
  }
}

function syncUploadApprovalControls() {
  if (!state.uploadGuard.enabled) {
    els.enableUpload.disabled = false;
    els.uploadApprovalStatus.textContent = "Registry approval guard is disabled. Real upload can be enabled directly.";
    els.uploadApprovalStatus.style.color = "var(--muted)";
    return;
  }
  const metadataError = approvalMetadataMissing();
  const approved = hasUploadApproval();
  if (!approved && els.enableUpload.checked) {
    els.enableUpload.checked = false;
  }
  els.enableUpload.disabled = !approved;
  if (approved) {
    const secondsLeft = Math.max(0, Math.floor((state.uploadUnlockUntil - Date.now()) / 1000));
    els.uploadApprovalStatus.textContent = `Approval confirmed by ${els.uploadOperatorName.value.trim()}. Real upload is unlocked for ${secondsLeft}s.`;
  } else if (metadataError) {
    els.uploadApprovalStatus.textContent = metadataError;
  } else if (els.uploadApprovalText.value.trim() === state.uploadGuard.confirmationText && !approvalSessionActive()) {
    els.uploadApprovalStatus.textContent = `Approval session expired. Re-enter ${state.uploadGuard.confirmationText} to unlock for ${state.uploadGuard.sessionMinutes} minute(s).`;
  } else {
    els.uploadApprovalStatus.textContent = `${state.uploadGuard.reason} Type ${state.uploadGuard.confirmationText} to unlock for ${state.uploadGuard.sessionMinutes} minute(s).`;
  }
  els.uploadApprovalStatus.style.color = approved ? "var(--accent-strong)" : "var(--warning)";
}

function setUploadGuard(guard) {
  state.uploadGuard = normalizeUploadGuard(guard);
  syncUploadApprovalControls();
}

function canRunSelectedJob() {
  return state.selectedJob?.status === "queued";
}

function canRequeueSelectedJob() {
  return ["failed", "rendered"].includes(state.selectedJob?.status || "");
}

function canRetryUploadSelectedJob() {
  return state.selectedJob?.status === "rendered";
}

function syncJobActionButtons() {
  els.jobRetryUpload.disabled = !canRetryUploadSelectedJob();
  els.jobRun.disabled = !canRunSelectedJob();
  els.jobRequeue.disabled = !canRequeueSelectedJob();
}

function renderJobDetail(payload) {
  state.selectedJobId = payload.job.id;
  state.selectedJob = payload.job;
  els.jobDetailTitle.textContent = `Job #${payload.job.id} - ${payload.job.channel_id} - ${payload.job.status}`;
  els.jobDetailEmpty.classList.add("hidden");
  els.jobDetailContent.classList.remove("hidden");

  const summaryRows = [
    ["Publish", payload.job.publish_at],
    ["Status", payload.job.status],
    ["Retry Count", payload.job.retry_count],
    ["Manifest Path", payload.job.manifest_path || "Not created"],
    ["Output Dir", payload.job.output_dir || "Not created"],
    ["Manifest Status", payload.manifest_status],
    ["Last Error", payload.job.last_error || "None"],
  ];
  els.jobDetailSummary.innerHTML = summaryRows
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("");

  renderDetailList(
    els.jobDetailAttempts,
    payload.attempts,
    (attempt) => `
      <li>
        <strong>${escapeHtml(attempt.stage)} - ${escapeHtml(attempt.status)}</strong>
        <small>${escapeHtml(attempt.started_at)}${attempt.finished_at ? ` -> ${escapeHtml(attempt.finished_at)}` : ""}</small>
        <div>${escapeHtml(attempt.error_message || "")}</div>
      </li>
    `,
  );

  renderDetailList(
    els.jobDetailArtifacts,
    payload.artifacts,
    (artifact) => `
      <li>
        <strong>${escapeHtml(artifact.kind)}</strong>
        <small>${escapeHtml(artifact.path)}</small>
        <div>${artifact.size_bytes ? `${artifact.size_bytes} bytes` : "size unknown"}</div>
      </li>
    `,
  );

  renderDetailList(
    els.jobDetailUploads,
    payload.uploads,
    (upload) => `
      <li>
        <strong>${escapeHtml(upload.status)}</strong>
        <small>${escapeHtml(upload.publish_at)}</small>
        <div>${escapeHtml(upload.youtube_video_id || upload.youtube_url || upload.error_message || "No upload id yet.")}</div>
      </li>
    `,
  );

  renderDetailList(
    els.jobDetailApprovals,
    payload.approval_audits || [],
    renderApprovalItem,
  );

  renderDetailList(
    els.jobDetailEvents,
    payload.runtime_events || [],
    (event) => `
      <li>
        <strong>${escapeHtml(event.command)} - ${escapeHtml(event.event)}</strong>
        <small>${escapeHtml(event.timestamp)} - ${escapeHtml(event.log_file || "")}</small>
        <div>${escapeHtml(JSON.stringify(event.details || {}))}</div>
      </li>
    `,
  );

  if (payload.manifest) {
    els.jobDetailManifest.textContent = JSON.stringify(payload.manifest, null, 2);
  } else if (payload.manifest_error) {
    els.jobDetailManifest.textContent = `Manifest error: ${payload.manifest_error}`;
  } else {
    els.jobDetailManifest.textContent = "Manifest not available yet.";
  }

  if (canRunSelectedJob()) {
    setJobActionStatus("This queued job can be run immediately.");
  } else if (canRetryUploadSelectedJob()) {
    setJobActionStatus("This rendered job can go straight to upload-only retry.");
  } else if (canRequeueSelectedJob()) {
    setJobActionStatus("Requeue this job first, then run it once to resume or upload.");
  } else {
    setJobActionStatus("This job is informational right now; operator actions are disabled.");
  }
  syncJobActionButtons();
  clearFileInspector("Select transcript or plan to inspect.");
  renderJobs(state.latestJobs);
}

function populateChannelFilter(registry) {
  const currentValue = state.filters.channelId;
  const options = (registry.channels || [])
    .map((channel) => `<option value="${escapeHtml(channel.id)}">${escapeHtml(channel.id)}</option>`)
    .join("");
  els.jobFilterChannel.innerHTML = `<option value="">All Channels</option>${options}`;
  els.jobFilterChannel.value = currentValue;
}

async function loadOverview() {
  const payload = await fetchJson("/api/overview");
  renderOverview(payload);
}

async function loadJobs() {
  const params = new URLSearchParams({ limit: "100" });
  if (state.filters.status) {
    params.set("status", state.filters.status);
  }
  if (state.filters.channelId) {
    params.set("channel_id", state.filters.channelId);
  }
  const payload = await fetchJson(`/api/jobs?${params.toString()}`);
  renderJobs(payload.items);
  if (!state.selectedJobId) {
    const nextJobId = firstInterestingJobId(payload.items);
    if (nextJobId) {
      await loadJobDetail(nextJobId, { silent404: true });
    }
  }
}

async function loadApprovals() {
  const payload = await fetchJson("/api/approvals/recent?limit=30");
  state.latestApprovals = payload.items || [];
  renderDetailList(els.approvalAuditList, state.latestApprovals, renderApprovalItem);
}

async function loadJobDetail(jobId, options = {}) {
  try {
    const payload = await fetchJson(`/api/jobs/${jobId}`);
    renderJobDetail(payload);
  } catch (error) {
    if (options.silent404 && error.message.includes("404")) {
      return;
    }
    throw error;
  }
}

async function loadJobFile(fileKey) {
  if (!state.selectedJobId) {
    clearFileInspector("Select a job first.");
    return;
  }
  state.selectedFileKey = fileKey;
  els.jobFileStatus.textContent = `Loading ${fileKey}...`;
  try {
    const payload = await fetchJson(`/api/jobs/${state.selectedJobId}/files/${fileKey}`);
    els.jobFileStatus.textContent = `${payload.file_key} loaded from ${payload.path}`;
    els.jobFileContent.textContent = fileKey === "plan" && payload.json
      ? JSON.stringify(payload.json, null, 2)
      : payload.text;
  } catch (error) {
    clearFileInspector(`${fileKey} unavailable: ${error.message}`);
  }
}

async function requeueSelectedJob() {
  if (!state.selectedJobId) {
    setJobActionStatus("Select a job first.", true);
    return;
  }
  setJobActionStatus(`Requeueing job #${state.selectedJobId}...`);
  const payload = await fetchJson(`/api/jobs/${state.selectedJobId}/requeue`, {
    method: "POST",
  });
  state.selectedJobId = payload.job.id;
  setJobActionStatus(payload.message);
  await refreshAll();
}

async function runSelectedJob() {
  if (!state.selectedJobId) {
    setJobActionStatus("Select a job first.", true);
    return;
  }
  setJobActionStatus(`Running job #${state.selectedJobId}...`);
  const payload = await fetchJson(`/api/jobs/${state.selectedJobId}/run`, {
    method: "POST",
    body: JSON.stringify({
      enable_upload: els.enableUpload.checked,
      upload_approval: els.uploadApprovalText.value.trim(),
      approval_operator_name: els.uploadOperatorName.value.trim(),
      approval_reason: els.uploadApprovalReason.value.trim(),
    }),
  });
  state.selectedJobId = payload.job_id || state.selectedJobId;
  setJobActionStatus(payload.message || `Job #${state.selectedJobId} run completed with status ${payload.status}.`);
  await refreshAll();
}

async function retryUploadSelectedJob() {
  if (!state.selectedJobId) {
    setJobActionStatus("Select a job first.", true);
    return;
  }
  setJobActionStatus(`Retrying upload stage for job #${state.selectedJobId}...`);
  const payload = await fetchJson(`/api/jobs/${state.selectedJobId}/retry-upload`, {
    method: "POST",
    body: JSON.stringify({
      enable_upload: els.enableUpload.checked,
      upload_approval: els.uploadApprovalText.value.trim(),
      approval_operator_name: els.uploadOperatorName.value.trim(),
      approval_reason: els.uploadApprovalReason.value.trim(),
    }),
  });
  state.selectedJobId = payload.job_id || state.selectedJobId;
  setJobActionStatus(payload.message || `Job #${state.selectedJobId} upload-only retry returned ${payload.status}.`);
  await refreshAll();
}

async function loadRegistry() {
  const payload = await fetchJson("/api/registry");
  els.registryEditor.value = JSON.stringify(payload, null, 2);
  populateChannelFilter(payload);
  setUploadGuard(payload.upload_approval);
}

async function saveRegistry() {
  const parsed = JSON.parse(els.registryEditor.value);
  await fetchJson("/api/registry", {
    method: "PUT",
    body: JSON.stringify(parsed),
  });
  populateChannelFilter(parsed);
  setStatus("Registry saved.");
  await refreshAll();
}

async function triggerScheduler() {
  await fetchJson("/api/scheduler/run", {
    method: "POST",
    body: JSON.stringify({ days_ahead: 1 }),
  });
  await refreshAll();
}

async function triggerWorker() {
  const result = await fetchJson("/api/worker/run", {
    method: "POST",
    body: JSON.stringify({
      enable_upload: els.enableUpload.checked,
      upload_approval: els.uploadApprovalText.value.trim(),
      approval_operator_name: els.uploadOperatorName.value.trim(),
      approval_reason: els.uploadApprovalReason.value.trim(),
    }),
  });
  if (result.job_id) {
    state.selectedJobId = result.job_id;
  }
  await refreshAll();
}

async function refreshAll() {
  await loadOverview();
  await loadJobs();
  await loadApprovals();
  if (state.selectedJobId) {
    await loadJobDetail(state.selectedJobId, { silent404: true });
  }
}

function connectSocket() {
  if (state.socket) {
    state.socket.close();
  }
  state.socket = new WebSocket(wsUrl("/ws/overview"));
  state.socket.onopen = () => setStatus(`Connected to ${state.engineUrl}`);
  state.socket.onmessage = async (event) => {
    try {
      const payload = JSON.parse(event.data);
      renderOverview(payload);
      await loadJobs();
      await loadApprovals();
      if (state.selectedJobId) {
        await loadJobDetail(state.selectedJobId, { silent404: true });
      }
    } catch (error) {
      setStatus(`WebSocket update error: ${error.message}`, true);
    }
  };
  state.socket.onerror = () => setStatus("WebSocket connection failed.", true);
  state.socket.onclose = () => setStatus("WebSocket disconnected.", true);
}

async function initialize() {
  els.engineUrl.value = state.engineUrl;
  els.jobFilterStatus.value = state.filters.status;
  try {
    await loadRegistry();
    await refreshAll();
    connectSocket();
    setStatus(`Connected to ${state.engineUrl}`);
  } catch (error) {
    setStatus(`Connection failed: ${error.message}`, true);
  }
}

els.connectionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state.engineUrl = els.engineUrl.value.trim().replace(/\/$/, "");
  localStorage.setItem("engineUrl", state.engineUrl);
  await initialize();
});

els.refreshOverview.addEventListener("click", () => refreshAll().catch((error) => setStatus(error.message, true)));
els.refreshApprovals.addEventListener("click", () => loadApprovals().catch((error) => setStatus(error.message, true)));
els.loadRegistry.addEventListener("click", () => loadRegistry().catch((error) => setStatus(error.message, true)));
els.saveRegistry.addEventListener("click", () => saveRegistry().catch((error) => setStatus(error.message, true)));
els.createJobs.addEventListener("click", () => triggerScheduler().catch((error) => setStatus(error.message, true)));
els.runWorker.addEventListener("click", () => triggerWorker().catch((error) => setStatus(error.message, true)));
els.jobFilterStatus.addEventListener("change", () => {
  state.filters.status = els.jobFilterStatus.value;
  state.selectedJobId = null;
  state.selectedJob = null;
  syncJobActionButtons();
  setJobActionStatus("Select a job to enable operator actions.");
  loadJobs().catch((error) => setStatus(error.message, true));
});
els.jobFilterChannel.addEventListener("change", () => {
  state.filters.channelId = els.jobFilterChannel.value;
  state.selectedJobId = null;
  state.selectedJob = null;
  syncJobActionButtons();
  setJobActionStatus("Select a job to enable operator actions.");
  loadJobs().catch((error) => setStatus(error.message, true));
});
els.jobRetryUpload.addEventListener("click", () => retryUploadSelectedJob().catch((error) => setJobActionStatus(error.message, true)));
els.jobRequeue.addEventListener("click", () => requeueSelectedJob().catch((error) => setJobActionStatus(error.message, true)));
els.jobRun.addEventListener("click", () => runSelectedJob().catch((error) => setJobActionStatus(error.message, true)));
els.jobFileTranscript.addEventListener("click", () => loadJobFile("transcript").catch((error) => setStatus(error.message, true)));
els.jobFilePlan.addEventListener("click", () => loadJobFile("plan").catch((error) => setStatus(error.message, true)));
els.uploadApprovalText.addEventListener("input", () => {
  grantUploadApprovalSession();
  syncUploadApprovalControls();
});
els.uploadOperatorName.addEventListener("input", () => syncUploadApprovalControls());
els.uploadApprovalReason.addEventListener("input", () => syncUploadApprovalControls());

syncJobActionButtons();
syncUploadApprovalControls();
setInterval(() => syncUploadApprovalControls(), 1000);
initialize();
