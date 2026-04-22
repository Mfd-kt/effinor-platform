import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { Label } from "@/components/ui/label";
import type { ImportBatchesListSearchState } from "@/features/lead-generation/lib/build-import-batches-list-url";
import { cn } from "@/lib/utils";

type ImportBatchesFiltersProps = {
  defaults: ImportBatchesListSearchState;
};

const STATUS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "", label: "Tous les états" },
  { value: "pending", label: "En attente" },
  { value: "running", label: "En cours" },
  { value: "completed", label: "Terminé" },
  { value: "failed", label: "Échec" },
];

export function ImportBatchesFilters({ defaults }: ImportBatchesFiltersProps) {
  const resetHref = "/lead-generation/imports";
  const currentStatus = defaults.status ?? "";

  return (
    <form
      method="GET"
      action="/lead-generation/imports"
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="grid w-full gap-2 sm:max-w-[220px]">
        <Label htmlFor="imp-status">État import</Label>
        <select
          id="imp-status"
          name="status"
          defaultValue={currentStatus}
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={cn(buttonVariants({ size: "sm" }))}>
          Filtrer
        </button>
        <Link href={resetHref} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Réinitialiser
        </Link>
      </div>
    </form>
  );
}
