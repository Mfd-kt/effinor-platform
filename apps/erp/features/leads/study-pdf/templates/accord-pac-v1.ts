import type { StudyPdfViewModel } from "../domain/types";
import { renderAccordDocument } from "./accord-document";

export function renderAccordPacV1(vm: StudyPdfViewModel): string {
  return renderAccordDocument(vm, "pac");
}
