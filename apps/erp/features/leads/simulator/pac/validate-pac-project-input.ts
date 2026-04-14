import { resolveCurrentEfficiency } from "@/features/leads/simulator/pac/default-efficiency";
import type { PacProjectInput, PacValidationIssue } from "@/features/leads/simulator/pac/types";

const MAX_EFFICIENCY = 1.2;

export class PacProjectValidationError extends Error {
  readonly issues: PacValidationIssue[];

  constructor(issues: PacValidationIssue[]) {
    super(issues.map((i) => `${i.field}: ${i.message}`).join(" ; "));
    this.name = "PacProjectValidationError";
    this.issues = issues;
  }
}

function pushIfInvalid(
  issues: PacValidationIssue[],
  field: string,
  condition: boolean,
  message: string,
): void {
  if (!condition) {
    issues.push({ field, message });
  }
}

/**
 * Valide les entrées du moteur PAC. Retourne la liste des problèmes (vide si OK).
 */
export function collectPacProjectValidationIssues(input: PacProjectInput): PacValidationIssue[] {
  const issues: PacValidationIssue[] = [];

  pushIfInvalid(issues, "surfaceM2", Number.isFinite(input.surfaceM2) && input.surfaceM2 > 0, "La surface doit être strictement positive.");
  pushIfInvalid(
    issues,
    "annualHeatingNeedKwhPerM2",
    Number.isFinite(input.annualHeatingNeedKwhPerM2) && input.annualHeatingNeedKwhPerM2 > 0,
    "Le besoin annuel par m² doit être strictement positif.",
  );
  pushIfInvalid(issues, "pacScop", Number.isFinite(input.pacScop) && input.pacScop > 1, "Le SCOP de la PAC doit être strictement supérieur à 1.");

  const resolvedEff = resolveCurrentEfficiency(input.currentHeatingSystem, input.customCurrentEfficiency);
  pushIfInvalid(
    issues,
    "currentEfficiency",
    Number.isFinite(resolvedEff) && resolvedEff > 0 && resolvedEff <= MAX_EFFICIENCY,
    `Le rendement du système actuel doit être dans ]0 ; ${MAX_EFFICIENCY}].`,
  );

  if (input.customCurrentEfficiency != null && input.customCurrentEfficiency !== undefined) {
    pushIfInvalid(
      issues,
      "customCurrentEfficiency",
      Number.isFinite(input.customCurrentEfficiency),
      "Le rendement personnalisé doit être un nombre fini.",
    );
  }

  if (input.currentEnergyPricePerKwh != null && input.currentEnergyPricePerKwh !== undefined) {
    pushIfInvalid(
      issues,
      "currentEnergyPricePerKwh",
      Number.isFinite(input.currentEnergyPricePerKwh) && input.currentEnergyPricePerKwh > 0,
      "Le prix de l’énergie actuelle doit être strictement positif s’il est renseigné.",
    );
  }

  if (input.pacElectricPricePerKwh != null && input.pacElectricPricePerKwh !== undefined) {
    pushIfInvalid(
      issues,
      "pacElectricPricePerKwh",
      Number.isFinite(input.pacElectricPricePerKwh) && input.pacElectricPricePerKwh > 0,
      "Le prix de l’électricité PAC doit être strictement positif s’il est renseigné.",
    );
  }

  return issues;
}

export function validatePacProjectInput(input: PacProjectInput): void {
  const issues = collectPacProjectValidationIssues(input);
  if (issues.length > 0) {
    throw new PacProjectValidationError(issues);
  }
}
