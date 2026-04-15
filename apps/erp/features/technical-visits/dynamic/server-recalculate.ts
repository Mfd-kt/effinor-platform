import type { VisitTemplateSchema } from "../templates/schema-types";
import { evaluateFormula } from "./formulas";
import type { DynamicAnswers } from "./visibility";

/**
 * Server-side recalculation of all `calculated` fields.
 * Guarantees persisted values are derived from the schema + raw answers,
 * not from potentially tampered client values.
 */
export function serverRecalculateAnswers(
  schema: VisitTemplateSchema,
  rawAnswers: DynamicAnswers,
): DynamicAnswers {
  const answers = { ...rawAnswers };
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.type !== "calculated" || !field.formula) continue;
      answers[field.id] = evaluateFormula(field.formula, answers);
    }
  }
  return answers;
}
