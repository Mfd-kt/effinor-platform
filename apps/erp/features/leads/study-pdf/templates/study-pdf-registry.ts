import type { StudyPdfViewModel } from "../domain/types";
import {
  STUDY_AGREEMENT_TEMPLATE_DESTRAT_V1,
  STUDY_AGREEMENT_TEMPLATE_PAC_V1,
  STUDY_PRESENTATION_TEMPLATE_DESTRAT_V1,
  STUDY_PRESENTATION_TEMPLATE_PAC_V1,
} from "../domain/study-template-keys";
import { renderAccordDocument } from "./accord-document";
import { renderPresentationDocument } from "./presentation-document";

const presentationRegistry: Record<string, (vm: StudyPdfViewModel) => string> = {
  [STUDY_PRESENTATION_TEMPLATE_DESTRAT_V1]: (vm) => renderPresentationDocument(vm, "destrat"),
  [STUDY_PRESENTATION_TEMPLATE_PAC_V1]: (vm) => renderPresentationDocument(vm, "pac"),
};

const agreementRegistry: Record<string, (vm: StudyPdfViewModel) => string> = {
  [STUDY_AGREEMENT_TEMPLATE_DESTRAT_V1]: (vm) => renderAccordDocument(vm, "destrat"),
  [STUDY_AGREEMENT_TEMPLATE_PAC_V1]: (vm) => renderAccordDocument(vm, "pac"),
};

export function renderPresentationByTemplateKey(vm: StudyPdfViewModel): string {
  const fn = presentationRegistry[vm.presentationTemplateKey];
  return (fn ?? presentationRegistry[STUDY_PRESENTATION_TEMPLATE_DESTRAT_V1])(vm);
}

export function renderAccordByTemplateKey(vm: StudyPdfViewModel): string {
  const fn = agreementRegistry[vm.agreementTemplateKey];
  return (fn ?? agreementRegistry[STUDY_AGREEMENT_TEMPLATE_DESTRAT_V1])(vm);
}
