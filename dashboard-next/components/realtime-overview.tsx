"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { engineBrowserBaseUrl } from "../lib/engine-api";
import type { OverviewPayload } from "../lib/engine-types";
import type { EngineSyncSettings } from "../lib/sync-settings";
import { StatusBadge } from "./status-badge";

function websocketUrl(stateView: EngineSyncSettings["stateView"]) {
  const base = engineBrowserBaseUrl();
  const url = new URL(base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/overview";
  if (stateView === "redis") {
    url.searchParams.set("state_view", "redis");
  }
  return url.toString();
}

function describeEvent(item: Record<string, unknown>) {
  const details = item.details && typeof item.details === "object" ? (item.details as Record<string, unknown>) : {};
  const compact = Object.entries(details)
    .filter(([key]) => !["actor", "actor_role", "source"].includes(key))
    .slice(0, 3)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" / ");
  return compact || "No structured details";
}

export function RealtimeOverview({
  initial,
  variant = "overview",
  syncSettings,
}: Readonly<{
  initial: OverviewPayload;
  variant?: "overview" | "operations";
  syncSettings: EngineSyncSettings;
}>) {
  const [overview, setOverview] = useState(initial);
  const [status, setStatus] = useState(syncSettings.websocketEnabled ? "connecting" : "polling");

  useEffect(() => {
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let pollTimer: ReturnType<typeof setInterval> | undefined;
    let socket: WebSocket | null = null;
    const pollUrl = `${engineBrowserBaseUrl()}/api/overview${syncSettings.stateView === "redis" ? "?state_view=redis" : ""}`;

    async function poll() {
      try {
        const response = await fetch(pollUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`poll failed: ${response.status}`);
        }
        setOverview((await response.json()) as OverviewPayload);
        setStatus("polling");
      } catch {
        setStatus("error");
      }
    }

    function connect() {
      if (closed || !syncSettings.websocketEnabled) {
        return;
      }
      socket = new WebSocket(websocketUrl(syncSettings.stateView));
      socket.onopen = () => setStatus("live");
      socket.onmessage = (event) => {
        setOverview(JSON.parse(event.data) as OverviewPayload);
        setStatus("live");
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
  }, [syncSettings.pollingIntervalMs, syncSettings.stateView, syncSettings.websocketEnabled]);

  const activeCount = ["searching", "downloaded", "transcribed", "planned", "voiceover", "rendered", "uploading"].reduce(
    (total, item) => total + (overview.job_counts[item] || 0),
    0,
  );
  const title = variant === "operations" ? "Live operations feed" : "Live engine stream";
  const subtitle =
    variant === "operations"
      ? "Queue pressure, active jobs, and recent engine events update automatically."
      : "Operational telemetry refreshes automatically from the engine websocket.";

  return (
    <div className="ta-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="ta-label text-brand-600">Realtime</p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">{subtitle}</p>
        </div>
        <span className={`ta-status font-mono ${status === "live" || status === "polling" ? "bg-success-50 text-success-700" : "bg-warning-50 text-warning-700"}`}>{status}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="font-mono text-xs text-gray-500">Queued</p>
          <strong className="mt-1 block text-2xl text-gray-900">{overview.job_counts.queued || 0}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="font-mono text-xs text-gray-500">Active</p>
          <strong className="mt-1 block text-2xl text-gray-900">{activeCount}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="font-mono text-xs text-gray-500">Rendered</p>
          <strong className="mt-1 block text-2xl text-gray-900">{overview.job_counts.rendered || 0}</strong>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="font-mono text-xs text-gray-500">Free disk</p>
          <strong className="mt-1 block text-2xl text-gray-900">{overview.storage.free_gb ?? 0} GB</strong>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="ta-label">Hot queue</p>
              <h4 className="mt-1 text-sm font-semibold text-gray-900">Most recent jobs</h4>
            </div>
            <Link className="text-xs font-semibold text-brand-600 hover:text-brand-700" href="/jobs">
              Open jobs
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {overview.jobs.slice(0, 5).map((job) => (
              <Link key={job.id} className="block rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50" href={`/jobs/${job.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <strong className="text-sm text-gray-900">#{job.id} / {job.channel_id}</strong>
                  <StatusBadge status={job.status} />
                </div>
                <p className="mt-2 text-xs text-gray-500">{job.niche} / publish {job.publish_at}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="ta-label">Event pulse</p>
          <h4 className="mt-1 text-sm font-semibold text-gray-900">Latest runtime activity</h4>
          <div className="mt-3 space-y-3">
            {overview.recent_events.slice(0, 5).map((item, index) => {
              const event = item as Record<string, unknown>;
              return (
                <div key={`${String(event.timestamp || "event")}-${index}`} className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-gray-500">
                    <span>{String(event.timestamp || "no timestamp")}</span>
                    <span>{String(event.command || "event")} / {String(event.event || "unknown")}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">{describeEvent(event)}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <p className="mt-4 font-mono text-xs text-gray-500">Last payload: {overview.generated_at}</p>
    </div>
  );
}
