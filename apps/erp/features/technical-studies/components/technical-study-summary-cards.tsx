import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOCUMENT_TYPE_LABELS } from "@/features/documents/constants";
import { STUDY_TYPE_LABELS } from "@/features/technical-studies/constants";
import { TechnicalStudyStatusBadge } from "@/features/technical-studies/components/technical-study-status-badge";
import type { TechnicalStudyDetailRow } from "@/features/technical-studies/types";
import { formatDateFr } from "@/lib/format";
import type { DocumentType, StudyType } from "@/types/database.types";

type TechnicalStudySummaryCardsProps = {
  study: TechnicalStudyDetailRow;
};

export function TechnicalStudySummaryCards({ study }: TechnicalStudySummaryCardsProps) {
  const doc = study.primary_document;
  const docTitle = doc
    ? doc.document_type in DOCUMENT_TYPE_LABELS
      ? DOCUMENT_TYPE_LABELS[doc.document_type as DocumentType]
      : doc.document_type
    : "—";

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Référence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-mono text-lg font-semibold text-foreground">{study.reference}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Type & statut</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-foreground">{STUDY_TYPE_LABELS[study.study_type as StudyType]}</p>
          <TechnicalStudyStatusBadge status={study.status} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Document principal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-foreground text-sm">{docTitle}</p>
          {doc?.document_number ? (
            <p className="font-mono text-muted-foreground text-xs">{doc.document_number}</p>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Date & bureau</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Date étude : </span>
            {formatDateFr(study.study_date)}
          </p>
          <p>
            <span className="text-muted-foreground">Bureau : </span>
            {study.engineering_office ?? "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
