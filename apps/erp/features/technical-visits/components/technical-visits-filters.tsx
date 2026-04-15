import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button-variants";
import { TECHNICAL_VISIT_STATUS_LABELS } from "@/features/technical-visits/constants";
import { TECHNICAL_VISIT_STATUS_VALUES } from "@/features/technical-visits/schemas/technical-visit.schema";
import type { LeadOption } from "@/features/technical-visits/types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm sm:h-10",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type TechnicalVisitsFiltersProps = {
  defaultQ: string;
  defaultStatus: string;
  defaultLeadId: string;
  /** Conserve la vue carte lors du filtrage. */
  defaultView?: "list" | "map";
  /** Conserve l’onglet métier (Toutes, Aujourd’hui, …) lors du filtrage. */
  defaultBucket?: string;
  leads: LeadOption[];
};

export function TechnicalVisitsFilters({
  defaultQ,
  defaultStatus,
  defaultLeadId,
  defaultView = "list",
  defaultBucket,
  leads,
}: TechnicalVisitsFiltersProps) {
  return (
    <form
      method="get"
      action="/technical-visits"
      className="mb-0 flex flex-col gap-4 rounded-2xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-black/[0.02] dark:ring-white/[0.04] sm:flex-row sm:flex-wrap sm:items-end"
    >
      {defaultView === "map" ? <input type="hidden" name="view" value="map" /> : null}
      {defaultBucket && defaultBucket !== "all" && defaultBucket !== "active" ? (
        <input type="hidden" name="bucket" value={defaultBucket} />
      ) : null}
      <div className="min-w-[200px] flex-1 space-y-2">
        <Label htmlFor="filter-vt-q">Recherche</Label>
        <Input
          id="filter-vt-q"
          name="q"
          defaultValue={defaultQ}
          placeholder="Référence, adresse travaux…"
          className="h-11 rounded-lg sm:h-10"
        />
      </div>
      <div className="w-full min-w-[180px] sm:w-48">
        <div className="space-y-2">
          <Label htmlFor="filter-vt-status">Statut</Label>
          <select
            id="filter-vt-status"
            name="status"
            defaultValue={defaultStatus}
            className={selectClassName}
          >
            <option value="all">Tous les statuts</option>
            {TECHNICAL_VISIT_STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {TECHNICAL_VISIT_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full min-w-[200px] sm:w-64">
        <div className="space-y-2">
          <Label htmlFor="filter-vt-lead">Lead</Label>
          <select
            id="filter-vt-lead"
            name="lead_id"
            defaultValue={defaultLeadId}
            className={selectClassName}
          >
            <option value="all">Tous</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.company_name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className={cn(buttonVariants(), "h-11 w-full shrink-0 sm:h-10 sm:w-auto")}>
        Filtrer
      </button>
    </form>
  );
}
