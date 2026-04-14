import type { StudyPdfViewModel } from "../domain/types";
import { renderPresentationDocument } from "./presentation-document";

/** Gabarit présentation pompe à chaleur air / eau. */
export function renderPresentationPacV1(vm: StudyPdfViewModel): string {
  return renderPresentationDocument(vm, "pac");
}
