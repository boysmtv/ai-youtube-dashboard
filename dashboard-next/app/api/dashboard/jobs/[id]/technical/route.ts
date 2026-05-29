import { NextRequest, NextResponse } from "next/server";
import { getJobTechnical } from "../../../../../../lib/engine-api";
import type { EngineStateView } from "../../../../../../lib/sync-settings";

function parseStateView(value: string | null): EngineStateView {
  return value === "redis" ? "redis" : "default";
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const jobId = Number(params.id);
  if (!Number.isFinite(jobId)) {
    return NextResponse.json({ error: "Invalid job id" }, { status: 400 });
  }

  try {
    const stateView = parseStateView(request.nextUrl.searchParams.get("state_view"));
    const payload = await getJobTechnical(jobId, stateView);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load technical job details.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
