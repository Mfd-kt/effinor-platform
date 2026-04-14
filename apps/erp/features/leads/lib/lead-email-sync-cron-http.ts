import { NextResponse } from "next/server";

import { getCronAutomationSecret } from "@/features/automation/domain/cron-auth";
import { runLeadEmailSyncCron } from "@/features/leads/services/run-lead-email-sync-cron";

type ErrorBody = {
  success: false;
  executedAt: string;
  error: { code: string; message: string };
};

function unauthorized(): NextResponse<ErrorBody> {
  return NextResponse.json(
    {
      success: false,
      executedAt: new Date().toISOString(),
      error: { code: "UNAUTHORIZED", message: "Invalid or missing credentials." },
    },
    { status: 401 },
  );
}

function notConfigured(): NextResponse<ErrorBody> {
  return NextResponse.json(
    {
      success: false,
      executedAt: new Date().toISOString(),
      error: {
        code: "CRON_NOT_CONFIGURED",
        message: "Cron secret not configured (AUTOMATION_CRON_SECRET or CRON_SECRET).",
      },
    },
    { status: 503 },
  );
}

/** Handler HTTP partagé : plusieurs chemins `/api/cron/*` pointent ici. */
export async function handleLeadEmailSyncCronHttp(request: Request): Promise<NextResponse> {
  const configuredSecret = getCronAutomationSecret();
  if (!configuredSecret) {
    return notConfigured();
  }

  const auth = request.headers.get("authorization")?.trim();
  if (auth !== `Bearer ${configuredSecret}`) {
    return unauthorized();
  }

  const result = await runLeadEmailSyncCron();

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        executedAt: result.executedAt,
        error: { code: "SYNC_DISABLED", message: result.error },
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    ...result,
  });
}
