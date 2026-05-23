"use client";

import { useEffect, useState } from "react";
import { engineBrowserBaseUrl } from "../lib/engine-api";
import type { JobDetailPayload } from "../lib/engine-types";
import type { EngineSyncSettings } from "../lib/sync-settings";
import { StatusBadge } from "./status-badge";

function websocketUrl(jobId: number, stateView: EngineSyncSettings["stateView"]) {
  const base = engineBrowserBaseUrl();
  const url = new URL(base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `/ws/jobs/${jobId}`;
  if (stateView === "redis") {
    url.searchParams.set("state_view", "redis");
  }
  return url.toString();
}

function summarize(item: Record<string, unknown>) {
  const details = item.details && typeof item.details === "object" ? (item.details as Record<string, unknown>) : {};
  return Object.entries(details)
    .filter(([key]) => !["actor", "actor_role", "source"].includes(key))
    .slice(0, 3)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" / ") || "No structured details";
}

function summarizeJobEvent(item: Record<string, unknown>) {
  const details = item.details && typeof item.details === "object" ? (item.details as Record<string, unknown>) : {};
  return Object.entries(details)
    .filter(([key]) => !["job_id", "stage", "event", "source"].includes(key))
    .slice(0, 3)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" / ") || "No extra details";
}

function eventTone(level?: string) {
  const normalized = (level || "").toLowerCase();
  if (normalized === "error" || normalized === "failed") {
    return "bg-error-50 text-error-700";
  }
  if (normalized === "warn" || normalized === "warning") {
    return "bg-warning-50 text-warning-700";
  }
  return "bg-success-50 text-success-700";
}

export function JobRealtimePanel({ initial, syncSettings }: Readonly<{ initial: JobDetailPayload; syncSettings: EngineSyncSettings }>) {
  const [payload, setPayload] = useState(initial);
  const [status, setStatus] = useState(syncSettings.websocketEnabled ? "connecting" : "polling");
  const activityFeed = payload.job_events.length ? payload.job_events : payload.runtime_events;

  useEffect(() => {
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let socket: WebSocket | null = null;
    const pollUrl = `${engineBrowserBaseUrl()}/api/jobs/${initial.job.id}${syncSettings.stateView === "redis" ? "?state_view=redis" : ""}`;

    async function poll() {
      try {
        const response = await fetch(pollUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`poll failed: ${response.status}`);
        }
        setPayload((await response.json()) as JobDetailPayload);
        setStatus("polling");
      } catch {
        setStatus("error");
      }
    }

    function connect() {
      if (closed || !syncSettings.websocketEnabled) {
        return;
      }
      socket = new WebSocket(websocketUrl(initial.job.id, syncSettings.stateView));
      socket.onopen = () => setStatus("live");
      socket.onmessage = (event) => {
        const next = JSON.parse(event.data) as JobDetailPayload | { status: string; message: string };
        if ("job" in next) {
          setPayload(next);
          setStatus("live");
        } else {
          setStatus(next.status || "error");
        }
      };
      socket.onerror = () => setStatus("error");
      socket.onclose = () => {
        if (closed) {
          return;
        }
        setStatus("closed");
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();
    poll();
    pollTimer = setInterval(poll, syncSettings.pollingIntervalMs);
    return () => {
      closed = true;
      if (socket) {
        socket.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (pollTimer) {
        clearInterval(pollTimer);
      }
    };
  }, [initial.job.id, syncSettings.pollingIntervalMs, syncSettings.stateView, syncSettings.websocketEnabled]);

  return (
    <section className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Realtime job feed</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Pipeline state for job #{payload.job.id}</h3>
          <p className="mt-2 text-sm text-gray-500">This panel updates automatically from the engine websocket for stage progress and recent activity.</p>
        </div>
        <span className={`ta-status font-mono ${status === "live" || status === "polling" ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700"}`}>{status}</span>
      </div>

      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="ta-label">Current stage</p>
            <strong className="mt-2 block text-lg text-gray-900">{payload.current_stage || payload.job.current_stage || payload.job.status}</strong>
          </div>
          <div className="text-right">
            <p className="ta-label">Progress</p>
            <strong className="mt-2 block text-lg text-gray-900">{Number(payload.progress_percent ?? payload.job.progress_percent ?? 0).toFixed(0)}%</strong>
          </div>
        </div>
        <div className="mt-3 h-3 rounded-full bg-white">
          <div
            className="h-3 rounded-full bg-brand-500 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, Number(payload.progress_percent ?? payload.job.progress_percent ?? 0)))}%` }}
          />
        </div>
        {payload.last_error || payload.job.last_error ? (
          <p className="mt-3 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">
            {payload.last_error || payload.job.last_error}
          </p>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Status</p>
          <div className="mt-2"><StatusBadge status={payload.job.status} /></div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Attempts</p>
          <strong className="mt-2 block text-2xl text-gray-900">{payload.attempts.length}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Artifacts</p>
          <strong className="mt-2 block text-2xl text-gray-900">{payload.artifacts.length}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Uploads</p>
          <strong className="mt-2 block text-2xl text-gray-900">{payload.uploads.length}</strong>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Latest attempts</p>
          <div className="mt-3 space-y-3">
            {payload.attempts.slice(0, 4).map((attempt) => (
              <div key={attempt.id} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-sm text-gray-900">{attempt.stage}</strong>
                  <StatusBadge status={attempt.status} />
                </div>
                <p className="mt-2 font-mono text-xs text-gray-500">{attempt.started_at} to {attempt.finished_at || "open"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Latest activity</p>
          <div className="mt-3 space-y-3">
            {activityFeed.slice(0, 6).map((item, index) => {
              const event = item as Record<string, unknown>;
              const createdAt = String(event.created_at || event.timestamp || "no timestamp");
              return (
                <div key={`${String(event.timestamp || "event")}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-gray-500">
                    <span>{createdAt}</span>
                    <span>{String(event.stage || event.command || "event")} / {String(event.level || event.event || "info")}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-800">{String(event.message || event.event || "Update")}</p>
                  <p className="mt-1 text-xs text-gray-500">{summarizeJobEvent(event)} {event.details ? "" : summarize(event)}</p>
                  <span className={`ta-status mt-3 inline-flex font-mono ${eventTone(String(event.level || event.event || ""))}`}>{String(event.level || event.event || "info")}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
