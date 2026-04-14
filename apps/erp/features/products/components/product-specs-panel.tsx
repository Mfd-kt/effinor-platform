"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  updateProductKeyMetricAction,
  updateProductSpecAction,
} from "@/features/products/actions/product-admin-actions";
import type { Database } from "@/types/database.types";

type SpecRow = Database["public"]["Tables"]["product_specs"]["Row"];
type MetricRow = Database["public"]["Tables"]["product_key_metrics"]["Row"];

type Props = {
  productId: string;
  specs: SpecRow[];
  keyMetrics: MetricRow[];
};

function SpecEditRow({ productId, spec }: { productId: string; spec: SpecRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState(spec.spec_label);
  const [value, setValue] = useState(spec.spec_value);
  const [group, setGroup] = useState(spec.spec_group ?? "");

  useEffect(() => {
    setLabel(spec.spec_label);
    setValue(spec.spec_value);
    setGroup(spec.spec_group ?? "");
  }, [spec.spec_label, spec.spec_value, spec.spec_group]);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProductSpecAction(productId, spec.id, {
        spec_label: label.trim(),
        spec_value: value.trim(),
        spec_group: group.trim() || null,
      });
      if (!res.ok) {
        setError(res.error ?? "Erreur");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const dirty =
    label !== spec.spec_label ||
    value !== spec.spec_value ||
    (group || "") !== (spec.spec_group ?? "");

  return (
    <TableRow>
      <TableCell>
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{spec.spec_key}</code>
        <p className="mt-1 text-[10px] text-muted-foreground">Identifiant technique (non modifiable)</p>
      </TableCell>
      <TableCell>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 text-sm" />
      </TableCell>
      <TableCell>
        <Input value={value} onChange={(e) => setValue(e.target.value)} className="h-8 text-sm" />
      </TableCell>
      <TableCell>
        <Input
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="h-8 text-sm"
          placeholder="—"
        />
      </TableCell>
      <TableCell className="w-32">
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending || !dirty}
            onClick={save}
            className="gap-1.5"
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : saved ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : null}
            {saved ? "Enregistré" : "Enregistrer"}
          </Button>
          {error && <span className="text-[10px] text-destructive">{error}</span>}
        </div>
      </TableCell>
    </TableRow>
  );
}

function MetricEditRow({ productId, metric }: { productId: string; metric: MetricRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState(metric.label);

  useEffect(() => {
    setLabel(metric.label);
  }, [metric.label]);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProductKeyMetricAction(productId, metric.id, {
        label: label.trim(),
      });
      if (!res.ok) {
        setError(res.error ?? "Erreur");
        return;
      }
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  const dirty = label !== metric.label;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-muted/20 p-2">
      <Input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="h-8 min-w-[200px] flex-1 text-sm"
      />
      <Button type="button" size="sm" variant="secondary" disabled={pending || !dirty} onClick={save}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : saved ? <Check className="size-3.5" /> : null}
        {saved ? "Enregistré" : "Enregistrer"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

export function ProductSpecsPanel({ productId, specs, keyMetrics }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-1 text-base font-semibold">Caractéristiques techniques</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Données structurées (tableau catalogue / fiches). Modifiez libellé, valeur et groupe ; la clé technique
          sert aux exports et reste fixe.
        </p>
        {specs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune caractéristique enregistrée.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clé</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Groupe</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specs.map((s) => (
                <SpecEditRow key={s.id} productId={productId} spec={s} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div>
        <h3 className="mb-1 text-base font-semibold">Repères clés</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Textes courts mis en avant (badges). Modifiez le libellé puis enregistrez la ligne.
        </p>
        {keyMetrics.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun repère clé enregistré.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {keyMetrics.map((m) => (
              <MetricEditRow key={m.id} productId={productId} metric={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
