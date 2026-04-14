"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { validateReferencePdfFile } from "@/features/cee-settings/lib/reference-pdf";
import { cn } from "@/lib/utils";

export type ReferencePdfAttachmentProps = {
  inputId: string;
  title?: string;
  /** Texte sous le titre (contraintes PDF / taille). */
  description?: string;
  selectedFile: File | null;
  storedFileName: string | null;
  pending: boolean;
  /** Afficher Ouvrir / Retirer (fichier déjà en base). */
  showStoredActions: boolean;
  onInvalidFile: (message: string) => void;
  onFileAccepted: (file: File | null) => void;
  onDownloadStored?: () => void | Promise<void>;
  onRemoveStored?: () => void | Promise<void>;
  /** Message sous la zone quand un nouveau fichier est prêt (ex. après enregistrement). */
  pendingUploadHint?: string;
};

export function ReferencePdfAttachment({
  inputId,
  title = "Document PDF",
  description = "Fichier PDF uniquement (max. 20 Mo côté Storage).",
  selectedFile,
  storedFileName,
  pending,
  showStoredActions,
  onInvalidFile,
  onFileAccepted,
  onDownloadStored,
  onRemoveStored,
  pendingUploadHint = "Ce PDF sera envoyé lors de l’enregistrement.",
}: ReferencePdfAttachmentProps) {
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pdfDropDepth = useRef(0);
  const [pdfDropActive, setPdfDropActive] = useState(false);

  const applyPdfFile = (file: File | null) => {
    if (!file) {
      onFileAccepted(null);
      return;
    }
    const err = validateReferencePdfFile(file);
    if (err) {
      onInvalidFile(err);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      return;
    }
    onFileAccepted(file);
  };

  const handlePdfDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pdfDropDepth.current += 1;
    setPdfDropActive(true);
  };

  const handlePdfDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pdfDropDepth.current -= 1;
    if (pdfDropDepth.current <= 0) {
      pdfDropDepth.current = 0;
      setPdfDropActive(false);
    }
  };

  const handlePdfDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handlePdfDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pdfDropDepth.current = 0;
    setPdfDropActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    applyPdfFile(file);
  };

  useEffect(() => {
    if (!selectedFile && pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  }, [selectedFile]);

  return (
    <div className="rounded-lg border border-border/60 bg-muted/15 p-3">
      <Label htmlFor={inputId}>{title}</Label>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      <input
        id={inputId}
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          applyPdfFile(f);
        }}
      />
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "mt-2 flex min-h-[112px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          pdfDropActive
            ? "border-primary bg-primary/8"
            : "border-muted-foreground/30 bg-background/90 hover:border-muted-foreground/50",
        )}
        onDragEnter={handlePdfDragEnter}
        onDragLeave={handlePdfDragLeave}
        onDragOver={handlePdfDragOver}
        onDrop={handlePdfDrop}
        onClick={() => pdfInputRef.current?.click()}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            pdfInputRef.current?.click();
          }
        }}
      >
        <Upload
          className={cn("size-8", pdfDropActive ? "text-primary" : "text-muted-foreground")}
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Glissez-déposez</span> un PDF ici ou{" "}
          <span className="font-medium text-foreground">cliquez</span> pour parcourir
        </p>
        <p className="max-w-full truncate font-mono text-xs text-foreground">
          {selectedFile ? selectedFile.name : "Aucun fichier choisi"}
        </p>
      </div>
      {showStoredActions && storedFileName ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Fichier actuel :</span>
          <span className="font-mono text-xs">{storedFileName}</span>
          {onDownloadStored ? (
            <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => void onDownloadStored()}>
              Ouvrir
            </Button>
          ) : null}
          {onRemoveStored ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive"
              onClick={() => void onRemoveStored()}
              disabled={pending}
            >
              Retirer
            </Button>
          ) : null}
        </div>
      ) : null}
      {selectedFile ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">{pendingUploadHint}</p>
      ) : null}
    </div>
  );
}
