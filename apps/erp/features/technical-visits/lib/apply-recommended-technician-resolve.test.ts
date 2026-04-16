import { describe, expect, test } from "vitest";

import { resolveApplyRecommendedTechnician } from "@/features/technical-visits/lib/apply-recommended-technician-resolve";
import type { ProfileOption, RecommendedTechnician } from "@/features/technical-visits/types";

const eligibleProfile = (id: string): ProfileOption => ({
  id,
  label: id,
  is_eligible: true,
  eligibility_reason: "available",
  ranking_score: 90,
  distance_km: 10,
});

const rec: RecommendedTechnician = {
  technicianId: "11111111-1111-1111-1111-111111111111",
  fullName: "Test Tech",
  score: 90,
  distanceKm: 10,
  availabilityReason: "available",
  recommendationReason: "Meilleur score.",
};

describe("resolveApplyRecommendedTechnician", () => {
  test("create: validated_for_form when empty technician", () => {
    const out = resolveApplyRecommendedTechnician({
      mode: "create",
      availabilityState: "ready",
      recommendedTechnician: rec,
      profiles: [eligibleProfile(rec.technicianId)],
      currentFormTechnicianId: "",
    });
    expect(out.result.ok).toBe(true);
    expect(out.result.status).toBe("validated_for_form");
    expect(out.actionType).toBe("apply_recommended_assignment");
  });

  test("create: rejects when form technician already set", () => {
    const out = resolveApplyRecommendedTechnician({
      mode: "create",
      availabilityState: "ready",
      recommendedTechnician: rec,
      profiles: [eligibleProfile(rec.technicianId)],
      currentFormTechnicianId: "22222222-2222-2222-2222-222222222222",
    });
    expect(out.result.ok).toBe(false);
    expect(out.result.status).toBe("rejected_form_technician_already_set");
  });

  test("create: insufficient context", () => {
    const out = resolveApplyRecommendedTechnician({
      mode: "create",
      availabilityState: "insufficient_context",
      recommendedTechnician: null,
      profiles: [],
    });
    expect(out.result.status).toBe("rejected_invalid_context");
  });

  test("edit: rejects when already recommended", () => {
    const out = resolveApplyRecommendedTechnician({
      mode: "edit",
      availabilityState: "ready",
      recommendedTechnician: rec,
      profiles: [eligibleProfile(rec.technicianId)],
      persistedTechnicianId: rec.technicianId,
    });
    expect(out.result.ok).toBe(false);
    expect(out.result.status).toBe("rejected_already_recommended");
  });

  test("edit: applies when persisted differs", () => {
    const out = resolveApplyRecommendedTechnician({
      mode: "edit",
      availabilityState: "ready",
      recommendedTechnician: rec,
      profiles: [eligibleProfile(rec.technicianId)],
      persistedTechnicianId: "22222222-2222-2222-2222-222222222222",
    });
    expect(out.result.ok).toBe(true);
    expect(out.result.status).toBe("applied");
    expect(out.actionType).toBe("replace_with_recommended_assignment");
  });

  test("stale when UI expected id differs from server recommendation", () => {
    const out = resolveApplyRecommendedTechnician({
      mode: "edit",
      availabilityState: "ready",
      recommendedTechnician: rec,
      profiles: [eligibleProfile(rec.technicianId)],
      persistedTechnicianId: "22222222-2222-2222-2222-222222222222",
      uiDisplayedRecommendedTechnicianId: "33333333-3333-3333-3333-333333333333",
    });
    expect(out.result.ok).toBe(false);
    expect(out.result.status).toBe("rejected_stale");
  });

  test("stale when expected set but recommendation disappeared", () => {
    const out = resolveApplyRecommendedTechnician({
      mode: "edit",
      availabilityState: "ready",
      recommendedTechnician: null,
      profiles: [],
      uiDisplayedRecommendedTechnicianId: rec.technicianId,
    });
    expect(out.result.ok).toBe(false);
    expect(out.result.status).toBe("rejected_stale");
  });

  test("not eligible guard on recommended profile", () => {
    const out = resolveApplyRecommendedTechnician({
      mode: "create",
      availabilityState: "ready",
      recommendedTechnician: rec,
      profiles: [
        {
          id: rec.technicianId,
          label: "X",
          is_eligible: false,
          eligibility_reason: "out_of_home_range",
        },
      ],
    });
    expect(out.result.status).toBe("rejected_not_eligible");
  });
});
