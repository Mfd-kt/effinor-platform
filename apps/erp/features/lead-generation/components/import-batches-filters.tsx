import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ImportBatchesListSearchState } from "@/features/lead-generation/lib/build-import-batches-list-url";
import { cn } from "@/lib/utils";

type ImportBatchesFiltersProps = {
  defaults: ImportBatchesListSearchState;
};

export function ImportBatchesFilters({ defaults }: ImportBatchesFiltersProps) {
  const resetHref = "/lead-generation/imports";

  return (
    <form method="GET" action="/lead-generation/imports" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="grid w-full gap-2 sm:max-w-[200px]">
        <Label htmlFor="imp-source">Code source</Label>
        <Input
          id="imp-source"
          name="source"
          defaultValue={defaults.source ?? ""}
          placeholder="ex. apify_google_maps"
          autoComplete="off"
        />
      </div>
      <div className="grid w-full gap-2 sm:max-w-[180px]">
        <Label htmlFor="imp-status">État import</Label>
        <Input
          id="imp-status"
          name="status"
          defaultValue={defaults.status ?? ""}
          placeholder="pending, running…"
          autoComplete="off"
        />
      </div>
      <div className="grid w-full gap-2 sm:max-w-[200px]">
        <Label htmlFor="imp-ext">État Apify</Label>
        <Input
          id="imp-ext"
          name="external_status"
          defaultValue={defaults.external_status ?? ""}
          placeholder="RUNNING, SUCCEEDED…"
          autoComplete="off"
        />
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
