import { NextRequest, NextResponse } from "next/server";
import type { VaultTransformRequest, TransformOp } from "@/lib/ai/types";
import { createVaultJob } from "@/lib/ai/jobs";

const VALID_OPS: TransformOp[] = [
  "improve",
  "expand",
  "condense",
  "rewrite",
  "make-casual",
  "make-professional",
  "make-creative",
  "variations",
];

export async function POST(req: NextRequest) {
  let body: Partial<VaultTransformRequest>;
  try {
    body = (await req.json()) as Partial<VaultTransformRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const operation = body.operation as TransformOp;
  if (!VALID_OPS.includes(operation)) {
    return NextResponse.json({ error: "invalid operation" }, { status: 400 });
  }

  const request: VaultTransformRequest = {
    content,
    operation,
    platform: typeof body.platform === "string" ? body.platform : undefined,
    count: typeof body.count === "number" ? Math.min(Math.max(body.count, 2), 5) : 3,
  };

  const job = createVaultJob(request);
  return NextResponse.json(job, { status: 202 });
}
