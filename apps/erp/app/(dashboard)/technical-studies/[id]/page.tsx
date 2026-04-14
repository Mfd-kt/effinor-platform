import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { TechnicalStudyForm } from "@/features/technical-studies/components/technical-study-form";
import { TechnicalStudyRelationsSection } from "@/features/technical-studies/components/technical-study-relations-section";
import { TechnicalStudySummaryCards } from "@/features/technical-studies/components/technical-study-summary-cards";
import { STUDY_TYPE_LABELS } from "@/features/technical-studies/constants";
import { TechnicalStudyStatusBadge } from "@/features/technical-studies/components/technical-study-status-badge";
import { technicalStudyRowToFormValues } from "@/features/technical-studies/lib/form-defaults";
import { getTechnicalStudyById } from "@/features/technical-studies/queries/get-technical-study-by-id";
import { getTechnicalStudyFormOptions } from "@/features/technical-studies/queries/get-technical-study-form-options";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessTechnicalStudiesModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { formatDateFr } from "@/lib/format";
import type { StudyType } from "@/types/database.types";
import { cn } from "@/lib/utils";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TechnicalStudyDetailPage({ params }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessTechnicalStudiesModule(access)) {
    notFound();
  }
  const { id } = await params;
  const [row, options] = await Promise.all([
    getTechnicalStudyById(id),
    getTechnicalStudyFormOptions(),
  ]);

  if (!row) {
    notFound();
  }

  const typeLabel = STUDY_TYPE_LABELS[row.study_type as StudyType];

  return (
    <div>
      <PageHeader
        title={`${row.reference} · ${typeLabel}`}
        description={
          <span className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <span className="font-mono text-xs text-foreground/90">{row.id}</span>
            <span>Màj {formatDateFr(row.updated_at)}</span>
            <TechnicalStudyStatusBadge status={row.status} />
          </span>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/technical-studies" className={cn(buttonVariants({ variant: "outline" }))}>
              Retour à la liste
            </Link>
          </div>
        }
      />

      <TechnicalStudySummaryCards study={row} />

      <TechnicalStudyRelationsSection study={row} />

      <TechnicalStudyForm
        key={row.id}
        mode="edit"
        technicalStudyId={row.id}
        defaultValues={technicalStudyRowToFormValues(row)}
        options={options}
        className="max-w-4xl"
      />
    </div>
  );
}
