import type { StudyPdfViewModel } from "../domain/types";
import { renderPresentationDocument } from "./presentation-document";

/** Gabarit présentation déstratificateur (contenu inchangé vs historique `!isPac`). */
export function renderPresentationDestratV1(vm: StudyPdfViewModel): string {
  return renderPresentationDocument(vm, "destrat");
}
