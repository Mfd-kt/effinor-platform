import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_TYPE_LABELS,
} from "@/features/tasks/constants";
import type { TaskWithPeople } from "@/features/tasks/types";
import type { TaskPriority, TaskType } from "@/features/tasks/types";
import { formatDateFr } from "@/lib/format";

function priorityVariant(p: string): "default" | "secondary" | "destructive" | "outline" {
  if (p === "urgent") return "destructive";
  if (p === "high") return "default";
  if (p === "low") return "outline";
  return "secondary";
}

export function TasksList({ tasks }: { tasks: TaskWithPeople[] }) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        Aucune tâche pour l’instant.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Tâche</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Assigné à</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Priorité</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Échéance</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Statut</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Créée le</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => (
            <TableRow key={t.id} className="hover:bg-muted/40">
              <TableCell className="max-w-[280px]">
                <div className="font-medium text-foreground">{t.title}</div>
                {t.description ? (
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</div>
                ) : null}
                {t.related_entity_type === "lead" && t.related_entity_id ? (
                  <div className="mt-1.5">
                    <Link
                      href={`/leads/${t.related_entity_id}`}
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Voir la fiche prospect
                    </Link>
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {t.assignee ? (
                  <span>{t.assignee.full_name?.trim() || t.assignee.email}</span>
                ) : (
                  <span>—</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {TASK_TYPE_LABELS[t.task_type as TaskType] ?? t.task_type}
              </TableCell>
              <TableCell>
                <Badge variant={priorityVariant(t.priority)} className="text-[10px]">
                  {TASK_PRIORITY_LABELS[t.priority as TaskPriority] ?? t.priority}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {t.due_date ? formatDateFr(t.due_date) : "—"}
              </TableCell>
              <TableCell className="text-sm">{TASK_STATUS_LABELS[t.status] ?? t.status}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {formatDateFr(t.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
