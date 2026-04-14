import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button-variants";
import { DOCUMENT_TYPE_LABELS } from "@/features/documents/constants";
import type { TechnicalStudyDetailRow } from "@/features/technical-studies/types";
import type { DocumentType } from "@/types/database.types";
import { cn } from "@/lib/utils";

type TechnicalStudyRelationsSectionProps = {
  study: TechnicalStudyDetailRow;
};

export function TechnicalStudyRelationsSection({ study }: TechnicalStudyRelationsSectionProps) {
  const doc = study.primary_document;

  const docLabel = doc
    ? `${doc.document_type in DOCUMENT_TYPE_LABELS ? DOCUMENT_TYPE_LABELS[doc.document_type as DocumentType] : doc.document_type}${doc.document_number ? ` · ${doc.document_number}` : ""}`
    : null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Référentiel</CardTitle>
        <CardDescription>Document principal rattaché à cette étude.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {doc ? (
          <Link
            href={`/documents/${doc.id}`}
            className={cn(buttonVariants({ variant: "outline" }), "justify-start")}
          >
            Document : {docLabel}
          </Link>
        ) : (
          <span className="text-muted-foreground text-sm">Aucun document principal lié.</span>
        )}
      </CardContent>
    </Card>
  );
}
