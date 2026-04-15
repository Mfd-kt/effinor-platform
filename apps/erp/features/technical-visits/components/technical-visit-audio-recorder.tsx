"use client";

import { Loader2, Mic, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { uploadTechnicalVisitAudioNoteAction } from "@/features/technical-visits/actions/technical-visit-audio-notes-actions";
import {
  fileExtensionForAudioMime,
  TECHNICAL_VISIT_AUDIO_MAX_DURATION_SECONDS,
} from "@/features/technical-visits/lib/technical-visit-audio-notes-shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  visitId: string;
  disabled?: boolean;
  onFinished?: () => void;
};

function pickMimeType(): { mime: string; fileExtension: string } {
  if (typeof MediaRecorder === "undefined") {
    return { mime: "audio/webm", fileExtension: "webm" };
  }
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return { mime: "audio/webm;codecs=opus", fileExtension: "webm" };
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return { mime: "audio/webm", fileExtension: "webm" };
  }
  return { mime: "audio/webm", fileExtension: "webm" };
}

function formatTimer(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function TechnicalVisitAudioRecorder({ visitId, disabled = false, onFinished }: Props) {
  const [phase, setPhase] = useState<"idle" | "recording" | "preview" | "uploading">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedMime, setRecordedMime] = useState<string>("audio/webm");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  const stopRecordingInternal = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      return;
    }
    stopTick();
    mr.onstop = () => {
      const mime = mr.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];
      cleanupStream();
      setRecordedBlob(blob);
      setRecordedMime(mime);
      setPhase("preview");
    };
    mr.stop();
  }, [cleanupStream, stopTick]);

  useEffect(() => {
    return () => {
      stopTick();
      cleanupStream();
    };
  }, [cleanupStream, stopTick]);

  useEffect(() => {
    if (phase !== "recording") return;
    if (seconds < TECHNICAL_VISIT_AUDIO_MAX_DURATION_SECONDS) return;
    stopRecordingInternal();
  }, [phase, seconds, stopRecordingInternal]);

  const startRecording = async () => {
    setError(null);
    if (disabled || typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Enregistrement audio indisponible sur cet appareil.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const { mime } = pickMimeType();
      const mr = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };
      mr.onerror = () => {
        setError("Erreur pendant l’enregistrement.");
        cleanupStream();
        stopTick();
        setPhase("idle");
      };
      mr.start(250);
      mediaRecorderRef.current = mr;
      setRecordedMime(mr.mimeType || mime);
      setSeconds(0);
      setPhase("recording");
      stopTick();
      tickRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setError("Micro refusé ou inaccessible. Autorisez le micro dans le navigateur.");
    }
  };

  const stopRecording = () => {
    if (phase !== "recording") return;
    stopRecordingInternal();
  };

  const discard = () => {
    setRecordedBlob(null);
    setSeconds(0);
    setPhase("idle");
    setError(null);
  };

  const send = async () => {
    if (!recordedBlob || phase !== "preview") return;
    setPhase("uploading");
    setError(null);
    const type = recordedBlob.type || recordedMime || "audio/webm";
    const ext = fileExtensionForAudioMime(type).replace(/^\./, "");
    const file = new File([recordedBlob], `note-terrain.${ext}`, { type });
    const fd = new FormData();
    fd.set("visitId", visitId);
    fd.set("audio", file);
    fd.set("durationSeconds", String(seconds));
    const res = await uploadTechnicalVisitAudioNoteAction(fd);
    if (!res.ok) {
      toast.error(res.error);
      setError(res.error);
      setPhase("preview");
      return;
    }
    toast.success("Note vocale enregistrée.");
    discard();
    onFinished?.();
  };

  const blocked = disabled;

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border/80 bg-muted/20 p-4">
      <div className="flex flex-wrap items-center gap-3">
        {phase === "idle" ? (
          <Button
            type="button"
            size="lg"
            className={cn("min-h-12 flex-1 gap-2 font-semibold sm:flex-none")}
            disabled={blocked}
            onClick={() => void startRecording()}
          >
            <Mic className="h-5 w-5 shrink-0" aria-hidden />
            Enregistrer
          </Button>
        ) : null}

        {phase === "recording" ? (
          <>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="min-h-12 flex-1 gap-2 font-semibold sm:flex-none"
              onClick={stopRecording}
            >
              <Square className="h-4 w-4 shrink-0 fill-current" aria-hidden />
              Arrêter
            </Button>
            <span className="tabular-nums text-lg font-semibold text-foreground">{formatTimer(seconds)}</span>
            <span className="text-sm text-muted-foreground">max {TECHNICAL_VISIT_AUDIO_MAX_DURATION_SECONDS / 60} min</span>
          </>
        ) : null}

        {phase === "preview" ? (
          <>
            <Button
              type="button"
              size="lg"
              className="min-h-12 flex-1 gap-2 font-semibold sm:flex-none"
              disabled={blocked}
              onClick={() => void send()}
            >
              Envoyer ({formatTimer(seconds)})
            </Button>
            <Button type="button" variant="outline" size="lg" className="min-h-12" onClick={discard}>
              Effacer
            </Button>
          </>
        ) : null}

        {phase === "uploading" ? (
          <div className="flex min-h-12 items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Envoi et transcription en cours…
          </div>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">
        Dictée rapide (WebM/Opus). Le traitement est fait sur nos serveurs ; ne quittez pas la page pendant l’envoi.
      </p>
    </div>
  );
}
