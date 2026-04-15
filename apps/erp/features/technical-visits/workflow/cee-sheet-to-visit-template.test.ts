import { describe, expect, it, vi } from "vitest";

import { resolveVisitTemplateForCeeSheet } from "./cee-sheet-to-visit-template";

describe("resolveVisitTemplateForCeeSheet", () => {
  it("priorise technical_visit_template_key + version depuis la fiche CEE", () => {
    const r = resolveVisitTemplateForCeeSheet({
      code: "PAC",
      label: "PAC",
      simulator_key: "pac",
      technical_visit_template_key: "BAT-TH-142",
      technical_visit_template_version: 1,
    });
    expect(r?.templateKey).toBe("BAT-TH-142");
    expect(r?.version).toBe(1);
    expect(r?.visitSchemaSnapshotJson).toBeTruthy();
  });

  it("ne fait pas de fallback legacy si la version configurée est absente du registry", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const r = resolveVisitTemplateForCeeSheet({
      code: "DESTRAT",
      label: "x",
      simulator_key: "destrat",
      technical_visit_template_key: "BAT-TH-142",
      technical_visit_template_version: 999,
    });
    expect(r).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("fallback legacy lorsque les colonnes template sont NULL", () => {
    const r = resolveVisitTemplateForCeeSheet({
      code: "DESTRAT",
      label: "x",
      simulator_key: null,
      technical_visit_template_key: null,
      technical_visit_template_version: null,
    });
    expect(r?.templateKey).toBe("BAT-TH-142");
    expect(r?.version).toBe(1);
  });
});
