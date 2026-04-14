import type { LeadDetailRow } from "@/features/leads/types";

export type LeadStudyDocumentRow = {
  id: string;
  lead_id: string;
  document_type: string;
  title: string;
  file_url: string;
  storage_bucket: string;
  storage_path: string;
  status: string;
  template_version: string;
  metadata: unknown;
  created_at: string;
  created_by: string;
};

export type StudyPdfGenerationInput = {
  lead: LeadDetailRow;
  qualificationNotes: string[];
  generatedByLabel: string;
};

export type StudyPdfValidationIssue = {
  code:
    | "missing_surface"
    | "missing_height"
    | "missing_heating_mode"
    | "missing_model"
    | "missing_company"
    | "missing_client_type";
  label: string;
};

export type StudyComparableInstallation = {
  id: string;
  title: string;
  siteType: string;
  surfaceM2: number;
  heightM: number;
  heatingMode: string;
  measuredResult: string;
  savingEuroYear: number;
  invoiceDropPercent: number;
  installationDurationDays: number;
  photoUrl: string | null;
  badge: string;
};

/** Projection minimale d’un produit pour le rendu PDF (pas de fiche catalogue complète). */
export type StudyProductViewModel = {
  id: string;
  displayName: string;
  description: string;
  /** URL finale après résolution primaire / fallback ; null si placeholder. */
  imageUrlResolved: string | null;
  /** URLs de la galerie produit (depuis product_images). */
  galleryUrls: string[];
  specsForDisplay: { label: string; value: string }[];
  keyMetricsForDisplay: { label: string; value: string }[];
  rationaleText: string;
};

export type StudyPdfViewModel = {
  templateVersion: string;
  generatedAtIso: string;
  generatedByLabel: string;
  client: {
    companyName: string;
    contactName: string;
    contactRole: string;
    phone: string;
    email: string;
    department: string;
    activityType: string;
  };
  site: {
    label: string;
    addressLine: string;
    postalCode: string;
    city: string;
    type: string;
    surfaceM2: number;
    heightM: number;
    volumeM3: number;
    heatingMode: string;
  };
  simulation: {
    model: string;
    neededDestrat: number;
    modelCapacityM3h: number;
    powerKw: number;
    airChangeRate: number;
    annualConsumptionKwh: number;
    annualCostEuro: number;
    annualSavingKwh: number;
    annualSavingEuro: number;
    co2SavedTons: number;
    ceePrimeEuro: number;
    installTotalEuro: number;
    restToChargeEuro: number;
    score: number | null;
  };
  qualification: {
    status: string;
    notes: string[];
    contextSummary: string;
  };
  media: {
    logoUrl: string | null;
    aerialPhotoUrl: string | null;
    cadastralPhotoUrl: string | null;
    studyMediaUrls: string[];
  };
  comparables: StudyComparableInstallation[];
  /** Équipement(s) préconisé(s) — résolus via le catalogue / repository produit. */
  products: StudyProductViewModel[];
};
