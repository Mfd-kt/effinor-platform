import { describe, expect, it } from "vitest";

import {
  decideCeeSolution,
  evaluateDestratEligibility,
  evaluatePacEligibility,
} from "./cee-solution-decision";

/** Profil éligible déstrat (usage tertiaire « grands volumes » typiques). */
const base = {
  isHeated: true,
  isClosed: true,
  buildingAgeMoreThan2Years: true,
  buildingType: "tertiaire" as const,
  localUsage: "commerce" as const,
  heightM: 6,
  setpointTemp: 19,
  need: "chauffage" as const,
};

describe("cee-solution-decision", () => {
  it("destrat si toutes les conditions", () => {
    expect(evaluateDestratEligibility(base)).toBe(true);
    const d = decideCeeSolution(base);
    expect(d.solution).toBe("DESTRAT");
    expect(d.eligible).toBe(true);
    expect(d.commercialMessage.length).toBeGreaterThan(20);
  });

  it("PAC si hauteur < 5 m (ex. commerce tertiaire)", () => {
    const d = decideCeeSolution({ ...base, localUsage: "commerce", heightM: 3.5 });
    expect(d.solution).toBe("PAC");
    expect(evaluateDestratEligibility({ ...base, localUsage: "commerce", heightM: 3.5 })).toBe(false);
    expect(d.reason).toMatch(/5/);
  });

  it("PAC pour bureau / santé / hôtellerie-restauration / enseignement (pas de déstrat)", () => {
    for (const localUsage of ["bureau", "sante", "hotellerie_restauration", "enseignement"] as const) {
      expect(evaluateDestratEligibility({ ...base, localUsage })).toBe(false);
      const d = decideCeeSolution({ ...base, localUsage });
      expect(d.solution).toBe("PAC");
      expect(d.commercialMessage.toLowerCase()).toMatch(/pompe|chaleur/);
    }
  });

  it("pas de destrat si stockage", () => {
    expect(
      evaluateDestratEligibility({
        ...base,
        localUsage: "stockage",
      }),
    ).toBe(false);
  });

  it("pas de destrat si usage logistique (même avec type tertiaire incohérent)", () => {
    expect(
      evaluateDestratEligibility({
        ...base,
        buildingType: "tertiaire",
        localUsage: "logistique",
      }),
    ).toBe(false);
  });

  it("pas de destrat si non clos", () => {
    expect(evaluateDestratEligibility({ ...base, isClosed: false })).toBe(false);
  });

  it("pas de destrat si consigne < 15", () => {
    expect(evaluateDestratEligibility({ ...base, setpointTemp: 14 })).toBe(false);
  });

  it("PAC si destrat exclu et critères PAC ok", () => {
    const d = decideCeeSolution({
      ...base,
      localUsage: "stockage",
      buildingAgeMoreThan2Years: true,
      buildingType: "tertiaire",
      need: "chauffage",
    });
    expect(d.solution).toBe("PAC");
    expect(d.eligible).toBe(true);
  });

  it("PAC si type logistique (usage stockage déduit d’un seul champ)", () => {
    const d = decideCeeSolution({
      ...base,
      buildingType: "logistique",
      localUsage: "stockage",
    });
    expect(d.solution).toBe("PAC");
    expect(d.eligible).toBe(true);
  });

  it("NONE si destrat exclu et PAC inéligible (ECS seule)", () => {
    const d = decideCeeSolution({
      ...base,
      localUsage: "stockage",
      need: "ecs_seule",
    });
    expect(d.solution).toBe("NONE");
    expect(d.eligible).toBe(false);
  });

  it("PAC inéligible si bâtiment neuf", () => {
    expect(
      evaluatePacEligibility({
        ...base,
        localUsage: "stockage",
        buildingAgeMoreThan2Years: false,
      }),
    ).toBe(false);
  });

  it("jamais PAC et destrat : destrat prioritaire", () => {
    const d = decideCeeSolution(base);
    expect(d.solution).toBe("DESTRAT");
  });

  it("destrat industriel (atelier) avec fiche IND-BA-110", () => {
    const input = {
      ...base,
      buildingType: "industriel" as const,
      localUsage: "atelier" as const,
    };
    expect(evaluateDestratEligibility(input)).toBe(true);
    const d = decideCeeSolution(input);
    expect(d.solution).toBe("DESTRAT");
    expect(d.destratCeeSheetCode).toBe("IND-BA-110");
  });

  it("destrat tertiaire expose BAT-TH-142", () => {
    const d = decideCeeSolution(base);
    expect(d.destratCeeSheetCode).toBe("BAT-TH-142");
  });

  it("recommandation PAC + chauffage électrique direct ou PAC existante → NONE", () => {
    const pacCase = { ...base, localUsage: "bureau" as const };
    expect(evaluateDestratEligibility(pacCase)).toBe(false);
    expect(evaluatePacEligibility(pacCase)).toBe(true);
    for (const currentHeatingMode of ["electrique_direct", "pac_air_air", "pac_air_eau"] as const) {
      const d = decideCeeSolution(pacCase, { currentHeatingMode });
      expect(d.solution).toBe("NONE");
      expect(d.eligible).toBe(false);
    }
  });

  it("recommandation PAC + chaudière eau : PAC conservée", () => {
    const pacCase = { ...base, localUsage: "bureau" as const };
    const d = decideCeeSolution(pacCase, { currentHeatingMode: "chaudiere_eau" });
    expect(d.solution).toBe("PAC");
  });

  it("destrat éligible : chauffage électrique ne force pas NONE (branche déstrat prioritaire)", () => {
    const d = decideCeeSolution(base, { currentHeatingMode: "electrique_direct" });
    expect(d.solution).toBe("DESTRAT");
  });
});
