import { z } from "zod";

import type { LeadDetailRow } from "@/features/leads/types";
import type { StudyCeeSheetForPdf } from "@/features/leads/study-pdf/domain/types";
import { resolveStudyTemplatesFromCeeSheet } from "@/features/leads/study-pdf/domain/resolve-study-templates";
import type { StudyPdfValidationIssue } from "@/features/leads/study-pdf/domain/types";

export const StudyPdfViewModelSchema = z.object({
  templateVersion: z.string().min(1),
  generatedAtIso: z.string().min(1),
  generatedByLabel: z.string().min(1),
  client: z.object({
    companyName: z.string().min(1),
    contactName: z.string(),
    contactRole: z.string(),
    phone: z.string(),
    email: z.string(),
    department: z.string(),
    activityType: z.string(),
  }),
  site: z.object({
    label: z.string().min(1),
    addressLine: z.string(),
    postalCode: z.string(),
    city: z.string(),
    type: z.string(),
    surfaceM2: z.number().positive(),
    heightM: z.number().nonnegative(),
    volumeM3: z.number().nonnegative(),
    heatingMode: z.string().min(1),
  }),
  simulation: z.object({
    model: z.string().min(1),
    neededDestrat: z.number().nonnegative(),
    modelCapacityM3h: z.number().nonnegative(),
    powerKw: z.number().nonnegative(),
    airChangeRate: z.number().nonnegative(),
    annualConsumptionKwh: z.number().nonnegative(),
    annualCostEuro: z.number().nonnegative(),
    annualSavingKwh: z.number().nonnegative(),
    annualSavingEuro: z.number().nonnegative(),
    co2SavedTons: z.number().nonnegative(),
    ceePrimeEuro: z.number().nonnegative(),
    installTotalEuro: z.number().nonnegative(),
    restToChargeEuro: z.number(),
    score: z.number().min(0).max(100).nullable(),
  }),
  qualification: z.object({
    status: z.string(),
    notes: z.array(z.string()),
    contextSummary: z.string(),
  }),
  media: z.object({
    logoUrl: z.string().url().nullable(),
    aerialPhotoUrl: z.string().url().nullable(),
    cadastralPhotoUrl: z.string().url().nullable(),
    studyMediaUrls: z.array(z.string().url()),
  }),
  ceeSolutionKind: z.enum(["destrat", "pac", "none"]),
  presentationTemplateKey: z.string().min(1),
  agreementTemplateKey: z.string().min(1),
  simulationVersusSheetMismatch: z.boolean(),
  equipmentQuantity: z.number().int().nonnegative(),
  pacCommercialMessage: z.string().nullable(),
  comparables: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      siteType: z.string(),
      surfaceM2: z.number().positive(),
      heightM: z.number().positive(),
      heatingMode: z.string(),
      measuredResult: z.string(),
      savingEuroYear: z.number().nonnegative(),
      invoiceDropPercent: z.number().nonnegative(),
      installationDurationDays: z.number().positive(),
      photoUrl: z.string().url().nullable(),
      badge: z.string(),
    }),
  ),
  products: z.array(
    z.object({
      id: z.string().min(1),
      displayName: z.string().min(1),
      description: z.string(),
      imageUrlResolved: z.string().url().nullable(),
      galleryUrls: z.array(z.string().url()).default([]),
      specsForDisplay: z.array(z.object({ label: z.string(), value: z.string() })),
      keyMetricsForDisplay: z.array(z.object({ label: z.string(), value: z.string() })),
      rationaleText: z.string(),
    }),
  ),
});

export function validateLeadForStudyPdf(
  lead: LeadDetailRow,
  opts?: { mergedSimulationJson?: unknown; ceeSheet?: StudyCeeSheetForPdf | null },
): StudyPdfValidationIssue[] {
  const issues: StudyPdfValidationIssue[] = [];

  const { ceeSolutionKind: ceeKind } = resolveStudyTemplatesFromCeeSheet(
    opts?.ceeSheet ?? null,
    lead,
    opts?.mergedSimulationJson,
  );

  if (!lead.company_name.trim()) {
    issues.push({ code: "missing_company", label: "Société manquante" });
  }
  if (lead.sim_surface_m2 === null && lead.surface_m2 === null) {
    issues.push({ code: "missing_surface", label: "Surface manquante" });
  }
  if (ceeKind !== "pac" && lead.sim_height_m === null && lead.ceiling_height_m === null) {
    issues.push({ code: "missing_height", label: "Hauteur manquante" });
  }
  if (!lead.sim_heating_mode && (!lead.heating_type || lead.heating_type.length === 0)) {
    issues.push({ code: "missing_heating_mode", label: "Mode de chauffage manquant" });
  }
  if (!lead.sim_model?.trim() && ceeKind !== "pac") {
    issues.push({ code: "missing_model", label: "Modèle d'équipement manquant" });
  }
  if (!lead.sim_client_type) {
    issues.push({ code: "missing_client_type", label: "Type de site manquant" });
  }

  return issues;
}
