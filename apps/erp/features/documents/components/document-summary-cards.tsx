import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOCUMENT_TYPE_LABELS } from "@/features/documents/constants";
import {
  DocumentComplianceIndicator,
  DocumentStatusBadge,
} from "@/features/documents/components/document-status-badge";
import type { DocumentDetailRow } from "@/features/documents/types";
import { formatDateFr, formatEur } from "@/lib/format";

type DocumentSummaryCardsProps = {
  document: DocumentDetailRow;
};

export function DocumentSummaryCards({ document: doc }: DocumentSummaryCardsProps) {
  const refLabel = doc.document_number?.trim() || doc.document_subtype?.trim() || "—";

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Type & statut</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-lg font-semibold text-foreground">{DOCUMENT_TYPE_LABELS[doc.document_type]}</p>
          <DocumentStatusBadge status={doc.document_status} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Référence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-medium text-foreground">{refLabel}</p>
          <p className="text-muted-foreground text-xs">Version {doc.version}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Dates & conformité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">Émis : </span>
            {formatDateFr(doc.issued_at)}
          </p>
          <p>
            <span className="text-muted-foreground">Signé : </span>
            {formatDateFr(doc.signed_at)}
          </p>
          <div className="pt-1">
            <DocumentComplianceIndicator value={doc.is_compliant} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Montants (réf.)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">HT : </span>
            <span className="tabular-nums">{formatEur(doc.amount_ht)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">TTC : </span>
            <span className="tabular-nums">{formatEur(doc.amount_ttc)}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
