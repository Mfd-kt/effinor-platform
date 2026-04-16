import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { getLeads } from "@/features/leads/queries/get-leads";
import { TechnicalVisitsFilters } from "@/features/technical-visits/components/technical-visits-filters";
import { TechnicalVisitsMapEntry } from "@/features/technical-visits/components/technical-visits-map-entry";
import { TechnicalVisitsMobileList } from "@/features/technical-visits/components/technical-visits-mobile-list";
import { TechnicalVisitsTable } from "@/features/technical-visits/components/technical-visits-table";
import { TechnicalVisitsViewToggle } from "@/features/technical-visits/components/technical-visits-view-toggle";
import { TechnicalVisitsBucketBar } from "@/features/technical-visits/components/technical-visits-bucket-bar";
import { buildTechnicalVisitsListUrl } from "@/features/technical-visits/lib/build-technical-visits-list-url";
import {
  countVisitsByBucket,
  filterVisitsByBucket,
  parseTechnicalVisitListBucket,
  sortVisitsForActiveList,
} from "@/features/technical-visits/lib/technical-visit-list-bucket";
import { TechnicalVisitsRealtimeListener } from "@/features/technical-visits/components/technical-visits-realtime-listener";
import { getOpenAlertCountsForVisitIds } from "@/features/technical-visits/queries/get-open-alert-counts-for-visit-ids";
import {
  getTechnicalVisits,
  getTechnicalVisitsRealtimeSubscriptionForList,
} from "@/features/technical-visits/queries/get-technical-visits";
import { canAdminSoftDeleteTechnicalVisit } from "@/features/technical-visits/access";
import { getDistanceContextFromAccess } from "@/features/technical-visits/lib/visit-distance-context";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessTechnicalVisitsDirectoryNav } from "@/lib/auth/module-access";
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
    bucket?: string;
  }>;
};

export default async function TechnicalVisitsPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !(await canAccessTechnicalVisitsDirectoryNav(access))) {
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

  const rawBucket = typeof sp.bucket === "string" ? sp.bucket : undefined;
  const listBucket = parseTechnicalVisitListBucket(rawBucket);

  const urlBase = {
    q: q || undefined,
    status: rawStatus,
    lead_id: rawLead,
    view: viewMode,
    bucket: listBucket,
  };
  const hrefListView = buildTechnicalVisitsListUrl({ ...urlBase, view: "list" });
  const hrefMapView = buildTechnicalVisitsListUrl({ ...urlBase, view: "map" });
  const distanceHeaderLabel = getDistanceContextFromAccess(access) === "technician" ? "Distance" : "Distance siège";

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
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <PageHeader
          title="Visites techniques"
          description="Passage terrain, rapport et pièces associés au lead."
          className="mb-0 border-border/60 pb-6"
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

  const hasFilters =
    Boolean(q.trim()) ||
    rawStatus !== "all" ||
    rawLead !== "all" ||
    (listBucket !== "all" && listBucket !== "active");

  const alertCounts =
    visits.length > 0 ? await getOpenAlertCountsForVisitIds(visits.map((v) => v.id)) : {};
  const bucketCounts = countVisitsByBucket(visits, alertCounts);
  const visitsFiltered = filterVisitsByBucket(visits, listBucket, alertCounts);
  const visitsForView =
    listBucket === "active" ? sortVisitsForActiveList(visitsFiltered, alertCounts) : visitsFiltered;

  const canAdminDeleteVt =
    access.kind === "authenticated" && canAdminSoftDeleteTechnicalVisit(access);

  const visitsListRealtime =
    access.kind === "authenticated"
      ? await getTechnicalVisitsRealtimeSubscriptionForList(access)
      : { enabled: false, filters: [] as string[], debounceMs: 500 };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {visitsListRealtime.enabled ? (
        <TechnicalVisitsRealtimeListener
          filters={visitsListRealtime.filters}
          debounceMs={visitsListRealtime.debounceMs}
        />
      ) : null}
      <PageHeader
        title="Visites techniques"
        description="Passage terrain, rapport et pièces associés au lead."
        className="mb-0 border-border/60 pb-6"
        actions={
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <TechnicalVisitsViewToggle
              hrefList={hrefListView}
              hrefMap={hrefMapView}
              current={viewMode}
            />
            <Link
              href="/technical-visits/new"
              className={cn(buttonVariants(), "h-11 w-full justify-center sm:h-10 sm:w-auto")}
            >
              Nouvelle visite technique
            </Link>
          </div>
        }
      />

      <TechnicalVisitsFilters
        defaultQ={q}
        defaultStatus={rawStatus}
        defaultLeadId={rawLead}
        defaultView={viewMode}
        defaultBucket={listBucket}
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
      ) : (
        <>
          <TechnicalVisitsBucketBar current={listBucket} counts={bucketCounts} urlBase={urlBase} />
          {visitsForView.length === 0 ? (
            <EmptyState
              title="Aucune visite dans cette catégorie"
              description={
                listBucket === "active"
                  ? "Rien à traiter pour l’instant. Les visites validées, annulées ou refusées sont dans les onglets « Validées » ou « Toutes »."
                  : "Choisissez un autre onglet ou élargissez les filtres (statut, lead, recherche)."
              }
              icon={<ClipboardCheck className="size-10 opacity-50" />}
            />
          ) : viewMode === "map" ? (
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]">
              <TechnicalVisitsMapEntry visits={visitsForView} />
            </div>
          ) : (
            <>
              <TechnicalVisitsMobileList visits={visitsForView} canAdminDelete={canAdminDeleteVt} />
              <div className="hidden md:block">
                <TechnicalVisitsTable
                  data={visitsForView}
                  canAdminDelete={canAdminDeleteVt}
                  preserveDataOrder={listBucket === "active"}
                  distanceHeaderLabel={distanceHeaderLabel}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
