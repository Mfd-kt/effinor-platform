"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TechnicalVisitMediaFilesField } from "@/features/technical-visits/components/technical-visit-media-files-field";
import type { VisitField } from "@/features/technical-visits/templates/schema-types";
import { cn } from "@/lib/utils";

const selectClassName = cn(
  "flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm md:min-h-10 md:py-2",
  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

type DynamicVisitFieldProps = {
  field: VisitField;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Required for photo fields to enable uploads. */
  technicalVisitId?: string;
};

export function DynamicVisitField({ field, value, onChange, technicalVisitId }: DynamicVisitFieldProps) {
  const htmlId = `dyn_${field.id}`;
  const notEditable = field.editable === false || (field.type === "calculated" && field.readonly !== false);
  const requiredMark = field.required ? " *" : "";

  switch (field.type) {
    case "text":
      return (
        <div className="space-y-2 md:space-y-1.5">
          <Label htmlFor={htmlId}>{field.label}{requiredMark}</Label>
          <Input
            id={htmlId}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            readOnly={notEditable}
            className={cn(notEditable ? "bg-muted/50" : undefined, "min-h-11 md:min-h-10")}
            placeholder={field.hint}
          />
          {field.hint && !notEditable ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-2 md:space-y-1.5">
          <Label htmlFor={htmlId}>{field.label}{requiredMark}</Label>
          <Textarea
            id={htmlId}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            readOnly={notEditable}
            rows={4}
            placeholder={field.hint}
          />
          {field.hint && !notEditable ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
        </div>
      );

    case "number":
      return (
        <div className="space-y-2 md:space-y-1.5">
          <Label htmlFor={htmlId}>
            {field.label}{field.unit ? ` (${field.unit})` : ""}{requiredMark}
          </Label>
          <Input
            id={htmlId}
            inputMode="decimal"
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(e) => {
              const raw = e.target.value.replace(",", ".").trim();
              if (raw === "") { onChange(undefined); return; }
              const n = Number(raw);
              onChange(Number.isFinite(n) ? n : raw);
            }}
            readOnly={notEditable}
            className={cn(notEditable ? "bg-muted/50" : undefined, "min-h-11 md:min-h-10")}
            placeholder={field.hint}
          />
          {field.hint && !notEditable ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
        </div>
      );

    case "select":
      return (
        <div className="space-y-2 md:space-y-1.5">
          <Label htmlFor={htmlId}>{field.label}{requiredMark}</Label>
          <select
            id={htmlId}
            className={selectClassName}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
            disabled={notEditable}
          >
            <option value="">— Sélectionner —</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {field.hint ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
        </div>
      );

    case "radio":
      return (
        <fieldset className="space-y-2 md:space-y-1.5">
          <legend className="text-sm font-medium leading-none">{field.label}{requiredMark}</legend>
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
            {field.options?.map((opt) => (
              <label
                key={opt.value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md py-1 text-sm sm:min-h-0 sm:py-0"
              >
                <input
                  type="radio"
                  name={htmlId}
                  value={opt.value}
                  checked={String(value ?? "") === opt.value}
                  onChange={() => onChange(opt.value)}
                  disabled={notEditable}
                  className="size-5 accent-primary sm:size-4"
                />
                {opt.label}
              </label>
            ))}
          </div>
          {field.hint ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
        </fieldset>
      );

    case "boolean":
      return (
        <div className="flex items-start gap-3.5 pt-1 md:gap-3">
          <input
            type="checkbox"
            id={htmlId}
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            disabled={notEditable}
            className="mt-1 size-5 shrink-0 accent-primary md:mt-0.5 md:size-4"
          />
          <div>
            <Label htmlFor={htmlId} className="cursor-pointer">{field.label}{requiredMark}</Label>
            {field.hint ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
          </div>
        </div>
      );

    case "calculated":
      return (
        <div className="space-y-2 md:space-y-1.5">
          <Label htmlFor={htmlId}>
            {field.label}{field.unit ? ` (${field.unit})` : ""}
          </Label>
          <Input
            id={htmlId}
            value={value !== undefined && value !== null ? String(value) : "—"}
            readOnly
            tabIndex={-1}
            className="min-h-11 bg-muted/50 font-mono md:min-h-10"
          />
          {field.hint ? <p className="text-xs text-muted-foreground">{field.hint}</p> : null}
        </div>
      );

    case "photo": {
      if (!technicalVisitId) {
        return (
          <div className="space-y-1.5">
            <Label>{field.label}{requiredMark}</Label>
            <p className="text-sm text-muted-foreground">
              Enregistrez d'abord la visite pour ajouter des fichiers.
            </p>
          </div>
        );
      }
      const urls = Array.isArray(value) ? (value as string[]) : [];
      /*
       * Convention : les champs photo dynamiques utilisent le kind "visit_photos"
       * pour rester compatibles avec le système media existant. Le field.id est
       * inclus dans le sous-chemin Storage via le `subFolder` prop pour garantir
       * que chaque champ du template a son namespace propre :
       *   technical-visits/{vtId}/dyn_{field.id}/
       * Cela prépare une migration future vers une table média structurée.
       */
      return (
        <TechnicalVisitMediaFilesField
          technicalVisitId={technicalVisitId}
          kind="visit_photos"
          subFolder={`dyn_${field.id}`}
          label={field.label + requiredMark}
          description={field.hint}
          accept="image/*,application/pdf,.pdf"
          icon="image"
          value={urls}
          onChange={(next) => onChange(next)}
        />
      );
    }

    default:
      return null;
  }
}
