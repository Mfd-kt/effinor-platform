import { NextResponse } from "next/server";

import { getCronAutomationSecret } from "@/features/automation/domain/cron-auth";

/** Corps JSON commun pour les erreurs des routes `/api/cron/*`. */
export type CronHttpErrorBody = {
  success: false;
  executedAt: string;
  error: { code: string; message: string };
};

export type VerifyCronBearerResult =
  | { ok: true }
  | { ok: false; response: NextResponse<CronHttpErrorBody> };

const DRY_RUN_QUERY_PARAM = "dryRun";
const DRY_RUN_HEADER = "x-cron-dry-run";

function cronUnauthorizedResponse(): NextResponse<CronHttpErrorBody> {
  return NextResponse.json(
    {
      success: false,
      executedAt: new Date().toISOString(),
      error: { code: "UNAUTHORIZED", message: "Invalid or missing credentials." },
    },
    { status: 401 },
  );
}

function cronNotConfiguredResponse(): NextResponse<CronHttpErrorBody> {
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

/**
 * Vérifie le header `Authorization: Bearer <secret>` avec le même secret que les crons existants.
 */
export function verifyCronBearer(request: Request): VerifyCronBearerResult {
  const configuredSecret = getCronAutomationSecret();
  console.log("[cron auth debug]", {
    hasSecret: !!configuredSecret,
    authHeader: request.headers.get("authorization"),
  });
  if (!configuredSecret) {
    return { ok: false, response: cronNotConfiguredResponse() };
  }

  const auth = request.headers.get("authorization")?.trim();
  if (auth !== `Bearer ${configuredSecret}`) {
    return { ok: false, response: cronUnauthorizedResponse() };
  }

  return { ok: true };
}

/**
 * Mode dry-run : `?dryRun=1` ou header `X-Cron-Dry-Run: 1` (insensible à la casse pour le nom du header).
 */
export function getCronDryRun(request: Request): boolean {
  const url = new URL(request.url);
  if (url.searchParams.get(DRY_RUN_QUERY_PARAM) === "1") {
    return true;
  }
  const header = request.headers.get(DRY_RUN_HEADER)?.trim();
  return header === "1";
}
