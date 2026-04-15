import type { AdminCeeSheetListItem } from "@/features/cee-workflows/queries/get-admin-cee-sheets";

export type CeeSheetVtConfigStatus = "not_required" | "configured" | "incomplete";

export function resolveCeeSheetVtConfigStatus(
  sheet: Pick<
    AdminCeeSheetListItem,
    "requiresTechnicalVisit" | "technicalVisitTemplateKey" | "technicalVisitTemplateVersion"
  >,
): CeeSheetVtConfigStatus {
  if (!sheet.requiresTechnicalVisit) return "not_required";
  if (
    sheet.technicalVisitTemplateKey?.trim() &&
    sheet.technicalVisitTemplateVersion != null &&
    Number.isFinite(Number(sheet.technicalVisitTemplateVersion))
  ) {
    return "configured";
  }
  return "incomplete";
}

export function ceeSheetVtConfigStatusLabel(status: CeeSheetVtConfigStatus): string {
  switch (status) {
    case "not_required":
      return "VT non requise";
    case "configured":
      return "VT configurée";
    case "incomplete":
      return "VT à configurer";
  }
}
