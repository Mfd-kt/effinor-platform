import { NextResponse } from "next/server";

import { getCronDryRun, verifyCronBearer } from "@/features/cron/domain/cron-http";
import {
  runLeadGenerationCommercialSlaCron,
  type LeadGenerationCommercialSlaCronResult,
} from "@/features/lead-generation/services/run-lead-generation-commercial-sla-cron";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type OkBody = {
  success: true;
  job: "lead-generation-sla";
} & LeadGenerationCommercialSlaCronResult;

async function handle(request: Request): Promise<NextResponse> {
  const auth = verifyCronBearer(request);
  if (!auth.ok) {
    return auth.response;
  }

  const dryRun = getCronDryRun(request);
  if (dryRun) {
    const body: OkBody = {
      success: true,
      job: "lead-generation-sla",
      scanned: 0,
      refreshed: 0,
      failed: 0,
      durationMs: 0,
    };
    return NextResponse.json(body);
  }

  const result = await runLeadGenerationCommercialSlaCron();
  const body: OkBody = { success: true, job: "lead-generation-sla", ...result };
  return NextResponse.json(body);
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
