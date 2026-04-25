"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Info, Loader2, Plus } from "lucide-react";

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
import { startPapLocationImportAction } from "@/features/lead-generation/actions/start-pap-location-import-action";
import { PAP_LOCATION_DEFAULT_URL } from "@/features/lead-generation/apify/sources/pap_location/config";

const PAP_LOCATION_DEFAULT_MAX = 1000;
const PAP_LOCATION_MAX = 1000;

const formSchema = z.object({
  startUrl: z
    .string()
    .url("Collez une URL pap.fr complète (https://www.pap.fr/...)")
    .refine((u) => /pap\.fr/i.test(u), {
      message: "L'URL doit appartenir au domaine pap.fr",
    })
    .refine((u) => /\/annonce\/location-/i.test(u), {
      message: "L'URL doit pointer vers une page de location PAP (/annonce/location-…)",
    }),
  maxItems: z.coerce.number().int().min(1).max(PAP_LOCATION_MAX).default(PAP_LOCATION_DEFAULT_MAX),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;

export function StartPapLocationImportModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startUrl: PAP_LOCATION_DEFAULT_URL,
      maxItems: PAP_LOCATION_DEFAULT_MAX,
    },
  });

  function onSubmit(values: FormOutput) {
    startTransition(async () => {
      const result = await startPapLocationImportAction({
        startUrl: values.startUrl,
        maxItemsToScrape: values.maxItems,
      });

      if (result.ok) {
        toast.success("Import PAP location lancé !", {
          description: `Batch #${result.batchId.slice(0, 8)} en cours. Les annonces (avec téléphones) apparaîtront d'ici 2-3 minutes.`,
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
          Import PAP Location
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nouvel import — PAP.fr Locations</DialogTitle>
          <DialogDescription>
            Scrape des annonces PAP.fr <strong>location maison</strong> avec téléphones des locataires.
            Coût indicatif : ~$2 / 1000 annonces.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-3 rounded-md border bg-muted/40 p-3 text-sm">
            <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">Mode d&apos;emploi :</strong> rendez-vous sur{" "}
                <a
                  href="https://www.pap.fr"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  pap.fr
                </a>
                , sélectionnez <strong>location · maison</strong>, appliquez vos filtres CEE (DPE, ville),
                puis copiez l&apos;URL de la page de résultats.
              </p>
              <p>
                Exemple :{" "}
                <code className="rounded bg-background px-1 py-0.5 text-[11px]">
                  https://www.pap.fr/annonce/location-maison-bordeaux-33000
                </code>
              </p>
              <p className="text-amber-700">
                ⚠️ Le filtre prix interne attend un loyer mensuel (500-3500 €/mois).
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startUrl">
              URL de recherche PAP <span className="text-destructive">*</span>
            </Label>
            <Input
              id="startUrl"
              type="url"
              placeholder="https://www.pap.fr/annonce/location-maison-..."
              autoComplete="off"
              {...form.register("startUrl")}
            />
            {form.formState.errors.startUrl && (
              <p className="text-xs text-destructive">{form.formState.errors.startUrl.message}</p>
            )}
            <button
              type="button"
              onClick={() => form.setValue("startUrl", PAP_LOCATION_DEFAULT_URL)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Réinitialiser l&apos;URL par défaut
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxItems">Nombre max d&apos;annonces</Label>
            <Input
              id="maxItems"
              type="number"
              min={1}
              max={PAP_LOCATION_MAX}
              {...form.register("maxItems")}
            />
            <p className="text-xs text-muted-foreground">
              Défaut : {PAP_LOCATION_DEFAULT_MAX}. Plafond : {PAP_LOCATION_MAX} (≈ ${(PAP_LOCATION_MAX * 0.002).toFixed(0)}{" "}
              max).
            </p>
            {form.formState.errors.maxItems && (
              <p className="text-xs text-destructive">{form.formState.errors.maxItems.message}</p>
            )}
          </div>

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
