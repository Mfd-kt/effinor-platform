import { describe, expect, it } from "vitest";

import type { SimulatorInput } from "@/features/leads/simulator/domain/types";

import {
  SIMULATOR_CONSTANTS,
  clamp,
  computeDestratEconomics,
  computeInstallCost,
  computeLeadScore,
  computePrimeCEE,
  computeSimulator,
  getDestratSavingFraction,
  getSuggestedModel,
  heatingModeForEnergyCost,
} from "./simulator";

describe("simulator domain", () => {
  it("clamp hauteur/surface", () => {
    expect(clamp(2, SIMULATOR_CONSTANTS.HEIGHT_MIN, SIMULATOR_CONSTANTS.HEIGHT_MAX)).toBe(2.5);
    expect(clamp(25, SIMULATOR_CONSTANTS.HEIGHT_MIN, SIMULATOR_CONSTANTS.HEIGHT_MAX)).toBe(15);
    expect(clamp(12000, SIMULATOR_CONSTANTS.SURFACE_MIN, SIMULATOR_CONSTANTS.SURFACE_MAX)).toBe(10000);
  });

  it("suggestion modele selon hauteur", () => {
    expect(getSuggestedModel(5.5)).toBe("teddington_ds3");
    expect(getSuggestedModel(6.2)).toBe("teddington_ds7");
    expect(getSuggestedModel(7.0)).toBe("generfeu");
  });

  it("calcul nb appareils et puissance", () => {
    const result = computeDestratEconomics({
      clientType: "Tertiaire",
      heightM: 5,
      surfaceM2: 800,
      heatingMode: "gaz",
      model: "teddington_ds3",
      consigne: null,
    });

    expect(result.volumeM3).toBe(4000);
    expect(result.neededDestrat).toBe(4);
    expect(result.powerKw).toBe(64.6);
  });

  it("calcul economies", () => {
    const result = computeDestratEconomics({
      clientType: "Collectivité",
      heightM: 10,
      surfaceM2: 5000,
      heatingMode: "elec",
      model: "generfeu",
      consigne: null,
    });
    expect(result.savingKwh30).toBeGreaterThan(0);
    expect(result.savingEur30Selected).toBeGreaterThan(0);
    expect(result.co2SavedTons).toBeGreaterThan(0);
  });

  it("calcul prime CEE", () => {
    expect(computePrimeCEE("Site industriel / logistique", 100)).toBe(5183);
    expect(computePrimeCEE("Collectivité", 100)).toBe(2847);
  });

  it("calcul reste a charge", () => {
    const install = computeInstallCost("generfeu", 8);
    expect(install.installUnitPrice).toBe(2150);
    expect(install.installTotalPrice).toBe(17200);
  });

  it("score borne entre 0 et 100", () => {
    const low = computeLeadScore({
      surfaceM2: 800,
      heightM: 5,
      clientType: "Tertiaire",
      saving30EuroSelected: 0,
      restToCharge: 50000,
    });
    const high = computeLeadScore({
      surfaceM2: 10000,
      heightM: 15,
      clientType: "Site industriel / logistique",
      saving30EuroSelected: 200000,
      restToCharge: -1000,
    });
    expect(low).toBeGreaterThanOrEqual(0);
    expect(high).toBeLessThanOrEqual(100);
  });

  it("cas metier: 800/5 tertiaire gaz ds3", () => {
    const r = computeDestratEconomics({
      clientType: "Tertiaire",
      heightM: 5,
      surfaceM2: 800,
      heatingMode: "gaz",
      model: "teddington_ds3",
      consigne: "test",
    });
    expect(r.neededDestrat).toBe(4);
    expect(r.model).toBe("teddington_ds3");
  });

  it("cas metier: 5000/10 industriel gaz generfeu", () => {
    const r = computeDestratEconomics({
      clientType: "Site industriel / logistique",
      heightM: 10,
      surfaceM2: 5000,
      heatingMode: "gaz",
      model: "generfeu",
      consigne: null,
    });
    expect(r.neededDestrat).toBe(14);
    expect(r.model).toBe("generfeu");
  });

  it("cas metier: 10000/15 collectivite elec generfeu", () => {
    const r = computeDestratEconomics({
      clientType: "Collectivité",
      heightM: 15,
      surfaceM2: 10000,
      heatingMode: "elec",
      model: "generfeu",
      consigne: null,
    });
    expect(r.volumeM3).toBe(150000);
    expect(r.neededDestrat).toBe(36);
    expect(r.model).toBe("generfeu");
  });

  it("rayonnement détaillé → prix gaz (pas élec via CeeHeatingKind radiatif)", () => {
    expect(heatingModeForEnergyCost("rayonnement", "radiatif")).toBe("gaz");
  });

  it("fraction d’économie augmente avec la hauteur", () => {
    expect(getDestratSavingFraction(5)).toBe(0.2);
    expect(getDestratSavingFraction(7)).toBe(0.26);
    expect(getDestratSavingFraction(12)).toBe(0.34);
  });

  it("solution PAC : pacSavings renseigné (moteur air/eau)", () => {
    const input: SimulatorInput = {
      isHeated: true,
      isClosed: true,
      buildingAgeMoreThan2Years: true,
      buildingType: "tertiaire",
      localUsage: "stockage",
      heightM: 8,
      surfaceM2: 2000,
      setpointTemp: 19,
      heatingType: "convectif",
      currentHeatingMode: "chaudiere_eau",
      need: "chauffage",
      model: "teddington_ds7",
      consigne: null,
    };
    const r = computeSimulator(input);
    expect(r.ceeSolution.solution).toBe("PAC");
    expect(r.pacSavings).not.toBeNull();
    expect(r.pacSavings!.annualEnergySavingsKwh).toBeGreaterThan(0);
    expect(r.pacSavings!.annualCostSavings).not.toBeNull();
  });
});

