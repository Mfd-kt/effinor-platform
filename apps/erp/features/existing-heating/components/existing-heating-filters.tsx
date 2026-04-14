import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button-variants";
import type { ExistingHeatingFormOptions } from "@/features/existing-heating/types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type ExistingHeatingFiltersProps = {
  defaultQ: string;
  defaultHeatingModelId: string;
  options: ExistingHeatingFormOptions;
};

export function ExistingHeatingFilters({
  defaultQ,
  defaultHeatingModelId,
  options,
}: ExistingHeatingFiltersProps) {
  return (
    <form
      method="get"
      action="/existing-heating"
      className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="min-w-[200px] flex-1 space-y-2">
        <Label htmlFor="filter-eh-q">Recherche (notes)</Label>
        <Input
          id="filter-eh-q"
          name="q"
          defaultValue={defaultQ}
          placeholder="Texte dans les notes…"
        />
      </div>
      <div className="w-full min-w-[260px] sm:min-w-[280px]">
        <div className="space-y-2">
          <Label htmlFor="filter-eh-model">Modèle de chauffage</Label>
          <select
            id="filter-eh-model"
            name="heating_model_id"
            defaultValue={defaultHeatingModelId}
            className={selectClassName}
          >
            <option value="all">Tous les modèles</option>
            {options.heatingModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
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
