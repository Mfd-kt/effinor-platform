"use client";

import { Copy, Loader2, Pencil, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  retryTechnicalVisitAudioTranscriptionAction,
  updateTechnicalVisitAudioTranscriptionAction,
} from "@/features/technical-visits/actions/technical-visit-audio-notes-actions";
import type { TechnicalVisitAudioNoteRow } from "@/features/technical-visits/queries/get-technical-visit-audio-notes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateFr } from "@/lib/format";
import { cn } from "@/lib/utils";

function statusLabel(status: string): string {
  switch (status) {
    case "uploading":
      return "Publication…";
    case "uploaded":
      return "Publié";
    case "transcribing":
      return "Transcription en cours…";
    case "transcribed":
      return "Transcrit";
    case "failed":
      return "Échec";
    default:
      return status;
  }
}

type Props = {
  note: TechnicalVisitAudioNoteRow;
  readOnly: boolean;
  onInsert: (text: string) => void;
};

export function TechnicalVisitAudioItem({ note, readOnly, onInsert }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.transcription_text ?? "");
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDraft(note.transcription_text ?? "");
    }
  }, [editing, note.id, note.transcription_text]);

  const busy = note.transcription_status === "transcribing" || note.transcription_status === "uploading";

  const copy = async () => {
    const t = note.transcription_text?.trim();
    if (!t) {
      toast.message("Rien à copier pour l’instant.");
      return;
    }
    try {
      await navigator.clipboard.writeText(t);
      toast.success("Texte copié.");
    } catch {
      toast.error("Impossible de copier (permissions navigateur).");
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    const res = await updateTechnicalVisitAudioTranscriptionAction(note.id, draft);
    setSaving(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Transcription mise à jour.");
    setEditing(false);
    router.refresh();
  };

  const retry = async () => {
    setRetrying(true);
    const res = await retryTechnicalVisitAudioTranscriptionAction(note.id);
    setRetrying(false);
    if (!res.ok) {
      toast.error(res.error);
    } else {
      toast.success("Transcription relancée.");
    }
    router.refresh();
  };

  const canEditText =
    !readOnly && (note.transcription_status === "transcribed" || note.transcription_status === "failed");
  const showText =
    note.transcription_status === "transcribed" ||
    (note.transcription_status === "failed" && (note.transcription_text?.length ?? 0) > 0);

  return (
    <div className="space-y-3 rounded-lg border border-border/70 bg-background/80 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{formatDateFr(note.created_at)}</span>
          {note.duration_seconds != null ? (
            <span className="tabular-nums">· {Math.round(note.duration_seconds)} s</span>
          ) : null}
        </div>
        <Badge
          variant={note.transcription_status === "failed" ? "destructive" : "secondary"}
          className={cn(
            "font-normal",
            note.transcription_status === "transcribing" && "animate-pulse",
          )}
        >
          {busy ? <Loader2 className="mr-1 inline h-3 w-3 animate-spin" aria-hidden /> : null}
          {statusLabel(note.transcription_status)}
        </Badge>
      </div>

      {note.transcription_status === "failed" && note.transcription_error ? (
        <p className="text-sm text-destructive">{note.transcription_error}</p>
      ) : null}

      {showText && !editing ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{note.transcription_text}</p>
      ) : null}

      {editing ? (
        <Textarea
          rows={5}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="min-h-[8rem] text-base md:text-sm"
        />
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {note.transcription_status === "transcribed" && note.transcription_text?.trim() && !readOnly ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 w-full sm:w-auto"
            onClick={() => onInsert(note.transcription_text!.trim())}
          >
            Insérer dans le compte-rendu
          </Button>
        ) : null}

        {!readOnly && note.transcription_status === "transcribed" && !editing ? (
          <>
            <Button type="button" variant="outline" size="sm" className="min-h-11 gap-1" onClick={() => void copy()}>
              <Copy className="h-4 w-4" aria-hidden />
              Copier
            </Button>
            {canEditText ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 gap-1"
                onClick={() => {
                  setDraft(note.transcription_text ?? "");
                  setEditing(true);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Éditer
              </Button>
            ) : null}
          </>
        ) : null}

        {!readOnly && note.transcription_status === "failed" ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11 gap-1"
            disabled={retrying}
            onClick={() => void retry()}
          >
            {retrying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
            Relancer la transcription
          </Button>
        ) : null}

        {!readOnly && note.transcription_status === "failed" && !editing ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={() => {
              setDraft(note.transcription_text ?? "");
              setEditing(true);
            }}
          >
            Saisir / corriger à la main
          </Button>
        ) : null}

        {editing ? (
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button type="button" size="sm" className="min-h-11 flex-1" disabled={saving} onClick={() => void saveEdit()}>
              {saving ? "Enregistrement…" : "Enregistrer le texte"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11 flex-1"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Annuler
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
