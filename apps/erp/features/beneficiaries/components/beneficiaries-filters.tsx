import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button-variants";
import { BENEFICIARY_STATUS_LABELS } from "@/features/beneficiaries/constants";
import { BENEFICIARY_STATUS_VALUES } from "@/features/beneficiaries/schemas/beneficiary.schema";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type BeneficiariesFiltersProps = {
  defaultQ: string;
  defaultStatus: string;
};

export function BeneficiariesFilters({
  defaultQ,
  defaultStatus,
}: BeneficiariesFiltersProps) {
  return (
    <form
      method="get"
      action="/beneficiaries"
      className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="min-w-[200px] flex-1 space-y-2">
        <Label htmlFor="filter-q">Recherche (raison sociale)</Label>
        <Input
          id="filter-q"
          name="q"
          defaultValue={defaultQ}
          placeholder="Rechercher…"
        />
      </div>
      <div className="w-full min-w-[180px] sm:w-48">
        <div className="space-y-2">
          <Label htmlFor="filter-status">Statut</Label>
          <select
            id="filter-status"
            name="status"
            defaultValue={defaultStatus}
            className={selectClassName}
          >
            <option value="all">Tous les statuts</option>
            {BENEFICIARY_STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {BENEFICIARY_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className={cn(buttonVariants())}>
        Filtrer
      </button>
    </form>
  );
}
