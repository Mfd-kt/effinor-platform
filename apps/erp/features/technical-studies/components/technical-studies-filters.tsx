import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  STUDY_TYPE_LABELS,
  TECHNICAL_STUDY_STATUS_LABELS,
} from "@/features/technical-studies/constants";
import {
  STUDY_TYPE_VALUES,
  TECHNICAL_STUDY_STATUS_VALUES,
} from "@/features/technical-studies/schemas/technical-study.schema";
import type { StudyType, TechnicalStudyStatus } from "@/types/database.types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type TechnicalStudiesFiltersProps = {
  defaultQ: string;
  defaultStudyType: string;
  defaultStatus: string;
};

export function TechnicalStudiesFilters({
  defaultQ,
  defaultStudyType,
  defaultStatus,
}: TechnicalStudiesFiltersProps) {
  return (
    <form
      method="get"
      action="/technical-studies"
      className="mb-8 flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="min-w-[200px] flex-1 space-y-2">
        <Label htmlFor="filter-ts-q">Recherche</Label>
        <Input
          id="filter-ts-q"
          name="q"
          defaultValue={defaultQ}
          placeholder="Référence, bureau, résumé…"
        />
      </div>
      <div className="w-full min-w-[160px] sm:w-44">
        <div className="space-y-2">
          <Label htmlFor="filter-ts-type">Type</Label>
          <select
            id="filter-ts-type"
            name="study_type"
            defaultValue={defaultStudyType}
            className={selectClassName}
          >
            <option value="all">Tous les types</option>
            {STUDY_TYPE_VALUES.map((v) => (
              <option key={v} value={v}>
                {STUDY_TYPE_LABELS[v as StudyType]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="w-full min-w-[160px] sm:w-44">
        <div className="space-y-2">
          <Label htmlFor="filter-ts-status">Statut</Label>
          <select
            id="filter-ts-status"
            name="status"
            defaultValue={defaultStatus}
            className={selectClassName}
          >
            <option value="all">Tous les statuts</option>
            {TECHNICAL_STUDY_STATUS_VALUES.map((v) => (
              <option key={v} value={v}>
                {TECHNICAL_STUDY_STATUS_LABELS[v as TechnicalStudyStatus]}
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
