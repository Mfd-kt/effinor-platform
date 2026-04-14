import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TechnicalStudiesFilters } from "@/features/technical-studies/components/technical-studies-filters";
import { TechnicalStudiesTable } from "@/features/technical-studies/components/technical-studies-table";
import { getTechnicalStudies } from "@/features/technical-studies/queries/get-technical-studies";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessTechnicalStudiesModule } from "@/lib/auth/module-access";
import {
  STUDY_TYPE_VALUES,
  TECHNICAL_STUDY_STATUS_VALUES,
} from "@/features/technical-studies/schemas/technical-study.schema";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { StudyType, TechnicalStudyStatus } from "@/types/database.types";
import { BookOpen } from "lucide-react";

const VALID_TYPES: StudyType[] = [...STUDY_TYPE_VALUES];
const VALID_STATUSES: TechnicalStudyStatus[] = [...TECHNICAL_STUDY_STATUS_VALUES];

function isStudyType(v: string): v is StudyType {
  return VALID_TYPES.includes(v as StudyType);
}

function isTechnicalStudyStatus(v: string): v is TechnicalStudyStatus {
  return VALID_STATUSES.includes(v as TechnicalStudyStatus);
}

type PageProps = {
  searchParams: Promise<{
    q?: string;
    study_type?: string;
    status?: string;
  }>;
};

export default async function TechnicalStudiesPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessTechnicalStudiesModule(access)) {
    notFound();
  }
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rawType = typeof sp.study_type === "string" ? sp.study_type : "all";
  const rawStatus = typeof sp.status === "string" ? sp.status : "all";

  const typeFilter: StudyType | undefined =
    rawType !== "all" && isStudyType(rawType) ? rawType : undefined;

  const statusFilter: TechnicalStudyStatus | undefined =
    rawStatus !== "all" && isTechnicalStudyStatus(rawStatus) ? rawStatus : undefined;

  let studies;
  try {
    studies = await getTechnicalStudies({
      q: q || undefined,
      study_type: typeFilter,
      status: statusFilter,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur lors du chargement des études techniques.";
    return (
      <div>
        <PageHeader
          title="Études techniques"
          description="NDD, études d’éclairage, analyses — liées au référentiel documentaire."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  const hasFilters = Boolean(q.trim()) || rawType !== "all" || rawStatus !== "all";

  return (
    <div>
      <PageHeader
        title="Études techniques"
        description="Notes de dimensionnement, études et synthèses — rattachées à une pièce du référentiel documents."
        actions={
          <Link href="/technical-studies/new" className={cn(buttonVariants())}>
            Nouvelle étude
          </Link>
        }
      />

      <TechnicalStudiesFilters
        defaultQ={q}
        defaultStudyType={rawType}
        defaultStatus={rawStatus}
      />

      {studies.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun résultat" : "Aucune étude technique"}
          description={
            hasFilters
              ? "Modifiez les filtres ou créez une nouvelle étude."
              : "Créez une étude liée à un document du référentiel."
          }
          icon={<BookOpen className="size-10 opacity-50" />}
          action={
            <Link href="/technical-studies/new" className={cn(buttonVariants())}>
              Nouvelle étude
            </Link>
          }
        />
      ) : (
        <TechnicalStudiesTable data={studies} />
      )}
    </div>
  );
}
