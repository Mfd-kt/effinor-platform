"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { startLeboncoinImmobilierImportAction } from "@/features/lead-generation/actions/start-leboncoin-immobilier-import-action";

/**
 * Schéma du formulaire (sous-ensemble de leboncoinImmobilierInputSchema,
 * avec defaults métier CEE pré-remplis pour cibler les maisons à rénover chez les particuliers).
 */
const formSchema = z
  .object({
    mode: z.enum(["url", "filters"]),
    searchUrl: z.string().url().optional().or(z.literal("")),

    location: z.string().optional(),
    immobilierCategory: z.enum(["9", "10", "11", "13", "2001"]).default("9"),
    real_estate_type: z.array(z.enum(["1", "2", "3", "4", "5"])).default(["1"]),
    seller_type: z.enum(["all", "pro", "private"]).default("private"),
    energy_rate: z.array(z.enum(["a", "b", "c", "d", "e", "f", "g"])).default(["d", "e", "f", "g"]),
    price_min_filter: z.coerce.number().int().min(0).optional(),
    price_max_filter: z.coerce.number().int().min(0).optional(),
    rooms_min: z.coerce.number().int().min(1).max(8).optional(),

    adLimit: z.coerce.number().int().min(1).max(2000).default(500),
    // L'extraction de téléphones n'est supportée par l'acteur que sur des URLs
    // d'annonces directes. En mode recherche, on force false (cf. start-import.ts).
    includePhone: z.boolean().default(false),
  })
  .refine((d) => (d.mode === "url" ? Boolean(d.searchUrl) : Boolean(d.location)), {
    message: "URL requise en mode URL, ville/département requis en mode filtres",
    path: ["searchUrl"],
  });

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

export function StartLeboncoinImportModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "filters",
      immobilierCategory: "9",
      real_estate_type: ["1"],
      seller_type: "private",
      energy_rate: ["d", "e", "f", "g"],
      adLimit: 500,
      includePhone: false,
    },
  });

  const mode = form.watch("mode");

  function onSubmit(values: FormOutput) {
    startTransition(async () => {
      const payload: Record<string, unknown> = {
        adLimit: values.adLimit,
        includePhone: values.includePhone,
      };

      if (values.mode === "url" && values.searchUrl) {
        payload.searchUrl = values.searchUrl;
      } else {
        payload.immobilierCategory = values.immobilierCategory;
        payload.location = values.location;
        payload.real_estate_type = values.real_estate_type;
        payload.seller_type = values.seller_type;
        if (values.energy_rate.length > 0) {
          payload.energy_rate = values.energy_rate;
        }
        if (values.price_min_filter !== undefined) {
          payload.price_min_filter = values.price_min_filter;
        }
        if (values.price_max_filter !== undefined) {
          payload.price_max_filter = values.price_max_filter;
        }
        if (values.rooms_min !== undefined) {
          payload.rooms_min = values.rooms_min;
        }
      }

      const result = await startLeboncoinImmobilierImportAction(payload);

      if (result.ok) {
        toast.success("Import lancé !", {
          description: `Batch #${result.batchId.slice(0, 8)} en cours. Les résultats apparaîtront d'ici 1-2 minutes.`,
        });
        setOpen(false);
        form.reset();
      } else {
        toast.error("Impossible de lancer l'import", {
          description: result.error,
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4" />
          Import Le Bon Coin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvel import — Le Bon Coin Immobilier</DialogTitle>
          <DialogDescription>
            Scrape des annonces de maisons individuelles avec téléphones des propriétaires. Ciblage
            par défaut : <strong>particuliers, maisons, DPE D à G</strong> (éligibles CEE).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/30 p-1">
            <button
              type="button"
              className={`rounded px-3 py-2 text-sm font-medium ${
                mode === "filters" ? "bg-background shadow" : "text-muted-foreground"
              }`}
              onClick={() => form.setValue("mode", "filters")}
            >
              Filtres simples
            </button>
            <button
              type="button"
              className={`rounded px-3 py-2 text-sm font-medium ${
                mode === "url" ? "bg-background shadow" : "text-muted-foreground"
              }`}
              onClick={() => form.setValue("mode", "url")}
            >
              URL de recherche LBC
            </button>
          </div>

          {mode === "url" && (
            <div className="space-y-2">
              <Label htmlFor="searchUrl">URL de recherche Le Bon Coin</Label>
              <Input
                id="searchUrl"
                placeholder="https://www.leboncoin.fr/recherche?category=9&locations=..."
                {...form.register("searchUrl")}
              />
              <p className="text-xs text-muted-foreground">
                Collez une URL de recherche LBC. Tous les filtres (prix, DPE, etc.) seront
                automatiquement extraits.
              </p>
              {form.formState.errors.searchUrl && (
                <p className="text-xs text-destructive">{form.formState.errors.searchUrl.message}</p>
              )}
            </div>
          )}

          {mode === "filters" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">
                  Localisation <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location"
                  placeholder="Paris, Lyon 69, Bordeaux 33..."
                  {...form.register("location")}
                />
                <p className="text-xs text-muted-foreground">
                  Ville ou département. Laisser vide = toute la France.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de vendeur</Label>
                  <Select
                    value={form.watch("seller_type")}
                    onValueChange={(v) =>
                      form.setValue("seller_type", v as "all" | "pro" | "private")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Particuliers uniquement</SelectItem>
                      <SelectItem value="pro">Professionnels</SelectItem>
                      <SelectItem value="all">Tous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adLimit">Nombre max d&apos;annonces</Label>
                  <Input
                    id="adLimit"
                    type="number"
                    min="1"
                    max="2000"
                    {...form.register("adLimit")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price_min_filter">Prix min (€)</Label>
                  <Input
                    id="price_min_filter"
                    type="number"
                    placeholder="150000"
                    {...form.register("price_min_filter")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_max_filter">Prix max (€)</Label>
                  <Input
                    id="price_max_filter"
                    type="number"
                    placeholder="700000"
                    {...form.register("price_max_filter")}
                  />
                </div>
              </div>

              <div className="rounded-md border bg-emerald-50 dark:bg-emerald-950/20 p-3 text-sm">
                <p className="font-medium text-emerald-900 dark:text-emerald-200">
                  Ciblage CEE pré-configuré
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-emerald-800 dark:text-emerald-300">
                  <li>Type de bien : Maison individuelle</li>
                  <li>DPE : D, E, F, G (éligibles CEE)</li>
                  <li>
                    Téléphone : non extrait en mode recherche (limitation de l&apos;acteur Apify)
                  </li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Lancement…
                </>
              ) : (
                "Lancer l'import"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
