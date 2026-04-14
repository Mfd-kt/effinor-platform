import { describe, expect, it } from "vitest";

import {
  legacyCeeHeatingKindToCurrentMode,
  mapDestratCurrentHeatingModeToCeeHeatingKind,
} from "./map-current-heating-mode-to-cee";

describe("map-current-heating-mode-to-cee", () => {
  it("mappe les modes détaillés vers CeeHeatingKind", () => {
    expect(mapDestratCurrentHeatingModeToCeeHeatingKind("air_chaud_soufflage")).toBe("convectif");
    expect(mapDestratCurrentHeatingModeToCeeHeatingKind("chaudiere_eau")).toBe("convectif");
    expect(mapDestratCurrentHeatingModeToCeeHeatingKind("pac_air_air")).toBe("convectif");
    expect(mapDestratCurrentHeatingModeToCeeHeatingKind("pac_air_eau")).toBe("convectif");
    expect(mapDestratCurrentHeatingModeToCeeHeatingKind("rayonnement")).toBe("radiatif");
    expect(mapDestratCurrentHeatingModeToCeeHeatingKind("electrique_direct")).toBe("radiatif");
    expect(mapDestratCurrentHeatingModeToCeeHeatingKind("mix_air_rayonnement")).toBe("mixte");
    expect(mapDestratCurrentHeatingModeToCeeHeatingKind("autre_inconnu")).toBe("autre");
  });

  it("migre les 4 anciennes valeurs", () => {
    expect(legacyCeeHeatingKindToCurrentMode("convectif")).toBe("air_chaud_soufflage");
    expect(legacyCeeHeatingKindToCurrentMode("radiatif")).toBe("electrique_direct");
    expect(legacyCeeHeatingKindToCurrentMode("mixte")).toBe("mix_air_rayonnement");
    expect(legacyCeeHeatingKindToCurrentMode("autre")).toBe("autre_inconnu");
  });
});
