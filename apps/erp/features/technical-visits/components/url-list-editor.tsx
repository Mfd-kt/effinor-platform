"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type UrlListEditorProps = {
  label: string;
  description?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Liste d’URLs éditable (ajout / suppression de lignes), même principe que les médias lead.
 */
export function UrlListEditor({
  label,
  description,
  value,
  onChange,
  placeholder = "https://…",
  className,
}: UrlListEditorProps) {
  function updateAt(index: number, text: string) {
    const next = [...value];
    next[index] = text;
    onChange(next);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, j) => j !== index));
  }

  function addRow() {
    onChange([...value, ""]);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div>
        <Label className="text-foreground">{label}</Label>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <ul className="space-y-2">
        {value.map((url, i) => (
          <li key={i} className="flex items-center gap-2">
            <Input
              value={url}
              onChange={(e) => updateAt(i, e.target.value)}
              placeholder={placeholder}
              className="font-mono text-sm"
              aria-label={`${label} ${i + 1}`}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => removeAt(i)}
              aria-label={`Retirer ${label} ${i + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addRow}>
        <Plus className="size-4" aria-hidden />
        Ajouter une URL
      </Button>
    </div>
  );
}
