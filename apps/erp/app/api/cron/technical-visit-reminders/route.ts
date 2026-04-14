import { NextResponse } from "next/server";

import { getCronDryRun, verifyCronBearer } from "@/features/cron/domain/cron-http";
import {
  runTechnicalVisitRemindersCron,
  type TechnicalVisitRemindersResult,
} from "@/features/technical-visits/services/run-technical-visit-reminders-cron";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type TechnicalVisitRemindersOkBody = {
  success: true;
  job: "technical-visit-reminders";
} & TechnicalVisitRemindersResult;

async function handleTechnicalVisitReminders(request: Request): Promise<NextResponse> {
  const auth = verifyCronBearer(request);
  if (!auth.ok) {
    return auth.response;
  }

  const dryRun = getCronDryRun(request);
  const result = await runTechnicalVisitRemindersCron({ dryRun });

  const body: TechnicalVisitRemindersOkBody = {
    success: true,
    job: "technical-visit-reminders",
    ...result,
  };

  return NextResponse.json(body);
}

export async function GET(request: Request) {
  return handleTechnicalVisitReminders(request);
}

export async function POST(request: Request) {
  return handleTechnicalVisitReminders(request);
}
