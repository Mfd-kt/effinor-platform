import type { VisitTemplateSchema } from "../templates/schema-types";
import type { DynamicAnswers } from "./visibility";

/**
 * Build a patch object for legacy columns from the dynamic answers.
 * Only includes fields with `mapToLegacyColumn` set, mapping
 * form_answers_json values to the corresponding DB column name.
 */
export function buildLegacyPatch(
  schema: VisitTemplateSchema,
  answers: DynamicAnswers,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (!field.mapToLegacyColumn) continue;
      const value = answers[field.id];
      if (value === undefined) continue;

      const col = field.mapToLegacyColumn;

      if (col === "heating_type") {
        patch[col] = typeof value === "string" && value.trim() ? [value] : null;
        continue;
      }

      if (col === "surface_m2" || col === "ceiling_height_m") {
        const n = typeof value === "number" ? value : Number(value);
        patch[col] = Number.isFinite(n) ? n : null;
        continue;
      }

      patch[col] = typeof value === "string" && value.trim() ? value.trim() : null;
    }
  }
  return patch;
}
