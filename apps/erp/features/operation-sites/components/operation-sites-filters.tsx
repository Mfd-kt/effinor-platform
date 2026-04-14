import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button-variants";
import { SITE_KIND_LABELS } from "@/features/operation-sites/constants";
import { SITE_KIND_VALUES } from "@/features/operation-sites/schemas/operation-site.schema";
import type { OperationOption } from "@/features/operation-sites/types";
import type { SiteKind } from "@/types/database.types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type OperationSitesFiltersProps = {
  defaultQ: string;
  defaultOperationId: string;
  defaultSiteKind: string;
  defaultBuildingType: string;
  defaultPrimary: string;
  operations: OperationOption[];
};

export function OperationSitesFilters({
  defaultQ,
  defaultOperationId,
  defaultSiteKind,
  defaultBuildingType,
  defaultPrimary,
  operations,
}: OperationSitesFiltersProps) {
  return (
    <form
      method="get"
      action="/operation-sites"
      className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="min-w-[200px] flex-1 space-y-2">
        <Label htmlFor="filter-os-q">Recherche</Label>
        <Input
          id="filter-os-q"
          name="q"
          defaultValue={defaultQ}
          placeholder="Libellé, activité, type bâtiment, notes…"
        />
      </div>
      <div className="w-full min-w-[220px] sm:min-w-[260px]">
        <div className="space-y-2">
          <Label htmlFor="filter-os-operation">Opération</Label>
          <select
            id="filter-os-operation"
            name="operation_id"
            defaultValue={defaultOperationId}
            className={selectClassName}
          >
            <option value="all">Toutes</option>
            {operations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.operation_reference} — {o.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full min-w-[160px] sm:w-44">
        <div className="space-y-2">
          <Label htmlFor="filter-os-kind">Type de site</Label>
          <select
            id="filter-os-kind"
            name="site_kind"
            defaultValue={defaultSiteKind}
            className={selectClassName}
          >
            <option value="all">Tous</option>
            {SITE_KIND_VALUES.map((v) => (
              <option key={v} value={v}>
                {SITE_KIND_LABELS[v as SiteKind]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full min-w-[160px] sm:max-w-xs">
        <div className="space-y-2">
          <Label htmlFor="filter-os-building">Type bâtiment</Label>
          <Input
            id="filter-os-building"
            name="building_type"
            defaultValue={defaultBuildingType}
            placeholder="Filtre partiel"
          />
        </div>
      </div>
      <div className="w-full min-w-[140px] sm:w-40">
        <div className="space-y-2">
          <Label htmlFor="filter-os-primary">Site principal</Label>
          <select
            id="filter-os-primary"
            name="is_primary"
            defaultValue={defaultPrimary}
            className={selectClassName}
          >
            <option value="all">Tous</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        </div>
      </div>
      <button type="submit" className={cn(buttonVariants())}>
        Filtrer
      </button>
    </form>
  );
}
