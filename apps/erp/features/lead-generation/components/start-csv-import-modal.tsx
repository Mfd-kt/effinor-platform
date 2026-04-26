"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Info, Loader2, Upload } from "lucide-react";

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
import { startCsvImportAction } from "@/features/lead-generation/actions/start-csv-import-action";
import { CSV_MANUAL_MAX_FILE_SIZE, CSV_MANUAL_MAX_ROWS } from "@/features/lead-generation/csv/config";

export function StartCsvImportModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  function resetState() {
    setLabel("");
    setFileName(null);
    formRef.current?.reset();
  }

  function handleClose() {
    if (isPending) return;
    setOpen(false);
    resetState();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);

    const labelValue = String(fd.get("label") ?? "").trim();
    if (!labelValue) {
      toast.error("Donnez un nom à votre import.");
      return;
    }

    const fileValue = fd.get("file");
    if (!(fileValue instanceof File) || fileValue.size === 0) {
      toast.error("Choisissez un fichier CSV.");
      return;
    }
    if (fileValue.size > CSV_MANUAL_MAX_FILE_SIZE) {
      const mb = (fileValue.size / 1024 / 1024).toFixed(1);
      toast.error(`Fichier trop lourd (${mb} MB). Maximum 10 MB.`);
      return;
    }

    startTransition(async () => {
      const res = await startCsvImportAction(fd);
      if (res.ok) {
        const s = res.summary;
        toast.success(
          `Import terminé — ${s.accepted} acceptées, ${s.duplicates} doublons, ${s.rejectedIngest + s.rejectedMapping} rejetées`,
          {
            description: `Batch #${res.batchId.slice(0, 8)} · ${s.totalLines} lignes parsées`,
          }
        );
        handleClose();
      } else {
        toast.error("Import impossible", { description: res.error });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="size-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import CSV — data achetée</DialogTitle>
          <DialogDescription>
            Chargez un fichier CSV de prospects achetés. Les fiches partent
            directement dans le <strong>stock</strong> après dédup
            (téléphone).
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <div className="flex gap-3 rounded-md border bg-muted/40 p-3 text-sm">
            <Info className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <p className="text-foreground">
                <strong>Colonnes acceptées :</strong>{" "}
                <code className="text-[11px]">entreprise, contact, civilite,
                prenom, nom, <strong>telephone</strong>, email, site_web,
                adresse, code_postal, ville, siret, categorie, notes</code>
              </p>
              <p>
                <strong className="text-foreground">telephone obligatoire</strong> (dédup par
                numéro normalisé E.164). Les lignes sans téléphone sont
                rejetées. Délimiteur `,` ou `;` auto-détecté.
              </p>
              <p>
                Max <strong className="text-foreground">{CSV_MANUAL_MAX_ROWS.toLocaleString("fr-FR")} lignes</strong>{" "}
                / 10 MB par fichier.
              </p>
              <p className="pt-1">
                <a
                  href="/api/lead-generation/csv-template"
                  className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                  download
                >
                  <Download className="size-3.5" aria-hidden />
                  Télécharger le modèle CSV
                </a>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-label">
              Nom de l&apos;import <span className="text-destructive">*</span>
            </Label>
            <Input
              id="csv-label"
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex. Achat data Lyon PAC — 10/04/2026"
              maxLength={120}
              autoComplete="off"
              required
            />
            <p className="text-xs text-muted-foreground">
              Affiché dans la liste « Derniers imports » — utilisez un nom
              descriptif (campagne, fournisseur, zone).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">
              Fichier CSV <span className="text-destructive">*</span>
            </Label>
            <label
              htmlFor="csv-file"
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-background p-4 text-sm transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileSpreadsheet className="size-5" aria-hidden />
              </span>
              <div className="flex-1 min-w-0">
                {fileName ? (
                  <>
                    <p className="truncate text-sm font-medium text-foreground">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      Cliquez pour changer de fichier
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">
                      Cliquez pour choisir votre CSV
                    </p>
                    <p className="text-xs text-muted-foreground">
                      .csv — UTF-8 recommandé, délimiteur `,` ou `;`
                    </p>
                  </>
                )}
              </div>
              <Input
                id="csv-file"
                name="file"
                type="file"
                accept=".csv,text/csv"
                required
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFileName(f?.name ?? null);
                }}
              />
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Import en cours…
                </>
              ) : (
                <>
                  <Upload className="size-4" aria-hidden />
                  Lancer l&apos;import
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
