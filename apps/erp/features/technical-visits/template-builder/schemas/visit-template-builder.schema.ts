import { z } from "zod";

import type { VisitTemplateSchema } from "@/features/technical-visits/templates/schema-types";

const visitFieldOptionSchema = z.object({
  value: z.string().min(1, "Valeur d’option requise."),
  label: z.string().min(1, "Libellé d’option requis."),
});

/** Aligné sur `VisitFieldType` : inclut `calculated` pour miroir registry (ex. BAT-TH-142 en base). */
const builderFieldTypes = z.enum([
  "text",
  "textarea",
  "number",
  "select",
  "radio",
  "boolean",
  "photo",
  "calculated",
]);

const visitFieldVisibilityRuleSchema = z.object({
  field: z.string().min(1),
  values: z.array(z.union([z.string(), z.boolean()])),
});

const visitFieldBuilderSchema = z
  .object({
    id: z.string().min(1, "Identifiant de champ requis."),
    type: builderFieldTypes,
    label: z.string().min(1, "Libellé requis."),
    required: z.boolean(),
    order: z.number().int(),
    hint: z.string().optional(),
    options: z.array(visitFieldOptionSchema).optional(),
    min_files: z.number().int().min(0).optional(),
    max_files: z.number().int().min(0).optional(),
    formula: z.string().optional(),
    readonly: z.boolean().optional(),
    editable: z.boolean().optional(),
    unit: z.string().optional(),
    mapToLegacyColumn: z.string().optional(),
    visibility_rules: z.array(visitFieldVisibilityRuleSchema).optional(),
  })
  .superRefine((field, ctx) => {
    if (field.type === "calculated") {
      const f = field.formula?.trim() ?? "";
      if (!f) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Un champ calculé doit avoir une formule.",
          path: ["formula"],
        });
      }
      return;
    }
    if (field.type === "select" || field.type === "radio") {
      if (!field.options?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Au moins une option est requise pour select / radio.",
          path: ["options"],
        });
      }
    }
    if (field.type === "photo") {
      const min = field.min_files ?? 0;
      const max = field.max_files;
      if (max != null && max < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "max_files doit être ≥ min_files.",
          path: ["max_files"],
        });
      }
    }
  });

const visitSectionBuilderSchema = z.object({
  id: z.string().min(1, "Identifiant de section requis."),
  title: z.string().min(1, "Titre de section requis."),
  order: z.number().int(),
  fields: z.array(visitFieldBuilderSchema),
});

/** Schéma stocké en brouillon ou publié (builder V1). */
export const visitTemplateBuilderSchema = z.object({
  version: z.number().int().positive(),
  template_key: z.string().min(1),
  label: z.string().min(1),
  sections: z.array(visitSectionBuilderSchema),
});

export type VisitTemplateBuilderPayload = z.infer<typeof visitTemplateBuilderSchema>;

export function parseVisitTemplateBuilderJson(raw: unknown): VisitTemplateBuilderPayload {
  return visitTemplateBuilderSchema.parse(raw);
}

export function safeParseVisitTemplateForRuntime(raw: unknown): VisitTemplateSchema | null {
  const r = visitTemplateBuilderSchema.safeParse(raw);
  if (!r.success) {
    console.warn("[visit-template-builder] schema_json invalide", r.error.flatten());
    return null;
  }
  return r.data as VisitTemplateSchema;
}

const nonEmptyTrim = (s: string) => s.trim().length > 0;

/** Règles métier publication (en plus du Zod structurel). */
export function validatePublishableTemplateSchema(data: VisitTemplateBuilderPayload): string | null {
  if (data.sections.length === 0) {
    return "Au moins une section est requise pour publier.";
  }

  const sectionIds = new Set<string>();
  for (const sec of data.sections) {
    if (sectionIds.has(sec.id)) return `Identifiant de section dupliqué : ${sec.id}.`;
    sectionIds.add(sec.id);
    if (!nonEmptyTrim(sec.title)) return "Chaque section doit avoir un titre non vide.";
  }

  const fieldIds = new Set<string>();
  let fieldCount = 0;
  for (const sec of data.sections) {
    for (const f of sec.fields) {
      fieldCount += 1;
      if (fieldIds.has(f.id)) return `Clé de champ dupliquée dans le formulaire : ${f.id}.`;
      fieldIds.add(f.id);
    }
  }
  if (fieldCount === 0) {
    return "Ajoutez au moins un champ avant de publier.";
  }

  for (const sec of data.sections) {
    for (const f of sec.fields) {
      if (f.type === "calculated") {
        if (!(f.formula?.trim())) {
          return `Le champ calculé « ${f.label} » doit avoir une formule.`;
        }
        continue;
      }
      if (f.type === "select" || f.type === "radio") {
        if (!f.options?.length) return `Le champ « ${f.label} » nécessite des options.`;
        for (const o of f.options) {
          if (!nonEmptyTrim(o.value) || !nonEmptyTrim(o.label)) {
            return `Options invalides pour le champ « ${f.label} ».`;
          }
        }
      }
      if (f.type === "photo") {
        const min = f.min_files ?? 0;
        const max = f.max_files;
        if (max != null && max < min) {
          return `Photo « ${f.label} » : max_files doit être ≥ min_files.`;
        }
      }
    }
  }

  if (data.template_key.trim() !== data.template_key) {
    return "La clé technique ne doit pas commencer/finir par des espaces.";
  }

  return null;
}

/** Clé technique : lettres, chiffres, points, tirets, underscore ; commence par alphanum. */
export const templateKeyTechnicalSchema = z
  .string()
  .min(2, "Clé trop courte.")
  .max(120, "Clé trop longue.")
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    "Utilisez uniquement lettres, chiffres, « . », « - », « _ » ; le premier caractère doit être alphanumérique.",
  )
  .transform((s) => s.trim());

export const createTechnicalVisitTemplateMasterSchema = z.object({
  template_key: templateKeyTechnicalSchema,
  label: z.string().min(1, "Nom obligatoire.").max(200),
  description: z.string().max(2000).optional().nullable(),
  cee_sheet_id: z.string().uuid().optional().nullable(),
});

export const updateTechnicalVisitTemplateMasterSchema = z.object({
  templateId: z.string().uuid(),
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional().nullable(),
  cee_sheet_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const updateTechnicalVisitTemplateVersionSchemaInput = z.object({
  versionId: z.string().uuid(),
  schema_json: z.unknown(),
});

export const publishTechnicalVisitTemplateVersionSchema = z.object({
  versionId: z.string().uuid(),
});

export const archiveTechnicalVisitTemplateVersionSchema = z.object({
  versionId: z.string().uuid(),
});
