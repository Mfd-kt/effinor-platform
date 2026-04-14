import { describe, expect, it } from "vitest";

import {
  assertWorkflowTransition,
  canTransitionWorkflowStatus,
} from "@/features/cee-workflows/domain/transitions";

describe("CEE workflow transitions", () => {
  it("allows the main agent > confirmateur > closer pipeline", () => {
    expect(canTransitionWorkflowStatus("draft", "simulation_done")).toBe(true);
    expect(canTransitionWorkflowStatus("simulation_done", "to_confirm")).toBe(true);
    expect(canTransitionWorkflowStatus("to_confirm", "to_close")).toBe(true);
    expect(canTransitionWorkflowStatus("qualified", "docs_prepared")).toBe(true);
    expect(canTransitionWorkflowStatus("qualified", "to_close")).toBe(true);
    expect(canTransitionWorkflowStatus("docs_prepared", "to_close")).toBe(true);
    expect(canTransitionWorkflowStatus("to_close", "docs_prepared")).toBe(true);
    expect(canTransitionWorkflowStatus("to_close", "agreement_sent")).toBe(true);
    expect(canTransitionWorkflowStatus("agreement_sent", "agreement_signed")).toBe(true);
  });

  it("allows technical visit milestones later in the workflow", () => {
    expect(canTransitionWorkflowStatus("agreement_signed", "technical_visit_pending")).toBe(true);
    expect(canTransitionWorkflowStatus("technical_visit_pending", "technical_visit_done")).toBe(true);
  });

  it("rejects invalid shortcuts", () => {
    expect(() => assertWorkflowTransition("draft", "docs_prepared")).toThrow(
      "Transition invalide: draft -> docs_prepared",
    );
  });
});
