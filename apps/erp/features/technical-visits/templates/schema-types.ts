/**
 * Types du moteur de templates visite technique.
 *
 * Convention : tout champ dont `mapToLegacyColumn` est renseigné sera recopié
 * dans la colonne legacy correspondante de `technical_visits` pendant la phase
 * de transition (double écriture form_answers_json ↔ colonnes).
 */

export type VisitFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "radio"
  | "boolean"
  | "photo"
  | "calculated";

export type VisitFieldOption = {
  value: string;
  label: string;
};

export type VisitFieldVisibilityRule = {
  /** ID du champ dont la valeur conditionne la visibilité. */
  field: string;
  /** Valeurs du champ déclencheur qui rendent ce champ visible. */
  values: (string | boolean)[];
};

export type VisitField = {
  id: string;
  type: VisitFieldType;
  label: string;
  required: boolean;
  order: number;
  /** Indice mobile : placeholder ou consigne courte de saisie. */
  hint?: string;
  options?: VisitFieldOption[];
  /** Pour `photo` : nombre minimum de fichiers. */
  min_files?: number;
  /** Pour `photo` : nombre maximum de fichiers. */
  max_files?: number;
  /** Pour `calculated` : expression (ids des champs opérandes). */
  formula?: string;
  /** Lecture seule côté UI (calculé ou repris du lead). */
  readonly?: boolean;
  /**
   * `false` = le champ n'accepte aucune saisie utilisateur (calculé ou système).
   * À recalculer côté client ET côté serveur. Distinct de `readonly` qui peut
   * s'appliquer à un champ pré-rempli mais potentiellement déverrouillable.
   */
  editable?: boolean;
  /** Conditions d'affichage (toutes doivent être satisfaites). */
  visibility_rules?: VisitFieldVisibilityRule[];
  /** Colonne legacy `technical_visits` vers laquelle recopier la valeur. */
  mapToLegacyColumn?: string;
  /** Unité d'affichage (m, m², kW…). */
  unit?: string;
};

export type VisitTemplateSection = {
  id: string;
  title: string;
  order: number;
  fields: VisitField[];
};

export type VisitTemplateSchema = {
  version: number;
  template_key: string;
  label: string;
  sections: VisitTemplateSection[];
};
