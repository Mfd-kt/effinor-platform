import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { LeadGenerationDuplicateScanPanel } from "@/features/lead-generation/components/lead-generation-duplicate-scan-panel";
import { LeadGenerationFilters } from "@/features/lead-generation/components/lead-generation-filters";
import { LeadGenerationStockListView } from "@/features/lead-generation/components/lead-generation-stock-list-view";
import {
  buildLeadGenerationStockPageUrl,
  type LeadGenerationListSearchState,
} from "@/features/lead-generation/lib/build-lead-generation-list-url";
import {
  getLeadGenerationStock,
  type GetLeadGenerationStockFilters,
} from "@/features/lead-generation/queries/get-lead-generation-stock";
import {
  getLeadGenerationStockSummary,
  type LeadGenerationStockSummary,
} from "@/features/lead-generation/queries/get-lead-generation-stock-summary";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;
const STOCK_FORM_ACTION = "/lead-generation";

function spStr(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export async function LeadGenerationHubStockSection({ searchParams: sp }: Props) {
  const company_search = spStr(sp, "company_search");
  const stock_status = spStr(sp, "stock_status");
  const qualification_status = spStr(sp, "qualification_status");
  const source = spStr(sp, "source");
  const city = spStr(sp, "city");
  const dispatch_queue_status = spStr(sp, "dispatch_queue_status");
  const pageRaw = spStr(sp, "page");
  const filtreRaw = spStr(sp, "filtre");
  const importBatchRaw = spStr(sp, "import_batch");
  const import_batch =
    importBatchRaw && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(importBatchRaw)
      ? importBatchRaw
      : undefined;
  const closing_readiness_status = spStr(sp, "closing_readiness_status");
  const filtre =
    filtreRaw === "pret" ||
    filtreRaw === "enrichir" ||
    filtreRaw === "rejet" ||
    filtreRaw === "premium" ||
    filtreRaw === "contact_gap"
      ? filtreRaw
      : undefined;
  const page = Math.max(1, parseInt(pageRaw ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const filters: LeadGenerationListSearchState = {
    company_search,
    stock_status,
    qualification_status,
    source,
    city,
    page,
    filtre,
    import_batch,
    dispatch_queue_status,
    closing_readiness_status,
  };

  const filterPayload: GetLeadGenerationStockFilters = {
    ...(company_search ? { company_search } : {}),
    ...(stock_status ? { stock_status } : {}),
    ...(qualification_status ? { qualification_status } : {}),
    ...(source ? { source } : {}),
    ...(city ? { city } : {}),
    ...(import_batch ? { import_batch_id: import_batch } : {}),
    ...(closing_readiness_status ? { closing_readiness_status } : {}),
  };
  if (filtre === "pret") {
    filterPayload.dispatch_queue_status = "ready_now";
  } else if (filtre === "enrichir") {
    filterPayload.dispatch_queue_status = "enrich_first";
  } else if (filtre === "rejet") {
    filterPayload.stock_status = "rejected";
  } else if (filtre === "premium") {
    filterPayload.lead_tier = "premium";
  } else if (filtre === "contact_gap") {
    filterPayload.needs_contact_improvement = true;
  }
  if (filtre !== "pret" && filtre !== "enrichir" && dispatch_queue_status) {
    filterPayload.dispatch_queue_status = dispatch_queue_status;
  }

  const filtersForQuery = Object.keys(filterPayload).length > 0 ? filterPayload : undefined;

  const linkBase: LeadGenerationListSearchState = {
    company_search: filters.company_search,
    stock_status: filters.stock_status,
    qualification_status: filters.qualification_status,
    source: filters.source,
    city: filters.city,
    import_batch: filters.import_batch,
    dispatch_queue_status: filters.dispatch_queue_status,
    closing_readiness_status: filters.closing_readiness_status,
  };

  const activeStockChip = filtre === "rejet" ? "rejected" : filterPayload.stock_status;
  const activeDispatchChip =
    filtre === "pret" ? "ready_now" : filtre === "enrichir" ? "enrich_first" : filterPayload.dispatch_queue_status;

  let rows: Awaited<ReturnType<typeof getLeadGenerationStock>>;
  let summary: LeadGenerationStockSummary;
  try {
    ;[rows, summary] = await Promise.all([
      getLeadGenerationStock({
        filters: filtersForQuery,
        limit: PAGE_SIZE,
        offset,
      }),
      getLeadGenerationStockSummary(filtersForQuery),
    ]);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur lors du chargement du stock.";
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {message}
      </p>
    );
  }

  const hasPrev = page > 1;
  const hasNext = rows.length === PAGE_SIZE;
  const prevHref = hasPrev ? buildLeadGenerationStockPageUrl({ ...filters, page: page - 1 }) : null;
  const nextHref = hasNext ? buildLeadGenerationStockPageUrl({ ...filters, page: page + 1 }) : null;

  return (
    <div className="space-y-6">
      <nav
        aria-label="Raccourcis carnet"
        className="flex flex-wrap gap-2 border-b border-border/70 pb-4 text-sm"
      >
        <Link
          href="/lead-generation/my-queue"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground hover:text-foreground",
          )}
        >
          Ma file à traiter
        </Link>
        <Link
          href="/lead-generation/imports"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "text-muted-foreground hover:text-foreground",
          )}
        >
          Imports
        </Link>
      </nav>

      <LeadGenerationFilters defaults={filters} action={STOCK_FORM_ACTION} />

      <LeadGenerationDuplicateScanPanel />

      {filtre === "pret" ? (
        <p className="text-xs font-medium text-foreground">Affichage : prêts à contacter</p>
      ) : filtre === "enrichir" ? (
        <p className="text-xs font-medium text-foreground">Affichage : file à enrichir avant diffusion</p>
      ) : filtre === "rejet" ? (
        <p className="text-xs font-medium text-foreground">Affichage : rejetés</p>
      ) : filtre === "premium" ? (
        <p className="text-xs font-medium text-foreground">Affichage : leads premium</p>
      ) : filtre === "contact_gap" ? (
        <p className="text-xs font-medium text-foreground">
          Affichage : contact incomplet (email / site manquants)
          {import_batch ? (
            <span className="block text-muted-foreground">
              Lot : {import_batch.slice(0, 8)}…
            </span>
          ) : null}
        </p>
      ) : closing_readiness_status === "high" ? (
        <p className="text-xs font-medium text-foreground">Affichage : closing fort uniquement</p>
      ) : null}

      <LeadGenerationStockListView
        rows={rows}
        summary={summary}
        page={page}
        pageSize={PAGE_SIZE}
        linkBase={linkBase}
        activeStockChip={activeStockChip}
        activeDispatchChip={activeDispatchChip}
      />

      <div className="flex flex-wrap gap-2">
        {hasPrev && prevHref ? (
          <Link href={prevHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Précédent
          </Link>
        ) : null}
        {hasNext && nextHref ? (
          <Link href={nextHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Suivant
          </Link>
        ) : null}
      </div>
    </div>
  );
}
