export type GetTechnicalVisitFormOptionsParams = {
  /** Technicien déjà enregistré sur la VT (si hors rôle technicien → `technicianOrphanOption`). */
  visitTechnicianProfileId?: string | null;
  visitId?: string | null;
  targetScheduledAt?: string | null;
  targetTimeSlot?: string | null;
  targetWorksiteLatitude?: number | null;
  targetWorksiteLongitude?: number | null;
  targetWorksiteAddress?: string | null;
  targetWorksitePostalCode?: string | null;
  targetWorksiteCity?: string | null;
  targetWorksiteCountry?: string | null;
};
