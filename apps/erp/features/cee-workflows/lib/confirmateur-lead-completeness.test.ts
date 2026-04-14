import { describe, expect, it } from "vitest";

import { getConfirmateurHandoffLeadGaps, isLeadCompleteForConfirmateurHandoff } from "@/features/cee-workflows/lib/confirmateur-lead-completeness";
import type { LeadRow } from "@/features/leads/types";

function baseLead(over: Partial<LeadRow> = {}): LeadRow {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    company_name: "Acme",
    first_name: "Jean",
    last_name: "Dupont",
    contact_name: "Jean Dupont",
    email: "j@example.com",
    phone: "0600000000",
    contact_role: "Dir",
    job_title: null,
    head_office_address: "1 rue A",
    head_office_siret: "123",
    siret: null,
    head_office_postal_code: "75001",
    head_office_city: "Paris",
    worksite_address: "1 rue A",
    worksite_siret: "123",
    worksite_postal_code: "75001",
    worksite_city: "Paris",
    aerial_photos: ["https://x/a.jpg"],
    cadastral_parcel_files: ["https://x/c.pdf"],
    study_media_files: ["https://x/s.jpg"],
    recording_files: ["https://x/r.mp3"],
    ...over,
  } as LeadRow;
}

describe("confirmateur lead completeness", () => {
  it("accepts a fully filled lead", () => {
    expect(isLeadCompleteForConfirmateurHandoff(baseLead())).toBe(true);
    expect(getConfirmateurHandoffLeadGaps(baseLead()).length).toBe(0);
  });

  it("rejects when aerial photos missing", () => {
    const lead = baseLead({ aerial_photos: [] });
    expect(isLeadCompleteForConfirmateurHandoff(lead)).toBe(false);
    expect(getConfirmateurHandoffLeadGaps(lead).some((g) => g.includes("Photos aériennes"))).toBe(true);
  });

  it("accepts identity from contact_name only", () => {
    const lead = baseLead({ first_name: null, last_name: null, contact_name: "Jean Dupont" });
    expect(getConfirmateurHandoffLeadGaps(lead).some((g) => g.includes("prénom"))).toBe(false);
  });

  it("accepts fonction from job_title", () => {
    const lead = baseLead({ contact_role: null, job_title: "DG" });
    expect(getConfirmateurHandoffLeadGaps(lead).some((g) => g.includes("fonction"))).toBe(false);
  });
});
