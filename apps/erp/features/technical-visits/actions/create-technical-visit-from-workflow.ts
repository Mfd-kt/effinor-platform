"use server";

// TODO: cee-workflows retiré — la création d'une visite technique « dynamique » dépendait
// du module workflow CEE et des templates rattachés à une fiche CEE. La signature est
// conservée pour ne pas casser les appelants ; le corps est neutralisé.

export type CreateTechnicalVisitFromWorkflowResult =
  | { ok: true; technicalVisitId: string; warnings?: string[] }
  | { ok: false; message: string; existingTechnicalVisitId?: string };

export async function createTechnicalVisitFromWorkflow(
  _input: unknown,
): Promise<CreateTechnicalVisitFromWorkflowResult> {
  return {
    ok: false,
    message:
      "La création de visite technique depuis un workflow CEE est temporairement indisponible (module workflow en refonte).",
  };
}
