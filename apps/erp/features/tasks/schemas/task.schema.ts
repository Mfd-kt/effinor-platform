import { z } from "zod";

import { TASK_PRIORITY_VALUES, TASK_TYPE_VALUES } from "@/features/tasks/constants";

export const CreateTaskSchema = z.object({
  title: z.string().trim().min(1, "Titre requis").max(500),
  description: z.string().max(8000).optional(),
  task_type: z.enum(TASK_TYPE_VALUES as unknown as [string, ...string[]]),
  priority: z.enum(TASK_PRIORITY_VALUES as unknown as [string, ...string[]]),
  due_date: z.string().optional(),
  assigned_user_id: z.string().uuid("Choisissez un membre à assigner"),
  related_lead_id: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
