export type TaskType =
  | "call"
  | "email"
  | "visit"
  | "admin"
  | "follow_up"
  | "technical"
  | "other";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export type TaskStatus = "open" | "in_progress" | "done" | "cancelled";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  assigned_user_id: string | null;
  created_by_user_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskWithPeople = TaskRow & {
  assignee: { id: string; full_name: string | null; email: string } | null;
  creator: { id: string; full_name: string | null; email: string } | null;
};
