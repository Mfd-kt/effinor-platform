import type { StudyPdfViewModel } from "../domain/types";
import { renderAccordByTemplateKey } from "./study-pdf-registry";

export function renderAccordHtml(vm: StudyPdfViewModel): string {
  return renderAccordByTemplateKey(vm);
}
