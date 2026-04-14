import { describe, expect, it } from "vitest";

import { calculatePacSavings } from "@/features/leads/simulator/pac/calculate-pac-savings";
import { getDefaultCurrentEfficiency } from "@/features/leads/simulator/pac/default-efficiency";
import { getPacSavingsBand } from "@/features/leads/simulator/pac/get-pac-savings-band";
import {
  collectPacProjectValidationIssues,
  PacProjectValidationError,
  validatePacProjectInput,
} from "@/features/leads/simulator/pac/validate-pac-project-input";
import type { PacProjectInput } from "@/features/leads/simulator/pac/types";

const baseInput: PacProjectInput = {
  surfaceM2: 1000,
  annualHeatingNeedKwhPerM2: 120,
  currentHeatingSystem: "chaudiere_gaz_classique",
  pacScop: 3.1,
};

describe("calculatePacSavings", () => {
  it("exemple chaudière gaz classique + prix (cible spec)", () => {
    const input: PacProjectInput = {
      ...baseInput,
      currentEnergyPricePerKwh: 0.11,
      pacElectricPricePerKwh: 0.18,
    };
    const r = calculatePacSavings(input);

    expect(r.annualUsefulHeatingNeedKwh).toBe(120_000);
    expect(r.currentEfficiency).toBe(0.82);
    expect(r.currentConsumptionKwh).toBe(146_341);
    expect(r.pacConsumptionKwh).toBe(38_710);
    expect(r.annualEnergySavingsKwh).toBe(107_631);
    expect(r.annualEnergySavingsPercent).toBe(73.5);

    expect(r.currentAnnualCost).toBeCloseTo(16097.51, 2);
    expect(r.pacAnnualCost).toBeCloseTo(6967.8, 2);
    expect(r.annualCostSavings).toBeCloseTo(9129.71, 2);

    expect(r.commercialMessage).toContain("très fort potentiel");
    expect(r.commercialMessage).toContain("Estimation théorique");
  });

  it("chaudière gaz condensation : rendement par défaut 0,94", () => {
    const r = calculatePacSavings({
      ...baseInput,
      currentHeatingSystem: "chaudiere_gaz_condensation",
      pacScop: 3.5,
    });
    expect(r.currentEfficiency).toBe(0.94);
    expect(r.currentConsumptionKwh).toBe(Math.round(120_000 / 0.94));
    expect(r.pacConsumptionKwh).toBe(Math.round(120_000 / 3.5));
    expect(r.currentAnnualCost).toBeNull();
    expect(r.annualCostSavings).toBeNull();
  });

  it("chauffage électrique direct : rendement 1,00", () => {
    const r = calculatePacSavings({
      ...baseInput,
      currentHeatingSystem: "chauffage_electrique_direct",
      pacScop: 3.2,
    });
    expect(r.currentEfficiency).toBe(1);
    expect(r.currentConsumptionKwh).toBe(120_000);
  });

  it("override customCurrentEfficiency", () => {
    const r = calculatePacSavings({
      ...baseInput,
      customCurrentEfficiency: 0.75,
      pacScop: 3.1,
    });
    expect(r.currentEfficiency).toBe(0.75);
    expect(r.currentConsumptionKwh).toBe(Math.round(120_000 / 0.75));
  });

  it("rejette SCOP <= 1", () => {
    expect(() =>
      calculatePacSavings({
        ...baseInput,
        pacScop: 1,
      }),
    ).toThrow(PacProjectValidationError);
  });

  it("rejette surface <= 0", () => {
    expect(() =>
      calculatePacSavings({
        ...baseInput,
        surfaceM2: 0,
      }),
    ).toThrow(PacProjectValidationError);
  });

  it("€ null si un seul prix fourni (validation échoue si incomplet pour coûts —ici les deux absents)", () => {
    const r = calculatePacSavings({ ...baseInput, pacScop: 3.1 });
    expect(r.currentAnnualCost).toBeNull();
    expect(r.pacAnnualCost).toBeNull();
    expect(r.annualCostSavings).toBeNull();
  });

  it("€ calculés uniquement si les deux prix sont fournis", () => {
    const r = calculatePacSavings({
      ...baseInput,
      currentEnergyPricePerKwh: 0.1,
      pacElectricPricePerKwh: 0.2,
    });
    expect(r.currentAnnualCost).not.toBeNull();
    expect(r.pacAnnualCost).not.toBeNull();
    expect(r.annualCostSavings).not.toBeNull();
  });
});

describe("getDefaultCurrentEfficiency", () => {
  it("valeurs métier attendues", () => {
    expect(getDefaultCurrentEfficiency("chaudiere_fioul")).toBe(0.8);
    expect(getDefaultCurrentEfficiency("rooftop_cta_air_chaud")).toBe(0.83);
    expect(getDefaultCurrentEfficiency("autre")).toBe(0.85);
  });
});

describe("validatePacProjectInput / collectPacProjectValidationIssues", () => {
  it("collecte les erreurs sans throw", () => {
    const issues = collectPacProjectValidationIssues({ ...baseInput, surfaceM2: -1, pacScop: 0.5 });
    expect(issues.length).toBeGreaterThanOrEqual(2);
  });

  it("rejette rendement personnalisé > 1,2", () => {
    const issues = collectPacProjectValidationIssues({
      ...baseInput,
      customCurrentEfficiency: 1.3,
    });
    expect(issues.some((i) => i.field === "currentEfficiency")).toBe(true);
  });

  it("validatePacProjectInput throw PacProjectValidationError", () => {
    expect(() => validatePacProjectInput({ ...baseInput, pacScop: 0.9 })).toThrow(PacProjectValidationError);
  });
});

describe("getPacSavingsBand", () => {
  it("seuils", () => {
    expect(getPacSavingsBand(20)).toBe("faible");
    expect(getPacSavingsBand(40)).toBe("moyen");
    expect(getPacSavingsBand(55)).toBe("fort");
    expect(getPacSavingsBand(75)).toBe("tres_fort");
  });
});

describe("buildCommercialMessage (via résultat)", () => {
  it("seuil 50–70 %", () => {
    const r = calculatePacSavings({
      ...baseInput,
      /** Réglage pour viser ~55 % d’économie après arrondis */
      currentHeatingSystem: "chaudiere_gaz_condensation",
      pacScop: 2.2,
    });
    expect(r.annualEnergySavingsPercent).toBeGreaterThanOrEqual(50);
    expect(r.annualEnergySavingsPercent).toBeLessThan(70);
    expect(r.commercialMessage).toContain("important");
  });

  it("seuil < 50 %", () => {
    const r = calculatePacSavings({
      ...baseInput,
      currentHeatingSystem: "chaudiere_gaz_condensation",
      pacScop: 1.5,
    });
    expect(r.annualEnergySavingsPercent).toBeLessThan(50);
    expect(r.commercialMessage).toContain("confirmer par étude");
  });
});
