import { describe, expect, it } from "vitest";

import { validateLeadForStudyPdf } from "./validation";

describe("validateLeadForStudyPdf", () => {
  it("returns issues when required simulation inputs are missing", () => {
    const lead = {
      company_name: "",
      sim_surface_m2: null,
      surface_m2: null,
      sim_height_m: null,
      ceiling_height_m: null,
      sim_heating_mode: null,
      heating_type: null,
      sim_model: null,
      sim_client_type: null,
    } as any;

    const issues = validateLeadForStudyPdf(lead);
    expect(issues.map((i) => i.code)).toEqual([
      "missing_company",
      "missing_surface",
      "missing_height",
      "missing_heating_mode",
      "missing_model",
      "missing_client_type",
    ]);
  });
});
