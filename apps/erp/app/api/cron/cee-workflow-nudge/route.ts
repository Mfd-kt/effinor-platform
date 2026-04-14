import { NextResponse } from "next/server";

import {
  runCeeWorkflowNudgeCron,
  type CeeWorkflowNudgeResult,
} from "@/features/cee-workflows/services/run-cee-workflow-nudge-cron";
import { getCronDryRun, verifyCronBearer } from "@/features/cron/domain/cron-http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type CeeWorkflowNudgeOkBody = {
  success: true;
  job: "cee-workflow-nudge";
} & CeeWorkflowNudgeResult;

async function handleCeeWorkflowNudge(request: Request): Promise<NextResponse> {
  const auth = verifyCronBearer(request);
  if (!auth.ok) {
    return auth.response;
  }

  const dryRun = getCronDryRun(request);
  const result = await runCeeWorkflowNudgeCron({ dryRun });

  const body: CeeWorkflowNudgeOkBody = {
    success: true,
    job: "cee-workflow-nudge",
    ...result,
  };

  return NextResponse.json(body);
}

export async function GET(request: Request) {
  return handleCeeWorkflowNudge(request);
}

export async function POST(request: Request) {
  return handleCeeWorkflowNudge(request);
}
