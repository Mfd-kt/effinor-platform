import { describe, expect, it } from "vitest";

import { buildLeadStudyPdfViewModel } from "./build-study-view-model";

describe("buildLeadStudyPdfViewModel", () => {
  it("maps lead, simulation and media data into a normalized view-model", () => {
    const lead = {
      id: "lead-1",
      company_name: "Acme Industrie",
      contact_name: "Marie Dupont",
      first_name: null,
      last_name: null,
      contact_role: "Directrice technique",
      job_title: null,
      phone: "0600000000",
      email: "marie@acme.fr",
      department: "91",
      building_type: "INDUSTRIE",
      worksite_city: "Massy",
      head_office_city: "Massy",
      worksite_address: "1 rue du Test",
      worksite_postal_code: "91300",
      head_office_address: "",
      head_office_postal_code: "",
      sim_surface_m2: 2500,
      surface_m2: null,
      sim_height_m: 8,
      ceiling_height_m: null,
      sim_volume_m3: 20000,
      sim_heating_mode: "gaz",
      heating_type: ["chaudiere_eau"],
      sim_client_type: "Site industriel / logistique",
      sim_model: "generfeu",
      sim_needed_destrat: 6,
      sim_model_capacity_m3h: 10000,
      sim_power_kw: 280,
      sim_air_change_rate: 2.5,
      sim_consumption_kwh_year: 550000,
      sim_cost_year_selected: 72000,
      sim_saving_kwh_30: 165000,
      sim_saving_eur_30_selected: 21600,
      sim_co2_saved_tons: 33,
      sim_cee_prime_estimated: 18000,
      sim_install_total_price: 25000,
      sim_rest_to_charge: 7000,
      sim_lead_score: 75,
      qualification_status: "pending",
      ai_lead_summary: "Projet techniquement pertinent.",
      aerial_photos: ["https://example.com/aerial.jpg"],
      cadastral_parcel_files: ["https://example.com/cadastral.jpg"],
      study_media_files: ["https://example.com/study-1.jpg"],
    } as any;

    const vm = buildLeadStudyPdfViewModel({
      lead,
      qualificationNotes: ["Note 1", "Note 2"],
      generatedByLabel: "Jean Expert",
    });

    expect(vm.client.companyName).toBe("Acme Industrie");
    expect(vm.site.surfaceM2).toBe(2500);
    expect(vm.simulation.model).toBe("generfeu");
    expect(vm.media.aerialPhotoUrl).toBe("https://example.com/aerial.jpg");
    expect(vm.comparables.length).toBeGreaterThan(0);
    expect(vm.products.length).toBeGreaterThan(0);
    expect(vm.products[0].id).toBe("generfeu");
    expect(vm.presentationTemplateKey).toBe("destrat_v1");
    expect(vm.agreementTemplateKey).toBe("destrat_v1");
    expect(vm.simulationVersusSheetMismatch).toBe(false);
  });

  it("uses CEE sheet simulator_key pac for template keys before raw simulation", () => {
    const lead = {
      id: "lead-pac",
      company_name: "Acme",
      contact_name: "Test",
      first_name: null,
      last_name: null,
      contact_role: "DG",
      job_title: null,
      phone: "06",
      email: "a@b.fr",
      department: "75",
      building_type: "BUREAUX",
      worksite_city: "Paris",
      head_office_city: "Paris",
      worksite_address: "1 r",
      worksite_postal_code: "75001",
      head_office_address: "",
      head_office_postal_code: "",
      sim_surface_m2: 500,
      surface_m2: null,
      sim_height_m: 3,
      ceiling_height_m: null,
      sim_volume_m3: 1500,
      sim_heating_mode: "gaz",
      heating_type: ["chaudiere_eau"],
      sim_client_type: "Bureaux",
      sim_model: "generfeu",
      sim_needed_destrat: 2,
      sim_model_capacity_m3h: 1000,
      sim_power_kw: 10,
      sim_air_change_rate: 1,
      sim_consumption_kwh_year: 10000,
      sim_cost_year_selected: 2000,
      sim_saving_kwh_30: 1000,
      sim_saving_eur_30_selected: 500,
      sim_co2_saved_tons: 1,
      sim_cee_prime_estimated: 200,
      sim_install_total_price: 2000,
      sim_rest_to_charge: 500,
      sim_lead_score: 50,
      qualification_status: "pending",
      ai_lead_summary: null,
      aerial_photos: [],
      cadastral_parcel_files: [],
      study_media_files: [],
      sim_payload_json: {
        ceeSolution: { solution: "DESTRAT" },
      },
    } as any;

    const vm = buildLeadStudyPdfViewModel({
      lead,
      qualificationNotes: [],
      generatedByLabel: "Expert",
      ceeSheetForStudy: {
        id: "sheet-1",
        simulatorKey: "pac",
        presentationTemplateKey: null,
        agreementTemplateKey: null,
      },
    });

    expect(vm.ceeSolutionKind).toBe("pac");
    expect(vm.presentationTemplateKey).toBe("pac_v1");
    expect(vm.simulationVersusSheetMismatch).toBe(true);
    expect(vm.site.heightM).toBe(0);
    expect(vm.site.volumeM3).toBe(0);
    expect(vm.products).toHaveLength(1);
    expect(vm.products[0].displayName).toBe("Pompe à chaleur air / eau (étude CEE)");
    expect(vm.products[0].rationaleText).toContain("catalogue Effinor");
    expect(vm.simulation.model).toBe("Pompe à chaleur air / eau (étude CEE)");
  });

  it("PAC : utilise pacStudyProducts passés en entrée (catalogue ERP)", () => {
    const lead = {
      id: "lead-pac-2",
      company_name: "Acme",
      contact_name: "Test",
      first_name: null,
      last_name: null,
      contact_role: "DG",
      job_title: null,
      phone: "06",
      email: "a@b.fr",
      department: "75",
      building_type: "BUREAUX",
      worksite_city: "Paris",
      head_office_city: "Paris",
      worksite_address: "1 r",
      worksite_postal_code: "75001",
      head_office_address: "",
      head_office_postal_code: "",
      sim_surface_m2: 500,
      surface_m2: null,
      sim_height_m: 3,
      ceiling_height_m: null,
      sim_volume_m3: 1500,
      sim_heating_mode: "gaz",
      heating_type: ["chaudiere_eau"],
      sim_client_type: "Bureaux",
      sim_model: "generfeu",
      sim_needed_destrat: 2,
      sim_model_capacity_m3h: 1000,
      sim_power_kw: 10,
      sim_air_change_rate: 1,
      sim_consumption_kwh_year: 10000,
      sim_cost_year_selected: 2000,
      sim_saving_kwh_30: 1000,
      sim_saving_eur_30_selected: 500,
      sim_co2_saved_tons: 1,
      sim_cee_prime_estimated: 200,
      sim_install_total_price: 2000,
      sim_rest_to_charge: 500,
      sim_lead_score: 50,
      qualification_status: "pending",
      ai_lead_summary: null,
      aerial_photos: [],
      cadastral_parcel_files: [],
      study_media_files: [],
      sim_payload_json: { ceeSolution: { solution: "DESTRAT" } },
    } as any;

    const vm = buildLeadStudyPdfViewModel({
      lead,
      qualificationNotes: [],
      generatedByLabel: "Expert",
      ceeSheetForStudy: {
        id: "sheet-pac",
        simulatorKey: "pac",
        presentationTemplateKey: null,
        agreementTemplateKey: null,
      },
      pacStudyProducts: [
        {
          id: "ma_pac_catalogue",
          displayName: "PAC Atlantic Alféa Extensa Duo",
          description: "Description catalogue.",
          imageUrlResolved: null,
          galleryUrls: [],
          specsForDisplay: [{ label: "Type", value: "Air / eau" }],
          keyMetricsForDisplay: [],
          rationaleText: "Rationale test.",
        },
      ],
    });

    expect(vm.products[0].displayName).toBe("PAC Atlantic Alféa Extensa Duo");
    expect(vm.products[0].id).toBe("ma_pac_catalogue");
    expect(vm.simulation.model).toBe("PAC Atlantic Alféa Extensa Duo");
  });
});
