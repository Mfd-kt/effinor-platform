import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button-variants";
import { OPERATION_STATUS_LABELS } from "@/features/operations/constants";
import { OPERATION_STATUS_VALUES } from "@/features/operations/schemas/operation.schema";
import type { BeneficiaryOption } from "@/features/operations/types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type OperationsFiltersProps = {
  defaultQ: string;
  defaultStatus: string;
  defaultBeneficiaryId: string;
  beneficiaries: BeneficiaryOption[];
};

export function OperationsFilters({
  defaultQ,
  defaultStatus,
  defaultBeneficiaryId,
  beneficiaries,
}: OperationsFiltersProps) {
  return (
    <form
      method="get"
      action="/operations"
      className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="min-w-[200px] flex-1 space-y-2">
        <Label htmlFor="filter-op-q">Recherche</Label>
        <Input
          id="filter-op-q"
          name="q"
          defaultValue={defaultQ}
          placeholder="Référence, titre, fiche CEE…"
        />
      </div>
      <div className="w-full min-w-[180px] sm:w-48">
        <div className="space-y-2">
          <Label htmlFor="filter-op-status">Statut opération</Label>
          <select
            id="filter-op-status"
            name="status"
            defaultValue={defaultStatus}
            className={selectClassName}
          >
            <option value="all">Tous les statuts</option>
            {OPERATION_STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {OPERATION_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full min-w-[220px] sm:min-w-[260px]">
        <div className="space-y-2">
          <Label htmlFor="filter-op-beneficiary">Bénéficiaire</Label>
          <select
            id="filter-op-beneficiary"
            name="beneficiary_id"
            defaultValue={defaultBeneficiaryId}
            className={selectClassName}
          >
            <option value="all">Tous</option>
            {beneficiaries.map((b) => (
              <option key={b.id} value={b.id}>
                {b.company_name}
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
