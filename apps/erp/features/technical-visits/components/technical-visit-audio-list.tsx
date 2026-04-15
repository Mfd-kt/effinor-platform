"use client";

import type { TechnicalVisitAudioNoteRow } from "@/features/technical-visits/queries/get-technical-visit-audio-notes";

import { TechnicalVisitAudioItem } from "./technical-visit-audio-item";

type Props = {
  notes: TechnicalVisitAudioNoteRow[];
  readOnly: boolean;
  onInsert: (text: string) => void;
};

export function TechnicalVisitAudioList({ notes, readOnly, onInsert }: Props) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune note vocale pour cette visite. Utilisez l’enregistreur ci-dessus après le démarrage terrain.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {notes.map((note) => (
        <li key={note.id}>
          <TechnicalVisitAudioItem note={note} readOnly={readOnly} onInsert={onInsert} />
        </li>
      ))}
    </ul>
  );
}
