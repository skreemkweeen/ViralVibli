import { NextRequest, NextResponse } from "next/server";
import { getJob, cancelJob } from "@/lib/ai/jobs";

/** Shared job polling/cancellation endpoint. Works for all job kinds. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cancelled = cancelJob(id);
  if (!cancelled)
    return NextResponse.json({ error: "Job not found or already terminal" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
