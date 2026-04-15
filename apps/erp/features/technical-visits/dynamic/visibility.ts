import type { VisitField, VisitFieldVisibilityRule } from "../templates/schema-types";

export type DynamicAnswers = Record<string, unknown>;

function matchesRule(rule: VisitFieldVisibilityRule, answers: DynamicAnswers): boolean {
  const current = answers[rule.field];
  return rule.values.some((expected) => {
    if (typeof expected === "boolean") return current === expected;
    return String(current ?? "") === String(expected);
  });
}

/**
 * Evaluate whether a field should be visible given the current answers.
 * All visibility rules must match (AND logic).
 * A field with no rules is always visible.
 */
export function isFieldVisible(field: VisitField, answers: DynamicAnswers): boolean {
  if (!field.visibility_rules?.length) return true;
  return field.visibility_rules.every((rule) => matchesRule(rule, answers));
}
