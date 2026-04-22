import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LeadGenerationListSearchState } from "@/features/lead-generation/lib/build-lead-generation-list-url";
import { cn } from "@/lib/utils";

const SELECT_CLASS =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const STOCK_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "new", label: "Nouveau" },
  { value: "ready", label: "Prêt" },
  { value: "assigned", label: "Attribué" },
  { value: "in_progress", label: "En cours" },
  { value: "converted", label: "Converti" },
  { value: "rejected", label: "Rejeté" },
  { value: "expired", label: "Expiré" },
  { value: "archived", label: "Archivé" },
];

const QUAL_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "pending", label: "En attente" },
  { value: "qualified", label: "Qualifié" },
  { value: "rejected", label: "Rejeté" },
  { value: "duplicate", label: "Doublon" },
];

const DISPATCH_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Toutes les files" },
  { value: "ready_now", label: "Prêt maintenant" },
  { value: "enrich_first", label: "À enrichir avant diffusion" },
  { value: "review", label: "À revoir" },
  { value: "low_value", label: "Faible valeur" },
  { value: "do_not_dispatch", label: "Ne pas diffuser" },
];

type Props = {
  defaults: LeadGenerationListSearchState;
  /** Cible du formulaire (défaut : page cockpit). */
  action?: string;
};

export function LeadGenerationFilters({ defaults, action = "/lead-generation" }: Props) {
  return (
    <form method="get" action={action} className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
      {defaults.filtre ? <input type="hidden" name="filtre" value={defaults.filtre} /> : null}
      {defaults.import_batch ? <input type="hidden" name="import_batch" value={defaults.import_batch} /> : null}
      <div className="space-y-2 sm:col-span-2 lg:col-span-3">
        <Label htmlFor="company_search">Recherche société</Label>
        <Input
          id="company_search"
          name="company_search"
          placeholder="Nom de société…"
          defaultValue={defaults.company_search ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="stock_status">Statut stock</Label>
        <select
          id="stock_status"
          name="stock_status"
          className={SELECT_CLASS}
          defaultValue={defaults.stock_status ?? ""}
        >
          {STOCK_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="qualification_status">Qualification</Label>
        <select
          id="qualification_status"
          name="qualification_status"
          className={SELECT_CLASS}
          defaultValue={defaults.qualification_status ?? ""}
        >
          {QUAL_OPTIONS.map((o) => (
            <option key={o.value || "all-q"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dispatch_queue_status">File de dispatch</Label>
        <select
          id="dispatch_queue_status"
          name="dispatch_queue_status"
          className={SELECT_CLASS}
          defaultValue={defaults.dispatch_queue_status ?? ""}
        >
          {DISPATCH_OPTIONS.map((o) => (
            <option key={o.value || "all-d"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="city">Ville</Label>
        <Input id="city" name="city" placeholder="Ville" defaultValue={defaults.city ?? ""} />
      </div>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
        <Button type="submit">Filtrer</Button>
        <Link href={action} className={cn(buttonVariants({ variant: "outline" }))}>
          Réinitialiser
        </Link>
      </div>
    </form>
  );
}
