import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { OperationSitesFilters } from "@/features/operation-sites/components/operation-sites-filters";
import { OperationSitesTable } from "@/features/operation-sites/components/operation-sites-table";
import { getOperationSiteFormOptions } from "@/features/operation-sites/queries/get-operation-site-form-options";
import { getOperationSites } from "@/features/operation-sites/queries/get-operation-sites";
import { SITE_KIND_VALUES } from "@/features/operation-sites/schemas/operation-site.schema";
import { getAccessContext } from "@/lib/auth/access-context";
import { canAccessOperationSitesModule } from "@/lib/auth/module-access";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import type { SiteKind } from "@/types/database.types";
import { MapPin } from "lucide-react";

const VALID_SITE_KINDS: SiteKind[] = [...SITE_KIND_VALUES];

function isSiteKind(v: string): v is SiteKind {
  return VALID_SITE_KINDS.includes(v as SiteKind);
}

type PageProps = {
  searchParams: Promise<{
    q?: string;
    operation_id?: string;
    site_kind?: string;
    building_type?: string;
    is_primary?: string;
  }>;
};

export default async function OperationSitesPage({ searchParams }: PageProps) {
  const access = await getAccessContext();
  if (access.kind !== "authenticated" || !canAccessOperationSitesModule(access)) {
    notFound();
  }
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const rawOperation = typeof sp.operation_id === "string" ? sp.operation_id : "all";
  const rawKind = typeof sp.site_kind === "string" ? sp.site_kind : "all";
  const rawBuilding = typeof sp.building_type === "string" ? sp.building_type : "";
  const rawPrimary = typeof sp.is_primary === "string" ? sp.is_primary : "all";

  const operationFilter =
    rawOperation !== "all" && rawOperation.trim() !== "" ? rawOperation.trim() : undefined;

  const siteKindFilter: SiteKind | undefined =
    rawKind !== "all" && isSiteKind(rawKind) ? rawKind : undefined;

  const buildingFilter = rawBuilding.trim() || undefined;

  let isPrimaryFilter: boolean | undefined;
  if (rawPrimary === "true") isPrimaryFilter = true;
  else if (rawPrimary === "false") isPrimaryFilter = false;

  let sites;
  try {
    sites = await getOperationSites({
      q: q || undefined,
      operation_id: operationFilter,
      site_kind: siteKindFilter,
      building_type: buildingFilter,
      is_primary: isPrimaryFilter,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Erreur lors du chargement des sites techniques.";
    return (
      <div>
        <PageHeader
          title="Sites techniques"
          description="Réalité terrain par opération : surfaces, volumes, chauffage et typologie."
        />
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {message}
        </p>
      </div>
    );
  }

  const { operations: operationsForFilter } = await getOperationSiteFormOptions();

  const hasFilters =
    Boolean(q.trim()) ||
    rawOperation !== "all" ||
    rawKind !== "all" ||
    Boolean(rawBuilding.trim()) ||
    rawPrimary !== "all";

  return (
    <div>
      <PageHeader
        title="Sites techniques"
        description="Entrepôts, bureaux, serres, zones industrielles — base pour études, devis et documents."
        actions={
          <Link href="/operation-sites/new" className={cn(buttonVariants())}>
            Nouveau site technique
          </Link>
        }
      />

      <OperationSitesFilters
        defaultQ={q}
        defaultOperationId={rawOperation}
        defaultSiteKind={rawKind}
        defaultBuildingType={rawBuilding}
        defaultPrimary={rawPrimary}
        operations={operationsForFilter}
      />

      {sites.length === 0 ? (
        <EmptyState
          title={hasFilters ? "Aucun résultat" : "Aucun site technique"}
          description={
            hasFilters
              ? "Modifiez les filtres ou créez un nouveau site."
              : "Créez un site rattaché à une opération pour structurer le terrain."
          }
          icon={<MapPin className="size-10 opacity-50" />}
          action={
            <Link href="/operation-sites/new" className={cn(buttonVariants())}>
              Nouveau site technique
            </Link>
          }
        />
      ) : (
        <OperationSitesTable data={sites} />
      )}
    </div>
  );
}
