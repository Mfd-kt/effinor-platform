import type { SiteKind } from "@/types/database.types";

export const SITE_KIND_LABELS: Record<SiteKind, string> = {
  warehouse: "Entrepôt",
  office: "Bureaux",
  greenhouse: "Serre",
  industrial: "Industriel",
  retail: "Commerce / retail",
  mixed: "Mixte",
  other: "Autre",
};
