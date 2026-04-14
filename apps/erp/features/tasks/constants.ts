import type { TaskPriority, TaskType } from "@/features/tasks/types";

export const TASK_TYPE_VALUES: readonly TaskType[] = [
  "call",
  "email",
  "visit",
  "admin",
  "follow_up",
  "technical",
  "other",
] as const;

export const TASK_PRIORITY_VALUES: readonly TaskPriority[] = ["low", "normal", "high", "urgent"] as const;

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  call: "Appel",
  email: "E-mail",
  visit: "Visite",
  admin: "Administratif",
  follow_up: "Relance",
  technical: "Technique",
  other: "Autre",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Basse",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  open: "Ouverte",
  in_progress: "En cours",
  done: "Terminée",
  cancelled: "Annulée",
};
