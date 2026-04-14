import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getLeads } from "@/features/leads/queries/get-leads";
import { TechnicalVisitsFilters } from "@/features/technical-visits/components/technical-visits-filters";
import { TechnicalVisitsMapEntry } from "@/features/technical-visits/components/technical-visits-map-entry";
import { TechnicalVisitsTable } from "@/features/technical-visits/components/technical-visits-table";
import { TechnicalVisitsViewToggle } from "@/features/technical-visits/components/technical-visits-view-toggle";
import { buildTechnicalVisitsListUrl } from "@/features/technical-visits/lib/build-technical-visits-list-url";
import { getTechnicalVisits } from "@/features/technical-visits/queries/get-technical-visits";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessTechnicalVisitsModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { TechnicalVisitStatus } from "@/types/database.types";
import { TECHNICAL_VISIT_STATUS_VALUES } from "@/features/technical-visits/schemas/technical-visit.schema";
import { ClipboardCheck } from "lucide-react";
import { notFound } from "next/navigation";

const VALID_STATUSES: TechnicalVisitStatus[] = [...TECHNICAL_VISIT_STATUS_VALUES];

function isTechnicalVisitStatus(v: string): v is TechnicalVisitStatus {
  return VALID_STATUSES.includes(v as TechnicalVisitStatus);
}

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    lead_id?: string;
    view?: string;
  }>;
};

export default async function TechnicalVisitsPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessTechnicalVisitsModule(access)) {
    notFound();
  }
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rawStatus = typeof sp.status === "string" ? sp.status : "all";
  const rawLead = typeof sp.lead_id === "string" ? sp.lead_id : "all";

  const statusFilter: TechnicalVisitStatus | undefined =
    rawStatus !== "all" && isTechnicalVisitStatus(rawStatus) ? rawStatus : undefined;

  const leadFilter = rawLead !== "all" && rawLead.trim() !== "" ? rawLead.trim() : undefined;

  const viewRaw = typeof sp.view === "string" ? sp.view : "";
  const viewMode: "list" | "map" = viewRaw === "map" ? "map" : "list";

  const urlBase = {
    q: q || undefined,
    status: rawStatus,
    lead_id: rawLead,
  };
  const hrefListView = buildTechnicalVisitsListUrl({ ...urlBase, view: "list" });
  const hrefMapView = buildTechnicalVisitsListUrl({ ...urlBase, view: "map" });

  let visits;
  try {
    visits = await getTechnicalVisits(
      {
        q: q || undefined,
        status: statusFilter,
        lead_id: leadFilter,
      },
      access.kind === "authenticated" ? access : undefined,
    );
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur lors du chargement des visites techniques.";
    return (
      <div>
        <PageHeader
          title="Visites techniques"
          description="Passage terrain, rapport et pièces associés au lead."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  const leadsForFilter = (
    await getLeads(access.kind === "authenticated" ? access : undefined)
  ).map((l) => ({
    id: l.id,
    company_name: l.company_name,
  }));

  const hasFilters = Boolean(q.trim()) || rawStatus !== "all" || rawLead !== "all";

  return (
    <div>
      <PageHeader
        title="Visites techniques"
        description="Passage terrain, rapport et pièces associés au lead."
        actions={
          <>
            <TechnicalVisitsViewToggle
              hrefList={hrefListView}
              hrefMap={hrefMapView}
              current={viewMode}
            />
            <Link href="/technical-visits/new" className={cn(buttonVariants())}>
              Nouvelle visite technique
            </Link>
          </>
        }
      />

      <TechnicalVisitsFilters
        defaultQ={q}
        defaultStatus={rawStatus}
        defaultLeadId={rawLead}
        defaultView={viewMode}
        leads={leadsForFilter}
      />

      {visits.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun résultat" : "Aucune visite technique"}
          description={
            hasFilters
              ? "Modifiez les filtres ou créez une nouvelle visite."
              : "Créez une visite liée à un lead pour centraliser le compte-rendu terrain."
          }
          icon={<ClipboardCheck className="size-10 opacity-50" />}
          action={
            <Link href="/technical-visits/new" className={cn(buttonVariants())}>
              Nouvelle visite technique
            </Link>
          }
        />
      ) : viewMode === "map" ? (
        <TechnicalVisitsMapEntry visits={visits} />
      ) : (
        <TechnicalVisitsTable data={visits} />
      )}
    </div>
  );
}
