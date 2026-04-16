import { describe, expect, test } from "vitest";

import {
  getRecommendedTechnician,
  getSelectedTechnicianRecommendationStatus,
} from "@/features/technical-visits/lib/technician-recommendation";
import type { ProfileOption } from "@/features/technical-visits/types";

const eligible = (id: string, score: number, distance: number, label: string): ProfileOption => ({
  id,
  label,
  is_eligible: true,
  ranking_score: score,
  distance_km: distance,
  eligibility_reason: "available",
});

describe("technician recommendation", () => {
  test("none eligible -> null recommendation", () => {
    const out = getRecommendedTechnician(
      [{ id: "t1", label: "A", is_eligible: false, eligibility_reason: "out_of_home_range" }],
      "ready",
    );
    expect(out).toBeNull();
  });

  test("single eligible -> recommended", () => {
    const out = getRecommendedTechnician([eligible("t1", 80, 40, "Alpha")], "ready");
    expect(out?.technicianId).toBe("t1");
  });

  test("best score wins", () => {
    const out = getRecommendedTechnician([eligible("t1", 70, 20, "A"), eligible("t2", 90, 60, "B")], "ready");
    expect(out?.technicianId).toBe("t2");
  });

  test("tie breaker stable: lower distance then label", () => {
    const out = getRecommendedTechnician(
      [eligible("t1", 90, 30, "Beta"), eligible("t2", 90, 20, "Alpha"), eligible("t3", 90, 20, "Zeta")],
      "ready",
    );
    expect(out?.technicianId).toBe("t2");
  });

  test("insufficient context -> no recommendation", () => {
    const out = getRecommendedTechnician([eligible("t1", 90, 20, "A")], "insufficient_context");
    expect(out).toBeNull();
  });

  test("selected status: recommended / eligible_not_recommended / no_longer_eligible / not_found", () => {
    const profiles: ProfileOption[] = [
      eligible("t1", 95, 10, "A"),
      { id: "t2", label: "B", is_eligible: true, ranking_score: 80, eligibility_reason: "available" },
      { id: "t3", label: "C", is_eligible: false, ranking_score: 0, eligibility_reason: "out_of_home_range" },
    ];
    const rec = getRecommendedTechnician(profiles, "ready");
    expect(
      getSelectedTechnicianRecommendationStatus({
        selectedTechnicianId: "t1",
        profiles,
        recommendedTechnician: rec,
      })?.reason,
    ).toBe("recommended");
    expect(
      getSelectedTechnicianRecommendationStatus({
        selectedTechnicianId: "t2",
        profiles,
        recommendedTechnician: rec,
      })?.reason,
    ).toBe("eligible_not_recommended");
    expect(
      getSelectedTechnicianRecommendationStatus({
        selectedTechnicianId: "t3",
        profiles,
        recommendedTechnician: rec,
      })?.reason,
    ).toBe("no_longer_eligible");
    expect(
      getSelectedTechnicianRecommendationStatus({
        selectedTechnicianId: "tx",
        profiles,
        recommendedTechnician: rec,
      })?.reason,
    ).toBe("not_found");
  });
});
