import type { VariantProps } from "class-variance-authority";

import type { badgeVariants } from "@/components/ui/badge";

export const CALLBACK_STATUSES = [
  "pending",
  "due_today",
  "overdue",
  "in_progress",
  "completed",
  "no_answer",
  "rescheduled",
  "cancelled",
  "converted_to_lead",
  "cold_followup",
  "lost",
] as const;

export type CallbackStatus = (typeof CALLBACK_STATUSES)[number];

export const CALLBACK_STATUS_LABELS: Record<CallbackStatus, string> = {
  pending: "À rappeler",
  due_today: "Aujourd’hui",
  overdue: "En retard",
  in_progress: "En appel",
  completed: "Effectué",
  no_answer: "Sans réponse",
  rescheduled: "Reporté",
  cancelled: "Annulé",
  converted_to_lead: "Converti lead",
  cold_followup: "Relance froide",
  lost: "Perdu",
};

export const CALLBACK_PRIORITIES = ["low", "normal", "high", "critical"] as const;
export type CallbackPriority = (typeof CALLBACK_PRIORITIES)[number];

export const CALLBACK_PRIORITY_LABELS: Record<CallbackPriority, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  critical: "Critique",
};

export const PROSPECT_TEMPERATURES = ["hot", "warm", "cold"] as const;
export type ProspectTemperature = (typeof PROSPECT_TEMPERATURES)[number];

export const PROSPECT_TEMPERATURE_LABELS: Record<ProspectTemperature, string> = {
  hot: "Chaud",
  warm: "Tiède",
  cold: "Froid",
};

export const CALLBACK_TIME_WINDOWS = ["morning", "afternoon", "end_of_day", "no_preference"] as const;
export type CallbackTimeWindow = (typeof CALLBACK_TIME_WINDOWS)[number];

export const CALLBACK_TIME_WINDOW_LABELS: Record<CallbackTimeWindow, string> = {
  morning: "Matin",
  afternoon: "Après-midi",
  end_of_day: "Fin de journée",
  no_preference: "Sans préférence",
};

export function callbackStatusBadgeVariant(
  status: string,
): NonNullable<VariantProps<typeof badgeVariants>["variant"]> {
  switch (status) {
    case "pending":
      return "default";
    case "in_progress":
      return "default";
    case "rescheduled":
      return "secondary";
    case "completed":
    case "converted_to_lead":
      return "outline";
    case "no_answer":
      return "destructive";
    case "cold_followup":
      return "secondary";
    case "cancelled":
    case "lost":
      return "secondary";
    default:
      return "outline";
  }
}

export function callbackPriorityBadgeVariant(
  priority: string,
): NonNullable<VariantProps<typeof badgeVariants>["variant"]> {
  switch (priority) {
    case "critical":
    case "high":
      return "destructive";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
}
