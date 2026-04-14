"use client";

import { FileImage, FileText, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { TechnicalVisitMediaKind } from "@/features/technical-visits/lib/upload-technical-visit-media";
import {
  removeFileFromTechnicalVisitMedia,
  uploadFilesToTechnicalVisitMedia,
} from "@/features/technical-visits/lib/upload-technical-visit-media";
import { cn } from "@/lib/utils";

const MAX_FILES = 30;

function fileMatchesAcceptToken(file: File, tok: string): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (tok === "*/*") return true;
  if (tok.endsWith("/*")) {
    const prefix = tok.slice(0, -2);
    if (type && type.startsWith(`${prefix}/`)) return true;
    if (prefix === "image") {
      return /\.(png|jpe?g|gif|webp|bmp|heic|svg|avif)$/.test(name);
    }
    return false;
  }
  if (tok.startsWith(".")) return name.endsWith(tok);
  if (type && type === tok) return true;
  if (tok === "application/pdf" && name.endsWith(".pdf")) return true;
  return false;
}

function filesMatchingAccept(files: File[], accept: string): File[] {
  const trimmed = accept.trim();
  if (!trimmed) return [...files];
  const tokens = trimmed.split(",").map((s) => s.trim().toLowerCase());
  return files.filter((file) => tokens.some((tok) => fileMatchesAcceptToken(file, tok)));
}

type TechnicalVisitMediaFilesFieldProps = {
  technicalVisitId: string;
  kind: TechnicalVisitMediaKind;
  label: string;
  description?: string;
  accept: string;
  value: string[];
  onChange: (urls: string[]) => void;
  icon?: "image" | "cadastre";
};

function fileLabelFromUrl(url: string): string {
  try {
    const last = url.split("/").pop() ?? url;
    return decodeURIComponent(last.replace(/^\d+-/, "").slice(0, 80)) || url;
  } catch {
    return url.slice(0, 80);
  }
}

function isLikelyImageUrl(url: string): boolean {
  const path = (url.split("?")[0] ?? "").toLowerCase();
  return /\.(png|jpe?g|gif|webp|bmp|avif|svg)$/.test(path);
}

function VtMediaFileRow({
  url,
  kind,
  uploading,
  onOpenLightbox,
  onRemove,
}: {
  url: string;
  kind: TechnicalVisitMediaKind;
  uploading: boolean;
  onOpenLightbox: () => void;
  onRemove: () => void;
}) {
  const label = fileLabelFromUrl(url);
  const showImageThumb = kind !== "report_pdfs" && isLikelyImageUrl(url);
  const showPdfLink = kind === "report_pdfs" || (!showImageThumb && /\.pdf$/i.test(url.split("?")[0] ?? ""));

  if (showImageThumb) {
    return (
      <li className="flex items-stretch gap-2 rounded-md border border-border/80 bg-background/80 p-2 text-sm">
        <button
          type="button"
          onClick={onOpenLightbox}
          className={cn(
            "flex min-h-[min(200px,35vh)] flex-1 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40 p-2 ring-offset-background",
            "transition hover:ring-2 hover:ring-ring hover:ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
          aria-label={`Agrandir l’image (${label})`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- URLs dynamiques Storage */}
          <img
            src={url}
            alt=""
            className="max-h-[min(240px,40vh)] w-full object-contain object-center"
            loading="lazy"
          />
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0 self-start text-destructive hover:text-destructive"
          disabled={uploading}
          onClick={onRemove}
          aria-label="Retirer ce fichier"
        >
          <Trash2 className="size-4" />
        </Button>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-start gap-3 rounded-md border border-border/80 bg-background/80 p-2 text-sm">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="break-all font-medium text-foreground">{label}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {showPdfLink ? "Ouvrir le PDF" : "Ouvrir dans un nouvel onglet"}
        </a>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-destructive hover:text-destructive"
        disabled={uploading}
        onClick={onRemove}
        aria-label="Retirer ce fichier"
      >
        <Trash2 className="size-4" />
      </Button>
    </li>
  );
}

export function TechnicalVisitMediaFilesField({
  technicalVisitId,
  kind,
  label,
  description,
  accept,
  value,
  onChange,
  icon = "image",
}: TechnicalVisitMediaFilesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!lightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxUrl(null);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxUrl]);

  const Icon = icon === "cadastre" ? FileText : FileImage;

  async function addFilesFromList(files: File[]) {
    const filtered = filesMatchingAccept(files, accept);
    if (!filtered.length) {
      setError("Aucun fichier ne correspond au type attendu pour ce champ.");
      return;
    }
    if (value.length + filtered.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} fichiers.`);
      return;
    }
    setError(null);
    setUploading(true);
    const { urls, error: upErr } = await uploadFilesToTechnicalVisitMedia(
      technicalVisitId,
      kind,
      filtered,
    );
    setUploading(false);
    if (upErr) {
      setError(upErr);
      return;
    }
    onChange([...value, ...urls]);
  }

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = e.target.files;
    e.target.value = "";
    if (!list?.length) return;
    await addFilesFromList(Array.from(list));
  }

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (uploading || value.length >= MAX_FILES) return;
    dragCounterRef.current += 1;
    if (e.dataTransfer.types?.includes("Files")) {
      setIsDragging(true);
    }
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!uploading && value.length < MAX_FILES) {
      e.dataTransfer.dropEffect = "copy";
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (uploading || value.length >= MAX_FILES) return;
    const dropped = Array.from(e.dataTransfer.files ?? []);
    if (!dropped.length) return;
    await addFilesFromList(dropped);
  }

  function onDropZoneClick(e: React.MouseEvent<HTMLDivElement>) {
    if (uploading || value.length >= MAX_FILES) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, li")) return;
    inputRef.current?.click();
  }

  async function removeAt(index: number) {
    const url = value[index];
    if (!url) return;
    setError(null);
    const { ok, error: rmErr } = await removeFileFromTechnicalVisitMedia(url);
    if (!ok) {
      setError(rmErr ?? "Suppression impossible.");
      return;
    }
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2 md:col-span-2">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <Label className="text-foreground">{label}</Label>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        disabled={uploading}
        onChange={onPickFiles}
        aria-label={`Choisir des fichiers pour ${label}`}
      />

      <div
        role="group"
        aria-label={`Zone d’ajout de fichiers : ${label}`}
        className={cn(
          "rounded-lg border-2 border-dashed p-4 transition-colors",
          isDragging
            ? "border-primary bg-primary/5 ring-2 ring-primary/25"
            : "border-border/60 bg-muted/10",
          !uploading && value.length < MAX_FILES && "cursor-pointer",
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onDropZoneClick}
      >
        {value.length ? (
          <ul className="space-y-3 rounded-md border border-border/80 bg-background/50 p-3">
            {value.map((url, i) => (
              <VtMediaFileRow
                key={`${url}-${i}`}
                url={url}
                kind={kind}
                uploading={uploading}
                onOpenLightbox={() => setLightboxUrl(url)}
                onRemove={() => void removeAt(i)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun fichier pour l’instant — glissez-déposez ici ou cliquez dans la zone / sur le bouton pour en
            choisir sur votre ordinateur.
          </p>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading || value.length >= MAX_FILES}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            {uploading ? "Téléversement…" : "Choisir des fichiers"}
          </Button>
          <p className="text-xs text-muted-foreground">Zone cliquable ou bouton ci-dessus.</p>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {lightboxUrl ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu en grand"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute right-3 top-3 flex size-10 items-center justify-center rounded-full bg-background/95 text-foreground shadow-md ring-1 ring-border transition hover:bg-muted"
            onClick={() => setLightboxUrl(null)}
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- URLs dynamiques Storage */}
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-[min(90vh,900px)] max-w-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}
    </div>
  );
}
