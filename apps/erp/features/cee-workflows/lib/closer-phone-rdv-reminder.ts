/** Niveau d’alerte pour le RDV téléphone (rappel) sur la file closer. */
export type PhoneRdvReminderLevel = "none" | "upcoming" | "soon" | "imminent" | "overdue";

const MS_15M = 15 * 60 * 1000;
const MS_1H = 60 * 60 * 1000;
const MS_24H = 24 * 60 * 60 * 1000;

export function phoneRdvReminderLevel(iso: string | null, nowMs: number): PhoneRdvReminderLevel {
  if (!iso) return "none";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "none";
  if (t < nowMs) return "overdue";
  const delta = t - nowMs;
  if (delta <= MS_15M) return "imminent";
  if (delta <= MS_1H) return "soon";
  if (delta <= MS_24H) return "upcoming";
  return "none";
}

export function phoneRdvReminderLabelFr(level: PhoneRdvReminderLevel): string | null {
  switch (level) {
    case "overdue":
      return "En retard";
    case "imminent":
      return "Imminent";
    case "soon":
      return "Bientôt";
    case "upcoming":
      return "Aujourd’hui";
    default:
      return null;
  }
}
