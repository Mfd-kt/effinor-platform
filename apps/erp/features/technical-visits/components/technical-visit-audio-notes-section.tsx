"use client";

import { useRouter } from "next/navigation";

import type { TechnicalVisitAudioNoteRow } from "@/features/technical-visits/queries/get-technical-visit-audio-notes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { TechnicalVisitAudioList } from "./technical-visit-audio-list";
import { TechnicalVisitAudioRecorder } from "./technical-visit-audio-recorder";

type Props = {
  visitId: string;
  readOnly: boolean;
  initialNotes: TechnicalVisitAudioNoteRow[];
  onInsertDictation: (text: string) => void;
};

export function TechnicalVisitAudioNotesSection({
  visitId,
  readOnly,
  initialNotes,
  onInsertDictation,
}: Props) {
  const router = useRouter();

  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-1 pb-3 md:pb-3">
        <CardTitle className="text-lg font-semibold tracking-tight md:text-base">Notes vocales</CardTitle>
        <CardDescription>
          Dictée terrain : enregistrement après le démarrage de la visite, transcription automatique, relecture et
          insertion dans le compte-rendu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!readOnly ? (
          <TechnicalVisitAudioRecorder visitId={visitId} disabled={readOnly} onFinished={() => router.refresh()} />
        ) : (
          <p className="text-sm text-muted-foreground">La fiche est en lecture seule : pas de nouvel enregistrement.</p>
        )}
        <TechnicalVisitAudioList notes={initialNotes} readOnly={readOnly} onInsert={onInsertDictation} />
      </CardContent>
    </Card>
  );
}
