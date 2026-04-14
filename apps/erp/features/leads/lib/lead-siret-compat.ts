type LeadWritePayload = Record<string, unknown>;

export function isMissingSplitSiretColumnError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    message.includes("head_office_siret") ||
    message.includes("worksite_siret")
  );
}

export function stripSplitSiretColumns<T extends LeadWritePayload>(payload: T): Omit<T, "head_office_siret" | "worksite_siret"> {
  const next = { ...payload };
  delete next.head_office_siret;
  delete next.worksite_siret;
  return next;
}
