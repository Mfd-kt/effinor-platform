import { describe, expect, it } from "vitest";

import { mergeLeadDetailWithWorkflowSimulationResult } from "./merge-workflow-simulation-into-lead-for-pdf";
import { validateLeadForStudyPdf } from "./validation";

describe("mergeLeadDetailWithWorkflowSimulationResult", () => {
  it("remplit les champs sim_* vides à partir du JSON workflow (camelCase)", () => {
    const lead = {
      company_name: "ACME",
      sim_surface_m2: null,
      surface_m2: null,
      sim_height_m: null,
      ceiling_height_m: null,
      sim_heating_mode: null,
      heating_type: null,
      sim_model: null,
      sim_client_type: null,
    } as any;

    const merged = mergeLeadDetailWithWorkflowSimulationResult(lead, {
      surfaceM2: 1200,
      heightM: 8,
      heatingMode: "Air pulsé",
      model: "DS-500",
      clientType: "Entrepôt",
    });

    expect(validateLeadForStudyPdf(merged)).toEqual([]);
    expect(merged.sim_surface_m2).toBe(1200);
    expect(merged.sim_height_m).toBe(8);
    expect(merged.sim_model).toBe("DS-500");
  });

  it("lit un snapshot workflow { result, normalizedInput } comme le résultat à plat", () => {
    const lead = {
      company_name: "ACME",
      sim_surface_m2: null,
      sim_height_m: null,
      sim_heating_mode: null,
      heating_type: null,
      sim_model: null,
      sim_client_type: null,
    } as any;

    const merged = mergeLeadDetailWithWorkflowSimulationResult(lead, {
      version: "1",
      simulatedAtIso: "2026-04-11T12:00:00.000Z",
      result: {
        surfaceM2: 800,
        heightM: 9,
        heatingMode: "gaz",
        model: "teddington_ds3",
        clientType: "Tertiaire",
        volumeM3: 7200,
        leadScore: 72,
      },
      normalizedInput: {
        surfaceM2: 800,
        clientType: "Tertiaire",
      },
    });

    expect(merged.sim_surface_m2).toBe(800);
    expect(merged.sim_height_m).toBe(9);
    expect(merged.sim_model).toBe("teddington_ds3");
    expect(merged.simulated_at).toBe("2026-04-11T12:00:00.000Z");
    expect(merged.sim_version).toBe("1");
  });

  it("complète modèle et type site depuis normalizedInput / input si result ne les contient pas", () => {
    const lead = {
      company_name: "ACME",
      sim_surface_m2: null,
      sim_height_m: null,
      sim_heating_mode: null,
      heating_type: null,
      sim_model: null,
      sim_client_type: null,
    } as any;

    const merged = mergeLeadDetailWithWorkflowSimulationResult(lead, {
      version: "1",
      result: {
        surfaceM2: 500,
        heightM: 6,
        leadScore: 40,
      },
      normalizedInput: {
        model: "generfeu",
        clientType: "Site industriel / logistique",
        surfaceM2: 500,
        heightM: 6,
        heatingMode: "gaz",
        consigne: null,
      },
      input: {
        model: "generfeu",
        clientType: "Site industriel / logistique",
        surfaceM2: 500,
        heightM: 6,
        heatingMode: "gaz",
      },
    });

    expect(merged.sim_model).toBe("generfeu");
    expect(merged.sim_client_type).toBe("Site industriel / logistique");
    expect(validateLeadForStudyPdf(merged)).toEqual([]);
  });

  it("enchaîne résultat partiel puis snapshot entrée comme generateLeadStudyPdf", () => {
    const lead = {
      company_name: "ACME",
      sim_surface_m2: null,
      sim_height_m: null,
      sim_heating_mode: null,
      heating_type: null,
      sim_model: null,
      sim_client_type: null,
    } as any;

    let merged = mergeLeadDetailWithWorkflowSimulationResult(lead, {
      savingEur30Selected: 1200,
      restToCharge: 800,
    });

    merged = mergeLeadDetailWithWorkflowSimulationResult(merged, {
      version: "1",
      simulatedAtIso: "2026-04-11T12:00:00.000Z",
      result: {
        surfaceM2: 900,
        heightM: 7,
        heatingMode: "gaz",
        model: "teddington_ds3",
        clientType: "Tertiaire",
        volumeM3: 6300,
        leadScore: 55,
      },
      normalizedInput: {
        surfaceM2: 900,
        heightM: 7,
        heatingMode: "gaz",
        model: "teddington_ds3",
        clientType: "Tertiaire",
        consigne: null,
      },
    });

    expect(merged.sim_model).toBe("teddington_ds3");
    expect(merged.sim_client_type).toBe("Tertiaire");
    expect(validateLeadForStudyPdf(merged)).toEqual([]);
  });

  it("ne remplace pas les colonnes lead déjà renseignées", () => {
    const lead = {
      company_name: "ACME",
      sim_surface_m2: 900,
      sim_height_m: 7,
      sim_heating_mode: "Plancher",
      heating_type: null,
      sim_model: "X1",
      sim_client_type: "Atelier",
    } as any;

    const merged = mergeLeadDetailWithWorkflowSimulationResult(lead, {
      surfaceM2: 5000,
      heightM: 12,
      model: "OTHER",
    });

    expect(merged.sim_surface_m2).toBe(900);
    expect(merged.sim_height_m).toBe(7);
    expect(merged.sim_model).toBe("X1");
  });
});
