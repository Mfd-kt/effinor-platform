import { describe, expect, test } from "vitest";

import {
  getSameDayAssignedVisitsForTechnician,
  getTechnicianEligibilityForVisit,
  type SameDayAssignedVisit,
} from "@/features/technical-visits/lib/technician-eligibility";

const baseVisit: SameDayAssignedVisit = {
  id: "v1",
  scheduled_at: "2026-05-10T08:00:00.000Z",
  time_slot: "morning",
  worksite_latitude: 48.8566,
  worksite_longitude: 2.3522,
  status: "scheduled",
};

describe("technician eligibility same-day constraints", () => {
  test("1. no same-day visit -> only home radius applies", () => {
    const result = getTechnicianEligibilityForVisit({
      technicianHomeLat: 48.8566,
      technicianHomeLng: 2.3522,
      targetVisitLat: 48.90,
      targetVisitLng: 2.40,
      targetScheduledAt: "2026-05-10T10:00:00.000Z",
      targetTimeSlot: "afternoon",
      sameDayAssignedVisits: [],
    });
    expect(result.isEligible).toBe(true);
    expect(result.reason).toBe("available");
  });

  test("2. same-day visit at ~40km -> eligible", () => {
    const result = getTechnicianEligibilityForVisit({
      technicianHomeLat: 48.8566,
      technicianHomeLng: 2.3522,
      targetVisitLat: 49.20,
      targetVisitLng: 2.30,
      targetScheduledAt: "2026-05-10T13:00:00.000Z",
      targetTimeSlot: "afternoon",
      sameDayAssignedVisits: [baseVisit],
    });
    expect(result.isEligible).toBe(true);
  });

  test("3. same-day visit at ~95km -> eligible", () => {
    const result = getTechnicianEligibilityForVisit({
      technicianHomeLat: 48.8566,
      technicianHomeLng: 2.3522,
      targetVisitLat: 49.70,
      targetVisitLng: 2.25,
      targetScheduledAt: "2026-05-10T13:00:00.000Z",
      targetTimeSlot: "afternoon",
      sameDayAssignedVisits: [baseVisit],
    });
    expect(result.isEligible).toBe(true);
  });

  test("4. same-day visit at >100km -> not eligible", () => {
    const result = getTechnicianEligibilityForVisit({
      technicianHomeLat: 48.8566,
      technicianHomeLng: 2.3522,
      targetVisitLat: 50.20,
      targetVisitLng: 2.20,
      targetScheduledAt: "2026-05-10T13:00:00.000Z",
      targetTimeSlot: "afternoon",
      sameDayAssignedVisits: [baseVisit],
    });
    expect(result.isEligible).toBe(false);
    expect(result.reason).toBe("too_far_from_same_day_visit");
    expect(result.conflictingVisitId).toBe("v1");
    expect((result.conflictingVisitDistanceKm ?? 0) > 100).toBe(true);
  });

  test("5. home distance >200km -> not eligible", () => {
    const result = getTechnicianEligibilityForVisit({
      technicianHomeLat: 43.2965,
      technicianHomeLng: 5.3698, // Marseille
      targetVisitLat: 48.8566,
      targetVisitLng: 2.3522, // Paris
      targetScheduledAt: "2026-05-10T13:00:00.000Z",
      targetTimeSlot: "afternoon",
      sameDayAssignedVisits: [],
    });
    expect(result.isEligible).toBe(false);
    expect(result.reason).toBe("out_of_home_range");
  });

  test("6. unavailable slot conflict -> not eligible", () => {
    const result = getTechnicianEligibilityForVisit({
      technicianHomeLat: 48.8566,
      technicianHomeLng: 2.3522,
      targetVisitLat: 48.90,
      targetVisitLng: 2.40,
      targetScheduledAt: "2026-05-10T13:00:00.000Z",
      targetTimeSlot: "morning",
      sameDayAssignedVisits: [baseVisit],
    });
    expect(result.isEligible).toBe(false);
    expect(result.reason).toBe("blocked_by_unavailability");
    expect(result.conflictingVisitId).toBe("v1");
  });

  test("7. same-day helper excludes edited visit", () => {
    const rows = getSameDayAssignedVisitsForTechnician(
      [
        baseVisit,
        {
          ...baseVisit,
          id: "v2",
          scheduled_at: "2026-05-10T15:00:00.000Z",
          time_slot: "afternoon",
        },
      ],
      "2026-05-10T11:00:00.000Z",
      "v1",
    );
    expect(rows.map((r) => r.id)).toEqual(["v2"]);
  });
});
