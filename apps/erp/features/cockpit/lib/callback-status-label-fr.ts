/** Libellés courts pour le cockpit (statuts rappels). */
export function commercialCallbackStatusLabelFr(status: string): string {
  const s = status.trim();
  switch (s) {
    case "pending":
      return "En attente";
    case "due_today":
      return "Aujourd’hui";
    case "overdue":
      return "En retard";
    case "rescheduled":
      return "Replanifié";
    case "in_progress":
      return "En cours";
    case "no_answer":
      return "Sans réponse";
    case "cold_followup":
      return "Relance froide";
    case "converted_to_lead":
      return "Converti";
    case "cancelled":
      return "Annulé";
    case "completed":
      return "Terminé";
    default:
      return s || "—";
  }
}
