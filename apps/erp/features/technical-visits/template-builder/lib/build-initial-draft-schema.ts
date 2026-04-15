import type { VisitTemplateBuilderPayload } from "@/features/technical-visits/template-builder/schemas/visit-template-builder.schema";

export function buildInitialDraftSchema(templateKey: string, label: string): VisitTemplateBuilderPayload {
  return {
    version: 1,
    template_key: templateKey.trim(),
    label: label.trim(),
    sections: [
      {
        id: `section-${crypto.randomUUID()}`,
        title: "Section 1",
        order: 1,
        fields: [],
      },
    ],
  };
}

export function buildNextDraftSchemaFromPublished(
  templateKey: string,
  label: string,
  nextVersionNumber: number,
  previousSchema: VisitTemplateBuilderPayload,
): VisitTemplateBuilderPayload {
  const cloned = JSON.parse(JSON.stringify(previousSchema)) as VisitTemplateBuilderPayload;
  cloned.version = nextVersionNumber;
  cloned.template_key = templateKey.trim();
  cloned.label = label.trim();
  return cloned;
}
