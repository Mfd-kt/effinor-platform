import { describe, expect, it } from "vitest";

import { BAT_TH_142_V1 } from "@/features/technical-visits/templates/bat-th-142-v1";
import { mergeBatTh142DestratRecommendation } from "./bat-th-142-destrat-recommendation";

describe("mergeBatTh142DestratRecommendation", () => {
  it("remplit modèle et quantité comme le moteur simulateur (tertiaire)", () => {
    const out = mergeBatTh142DestratRecommendation(BAT_TH_142_V1, {
      building_type: "commerce",
      heating_energy: "gaz",
      destrat_avg_height_m: 7,
      destrat_total_surface_m2: 7500,
      destrat_zone_count: 3,
    });
    expect(out.recommended_model).toBe("generfeu");
    expect(out.recommended_qty).toBe(10);
  });

  it("utilise le taux industriel pour hall de production", () => {
    const out = mergeBatTh142DestratRecommendation(BAT_TH_142_V1, {
      building_type: "hall_production",
      heating_energy: "gaz",
      destrat_avg_height_m: 7,
      destrat_total_surface_m2: 7500,
      destrat_zone_count: 3,
    });
    expect(out.recommended_model).toBe("generfeu");
    expect(out.recommended_qty).toBe(15);
  });

  it("efface la préconisation si données incomplètes", () => {
    const out = mergeBatTh142DestratRecommendation(BAT_TH_142_V1, {
      building_type: "commerce",
      destrat_avg_height_m: 7,
      recommended_model: "generfeu",
      recommended_qty: 99,
    });
    expect(out.recommended_model).toBeUndefined();
    expect(out.recommended_qty).toBeUndefined();
  });
});
