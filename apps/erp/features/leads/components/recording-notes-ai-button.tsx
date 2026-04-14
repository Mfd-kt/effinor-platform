"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { generateRecordingNotesFromLeadAction } from "@/features/leads/actions/generate-recording-notes";

import type { LeadInsertInput } from "@/features/leads/schemas/lead.schema";

type RecordingNotesAiButtonProps = {
  leadId: string;
  recordingUrls: string[];
  onAnalysisComplete: (payload: { notes: string; fill: Partial<LeadInsertInput> }) => void;
};

export function RecordingNotesAiButton({
  leadId,
  recordingUrls,
  onAnalysisComplete,
}: RecordingNotesAiButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAudioFiles = recordingUrls.length > 0;

  async function onClick() {
    setError(null);
    setLoading(true);
    const result = await generateRecordingNotesFromLeadAction({ leadId, recordingUrls });
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onAnalysisComplete({ notes: result.notes, fill: result.fill });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!hasAudioFiles || loading}
        onClick={() => void onClick()}
        className="shrink-0 gap-1.5"
      >
        <Sparkles className="size-3.5" aria-hidden />
        {loading ? "Analyse en cours…" : "Rédiger la note depuis l’audio (IA)"}
      </Button>
      {error ? <p className="max-w-xs text-right text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
