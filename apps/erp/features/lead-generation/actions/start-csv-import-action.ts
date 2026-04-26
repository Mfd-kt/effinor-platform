"use server";

import { revalidatePath } from "next/cache";

import {
  CSV_MANUAL_MAX_FILE_SIZE,
  CSV_MANUAL_MAX_ROWS,
} from "@/features/lead-generation/csv/config";
import {
  startCsvImport,
  type StartCsvImportResult,
} from "@/features/lead-generation/csv/start-csv-import";
import { getAccessContext } from "@/lib/auth/access-context";

export type StartCsvImportActionResult =
  | {
      ok: true;
      batchId: string;
      summary: {
        totalLines: number;
        mapped: number;
        rejectedMapping: number;
        accepted: number;
        duplicates: number;
        rejectedIngest: number;
        unknownColumns: string[];
      };
    }
  | { ok: false; error: string };

/**
 * Server Action : import CSV manuel.
 * Récupère le fichier uploadé + le label via FormData (Next 16 natif).
 * Nécessite le rôle `lead_generation_quantifier`, `admin` ou `super_admin`.
 */
export async function startCsvImportAction(
  formData: FormData
): Promise<StartCsvImportActionResult> {
  const access = await getAccessContext();
  if (access.kind !== "authenticated") {
    return { ok: false, error: "Non authentifié" };
  }

  const roleCodes = access.roleCodes ?? [];
  const isAuthorized =
    roleCodes.includes("lead_generation_quantifier") ||
    roleCodes.includes("admin") ||
    roleCodes.includes("super_admin");

  if (!isAuthorized) {
    return {
      ok: false,
      error: "Rôle insuffisant : réservé aux quantifiers et admins.",
    };
  }

  const labelRaw = formData.get("label");
  const fileRaw = formData.get("file");

  if (typeof labelRaw !== "string" || labelRaw.trim().length === 0) {
    return { ok: false, error: "Nom de l'import obligatoire." };
  }

  if (!(fileRaw instanceof File) || fileRaw.size === 0) {
    return { ok: false, error: "Fichier CSV obligatoire." };
  }

  if (fileRaw.size > CSV_MANUAL_MAX_FILE_SIZE) {
    const maxMb = Math.round(CSV_MANUAL_MAX_FILE_SIZE / 1024 / 1024);
    return {
      ok: false,
      error: `Fichier trop volumineux (${(fileRaw.size / 1024 / 1024).toFixed(
        1
      )} MB). Maximum : ${maxMb} MB (~${CSV_MANUAL_MAX_ROWS.toLocaleString(
        "fr-FR"
      )} lignes).`,
    };
  }

  const fileName = (fileRaw.name ?? "import.csv").slice(0, 160);

  let csvText: string;
  try {
    csvText = await fileRaw.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "lecture fichier impossible";
    return { ok: false, error: `Lecture CSV impossible : ${msg}` };
  }

  const result: StartCsvImportResult = await startCsvImport(
    { label: labelRaw.trim(), fileName, csvText },
    { userId: access.userId }
  );

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath("/lead-generation");
  revalidatePath("/lead-generation/imports");
  revalidatePath("/lead-generation/stock");

  return { ok: true, batchId: result.batchId, summary: result.summary };
}
