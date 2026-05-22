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

export function JobRealtimePanel({ initial, syncSettings }: Readonly<{ initial: JobDetailPayload; syncSettings: EngineSyncSettings }>) {
  const [payload, setPayload] = useState(initial);
  const [status, setStatus] = useState(syncSettings.websocketEnabled ? "connecting" : "polling");

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
          <p className="mt-2 text-sm text-gray-500">This panel updates automatically from the engine websocket for attempts, uploads, and runtime activity.</p>
        </div>
        <span className={`ta-status font-mono ${status === "live" || status === "polling" ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700"}`}>{status}</span>
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
          <p className="ta-label">Latest events</p>
          <div className="mt-3 space-y-3">
            {payload.runtime_events.slice(0, 4).map((item, index) => {
              const event = item as Record<string, unknown>;
              return (
                <div key={`${String(event.timestamp || "event")}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-gray-500">
                    <span>{String(event.timestamp || "no timestamp")}</span>
                    <span>{String(event.command || "event")} / {String(event.event || "unknown")}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{summarize(event)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
