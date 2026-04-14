import type { StudyPdfViewModel } from "../domain/types";
import { renderPresentationByTemplateKey } from "./study-pdf-registry";

export function renderPresentationHtml(vm: StudyPdfViewModel): string {
  return renderPresentationByTemplateKey(vm);
}
