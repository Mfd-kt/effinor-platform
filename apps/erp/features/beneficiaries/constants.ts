import type { BeneficiaryStatus } from "@/types/database.types";

export const BENEFICIARY_STATUS_LABELS: Record<BeneficiaryStatus, string> = {
  prospect: "Prospect",
  active: "Actif",
  inactive: "Inactif",
  blocked: "Bloqué",
};

export const CIVILITY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "—" },
  { value: "M.", label: "M." },
  { value: "Mme", label: "Mme" },
  { value: "Mlle", label: "Mlle" },
  { value: "Autre", label: "Autre" },
];
