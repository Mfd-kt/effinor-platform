/**
 * Matrice « Rôles et permissions » : trois domaines métier (le reste est géré par les rôles internes ou hors matrice).
 * Colonnes = Accès écran (perm.access.*), Tout le périmètre (scope_all), Créateur / restreint (scope_* + historiques).
 */
export type PermissionMatrixRowDef = {
  id: string;
  label: string;
  accessCode: string | null;
  scopeAllCode: string;
  creatorCodes: readonly string[];
};

export const PERMISSION_MATRIX_ROWS: readonly PermissionMatrixRowDef[] = [
  {
    id: "leads",
    label: "Leads",
    accessCode: null,
    scopeAllCode: "perm.leads.scope_all",
    creatorCodes: ["perm.leads.scope_creator", "perm.leads.scope_creator_agent"],
  },
  {
    id: "technical_visits",
    label: "Visites techniques",
    accessCode: "perm.access.technical_visits",
    scopeAllCode: "perm.technical_visits.scope_all",
    creatorCodes: ["perm.technical_visits.scope_creator", "perm.technical_visits.creator_only"],
  },
  {
    id: "installations",
    label: "Installations",
    accessCode: "perm.access.installations",
    scopeAllCode: "perm.installations.scope_all",
    creatorCodes: ["perm.installations.scope_creator"],
  },
];

export function allMatrixPermissionCodes(): Set<string> {
  const s = new Set<string>();
  for (const row of PERMISSION_MATRIX_ROWS) {
    if (row.accessCode) {
      s.add(row.accessCode);
    }
    s.add(row.scopeAllCode);
    for (const c of row.creatorCodes) {
      s.add(c);
    }
  }
  return s;
}

export const MATRIX_PERMISSION_CODE_SET = allMatrixPermissionCodes();
