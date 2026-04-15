"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { VisitTemplateSection } from "@/features/technical-visits/templates/schema-types";
import type { DynamicAnswers } from "./visibility";
import { isFieldVisible } from "./visibility";
import { DynamicVisitField } from "./dynamic-visit-field";

type DynamicVisitSectionProps = {
  section: VisitTemplateSection;
  answers: DynamicAnswers;
  onChange: (fieldId: string, value: unknown) => void;
  technicalVisitId?: string;
};

export function DynamicVisitSection({
  section,
  answers,
  onChange,
  technicalVisitId,
}: DynamicVisitSectionProps) {
  const sorted = [...section.fields].sort((a, b) => a.order - b.order);
  const visibleFields = sorted.filter((f) => isFieldVisible(f, answers));

  if (visibleFields.length === 0) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold tracking-tight md:text-base">{section.title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 md:gap-5">
        {visibleFields.map((field) => {
          const spanFull =
            field.type === "textarea" ||
            field.type === "photo" ||
            field.type === "boolean";
          return (
            <div key={field.id} className={spanFull ? "md:col-span-2" : undefined}>
              <DynamicVisitField
                field={field}
                value={answers[field.id]}
                onChange={(v) => onChange(field.id, v)}
                technicalVisitId={technicalVisitId}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
