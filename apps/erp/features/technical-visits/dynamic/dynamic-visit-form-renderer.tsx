"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { mergeBatTh142DestratRecommendation } from "@/features/technical-visits/lib/bat-th-142-destrat-recommendation";
import type { VisitTemplateSchema } from "@/features/technical-visits/templates/schema-types";
import { DynamicVisitSection } from "./dynamic-visit-section";
import { evaluateFormula } from "./formulas";
import type { DynamicAnswers } from "./visibility";

type DynamicVisitFormRendererProps = {
  schema: VisitTemplateSchema;
  initialAnswers: DynamicAnswers;
  technicalVisitId?: string;
  /**
   * Called whenever the answers change (debounced by the parent if needed).
   * The parent is responsible for persisting.
   */
  onAnswersChange: (answers: DynamicAnswers) => void;
};

function recomputeCalculated(
  schema: VisitTemplateSchema,
  answers: DynamicAnswers,
): DynamicAnswers {
  const next = { ...answers };
  for (const section of schema.sections) {
    for (const field of section.fields) {
      if (field.type !== "calculated" || !field.formula) continue;
      const result = evaluateFormula(field.formula, next);
      next[field.id] = result;
    }
  }
  return next;
}

function recomputeDerived(schema: VisitTemplateSchema, answers: DynamicAnswers): DynamicAnswers {
  const withCalc = recomputeCalculated(schema, answers);
  return mergeBatTh142DestratRecommendation(schema, withCalc);
}

export function DynamicVisitFormRenderer({
  schema,
  initialAnswers,
  technicalVisitId,
  onAnswersChange,
}: DynamicVisitFormRendererProps) {
  const [answers, setAnswers] = useState<DynamicAnswers>(() =>
    recomputeDerived(schema, initialAnswers),
  );

  const onChangeRef = useRef(onAnswersChange);
  onChangeRef.current = onAnswersChange;

  const handleFieldChange = useCallback(
    (fieldId: string, value: unknown) => {
      setAnswers((prev) => {
        const patched = { ...prev, [fieldId]: value };
        const merged = recomputeDerived(schema, patched);
        onChangeRef.current(merged);
        return merged;
      });
    },
    [schema],
  );

  const sortedSections = useMemo(
    () => [...schema.sections].sort((a, b) => a.order - b.order),
    [schema],
  );

  return (
    <div className="space-y-10 md:space-y-8">
      {sortedSections.map((section) => (
        <DynamicVisitSection
          key={section.id}
          section={section}
          answers={answers}
          onChange={handleFieldChange}
          technicalVisitId={technicalVisitId}
        />
      ))}
    </div>
  );
}
