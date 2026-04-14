export type ConfirmateurHandoffValidation = {
  dossier_complet: boolean;
  coherence_simulation: boolean;
  technical_feasibility: boolean;
};

/** La génération présentation / accord est assurée par le closer après transmission. */
export function canTransmitToCloser(input: ConfirmateurHandoffValidation): boolean {
  return (
    input.dossier_complet === true &&
    input.coherence_simulation === true &&
    input.technical_feasibility === true
  );
}
