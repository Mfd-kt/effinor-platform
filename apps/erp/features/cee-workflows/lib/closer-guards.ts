export function canMarkAgreementAsSigned(input: {
  workflowStatus: string;
  agreementSentAt?: string | null;
}): boolean {
  return input.workflowStatus === "agreement_sent" || Boolean(input.agreementSentAt);
}

export function hasCommercialDocuments(input: {
  presentationUrl?: string | null;
  agreementUrl?: string | null;
}): boolean {
  return Boolean(input.presentationUrl) && Boolean(input.agreementUrl);
}
