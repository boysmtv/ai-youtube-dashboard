import Link from "next/link";
import { cleanupArtifactBundle } from "./actions";
import { AppShell } from "../../components/app-shell";
import { ConfirmSubmitButton } from "../../components/confirm-submit-button";
import { MetricCard } from "../../components/metric-card";
import { StatusBadge } from "../../components/status-badge";
import { requireDashboardSession } from "../../lib/dashboard-auth";
import { engineArtifactDownloadUrl, engineJobFileDownloadUrl, getArtifactsIndex, getRegistry } from "../../lib/engine-api";

function EmptyState({ label }: Readonly<{ label: string }>) {
  return <div className="ta-empty">{label}</div>;
}

function bytesLabel(value?: number | null) {
  if (!value || value <= 0) {
    return "Unknown size";
  }
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function DownloadAnchor({ href, label }: Readonly<{ href: string; label: string }>) {
  return (
    <a className="ta-button-muted" href={href} rel="noreferrer" target="_blank">
      {label}
    </a>
  );
}

export default async function ArtifactsPage({
  searchParams,
}: Readonly<{
  searchParams?: { status?: string; channel_id?: string; query?: string };
}>) {
  requireDashboardSession("/artifacts");
  const status = String(searchParams?.status || "");
  const channelId = String(searchParams?.channel_id || "");
  const query = String(searchParams?.query || "");
  const [registry, artifactIndex] = await Promise.all([
    getRegistry(),
    getArtifactsIndex(24, { status, channel_id: channelId, query }),
  ]);

  const totalArtifacts = artifactIndex.items.reduce((sum, item) => sum + item.artifacts.length, 0);
  const transcriptCount = artifactIndex.items.filter((item) => item.transcript).length;
  const planCount = artifactIndex.items.filter((item) => item.plan).length;
  const missingFiles = artifactIndex.items.reduce((sum, item) => {
    const artifactMisses = item.artifacts.filter((artifact) => artifact.exists === false).length;
    const transcriptMiss = item.transcript === null ? 1 : 0;
    const planMiss = item.plan === null ? 1 : 0;
    return sum + artifactMisses + transcriptMiss + planMiss;
  }, 0);

  return (
    <AppShell>
      <header className="ta-panel p-6">
        <p className="ta-label text-brand-600">Artifacts</p>
        <h2 className="mt-3 text-4xl font-bold leading-none text-gray-900">File video dan output kerja.</h2>
        <p className="mt-4 max-w-3xl text-gray-500">
          Files stay on host volumes. This page only indexes metadata, previews availability, and lets operators clean up files without bloating Docker images.
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <form className="grid gap-4 xl:grid-cols-[0.9fr_0.9fr_1.2fr_auto]">
          <label className="space-y-2">
            <span className="ta-label">Status</span>
            <select className="ta-input" defaultValue={status} name="status">
              <option value="">All statuses</option>
              {["downloaded", "transcribed", "planned", "voiceover", "rendered", "uploaded", "failed", "cleaned"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="ta-label">Channel</span>
            <select className="ta-input" defaultValue={channelId} name="channel_id">
              <option value="">All channels</option>
              {registry.channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.display_name || channel.id}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="ta-label">Search</span>
            <input className="ta-input" defaultValue={query} name="query" placeholder="job id, channel, niche, path, artifact kind" />
          </label>
          <div className="flex items-end">
            <button className="ta-button-primary w-full" type="submit">
              Apply filters
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Indexed Jobs" value={artifactIndex.count} />
        <MetricCard label="Artifact Files" value={totalArtifacts} tone={totalArtifacts ? "good" : "warn"} />
        <MetricCard label="Transcript Files" value={transcriptCount} tone={transcriptCount ? "good" : "warn"} />
        <MetricCard label="Missing Signals" value={missingFiles} tone={missingFiles ? "warn" : "good"} />
        <MetricCard label="Plan Files" value={planCount} tone={planCount ? "good" : "warn"} />
      </section>

      <section className="mt-6 grid gap-6">
        {artifactIndex.items.length ? (
          artifactIndex.items.map((item) => (
            <article key={item.job.id} className="ta-panel p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link className="text-lg font-semibold text-brand-600 underline-offset-4 hover:underline" href={`/jobs/${item.job.id}`}>
                      Job #{item.job.id}
                    </Link>
                    <StatusBadge status={item.job.status} />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {item.job.channel_id} / {item.job.niche} / publish {item.job.publish_at}
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-gray-500">output={item.job.output_dir || "not assigned"} / manifest={item.job.manifest_path || "not assigned"}</p>
                </div>
                <form action={cleanupArtifactBundle} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <input name="job_id" type="hidden" value={item.job.id} />
                  <div className="grid gap-2 text-xs text-gray-600">
                    <label className="flex items-center gap-2">
                      <input className="ta-check" defaultChecked name="include_artifacts" type="checkbox" />
                      Artifact files
                    </label>
                    <label className="flex items-center gap-2">
                      <input className="ta-check" defaultChecked name="include_working_files" type="checkbox" />
                      Transcript, plan, voice
                    </label>
                    <label className="flex items-center gap-2">
                      <input className="ta-check" name="include_downloads" type="checkbox" />
                      Source download
                    </label>
                  </div>
                  <div className="mt-3">
                    <ConfirmSubmitButton
                      className="w-full"
                      message={`Clean files for job #${item.job.id}? Metadata stays, host files will be removed.`}
                      pendingText="Cleaning..."
                      tone="danger"
                    >
                      Cleanup files
                    </ConfirmSubmitButton>
                  </div>
                </form>
              </div>

              <div className="mt-5 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="ta-label">Working files</p>
                    <div className="mt-3 space-y-3 text-sm text-gray-700">
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-gray-900">Transcript</strong>
                          {item.transcript ? <DownloadAnchor href={engineJobFileDownloadUrl(item.job.id, "transcript")} label="Download" /> : null}
                        </div>
                        <p className="mt-1 break-all font-mono text-xs text-gray-500">{item.transcript?.path || "not available"}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-gray-900">Plan</strong>
                          {item.plan ? <DownloadAnchor href={engineJobFileDownloadUrl(item.job.id, "plan")} label="Download" /> : null}
                        </div>
                        <p className="mt-1 break-all font-mono text-xs text-gray-500">{item.plan?.path || "not available"}</p>
                      </div>
                      <div>
                        <strong className="text-gray-900">Manifest</strong>
                        <p className="mt-1 break-all font-mono text-xs text-gray-500">{item.job.manifest_path || "not available"}</p>
                        <p className="mt-2 text-xs text-gray-500">manifest status={item.manifest_status}</p>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <p className="ta-label">Upload evidence</p>
                    <div className="mt-3 space-y-3">
                      {item.uploads.length ? (
                        item.uploads.slice(0, 2).map((upload) => (
                          <div key={upload.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <StatusBadge status={upload.status} />
                              <span className="ta-label">{upload.privacy_status}</span>
                            </div>
                            <p className="mt-2">publish={upload.publish_at}</p>
                            {upload.youtube_url ? (
                              <a className="mt-2 inline-flex text-brand-600 hover:text-brand-700" href={upload.youtube_url} rel="noreferrer" target="_blank">
                                Open YouTube URL
                              </a>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <EmptyState label="No upload evidence recorded yet." />
                      )}
                    </div>
                  </section>
                </div>

                <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="ta-label">Rendered outputs</p>
                  <div className="mt-3 grid gap-3">
                    {item.artifacts.length ? (
                      item.artifacts.map((artifact) => (
                        <div key={artifact.id} className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <strong className="text-sm text-gray-900">{artifact.kind}</strong>
                            <div className="flex items-center gap-2">
                              <span className={`ta-status ${artifact.exists === false ? "bg-warning-50 text-warning-700" : "bg-success-50 text-success-700"}`}>
                                {artifact.exists === false ? "missing" : "present"}
                              </span>
                              {artifact.exists === false ? null : <DownloadAnchor href={engineArtifactDownloadUrl(item.job.id, artifact.id)} label="Download" />}
                            </div>
                          </div>
                          <p className="mt-2 break-all font-mono text-xs text-gray-500">{artifact.path}</p>
                          <p className="mt-2 text-xs text-gray-500">
                            {bytesLabel(artifact.size_bytes)} / {artifact.created_at}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState label="No artifact files recorded yet." />
                    )}
                  </div>
                </section>
              </div>
            </article>
          ))
        ) : (
          <EmptyState label="No artifact-bearing jobs matched the current filters." />
        )}
      </section>
    </AppShell>
  );
}
