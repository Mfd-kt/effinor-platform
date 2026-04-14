"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTaskAction } from "@/features/tasks/actions/create-task";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_VALUES,
  TASK_TYPE_LABELS,
  TASK_TYPE_VALUES,
} from "@/features/tasks/constants";
import type { ProfileOption } from "@/features/leads/queries/get-lead-form-options";

type LeadOption = { id: string; label: string };

const EMPTY_LEAD = "__none__";

export function TaskCreateForm({
  assignees,
  leads,
}: {
  assignees: ProfileOption[];
  leads: LeadOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<string>(TASK_TYPE_VALUES[0]);
  const [priority, setPriority] = useState<string>("normal");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [leadId, setLeadId] = useState<string>(EMPTY_LEAD);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await createTaskAction({
        title,
        description,
        task_type: taskType,
        priority,
        due_date: dueDate,
        assigned_user_id: assigneeId,
        related_lead_id: leadId === EMPTY_LEAD ? "" : leadId,
      });
      if (!result.ok) {
        setFeedback({ type: "err", text: result.message });
        return;
      }
      setFeedback({ type: "ok", text: "Tâche créée et assignée." });
      setTitle("");
      setDescription("");
      setTaskType(TASK_TYPE_VALUES[0]);
      setPriority("normal");
      setDueDate("");
      setAssigneeId("");
      setLeadId(EMPTY_LEAD);
      router.refresh();
    });
  }

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Nouvelle tâche</CardTitle>
        <CardDescription>
          Assignez une action à un collaborateur (équipe commerciale et support). Optionnel : lier une fiche
          prospect.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-title">Titre *</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. Relancer le devis — société X"
                required
                maxLength={500}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-desc">Description</Label>
              <Textarea
                id="task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détails, contexte, lien interne…"
                rows={3}
                className="min-h-[80px] resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={taskType} onValueChange={(v) => setTaskType(v ?? TASK_TYPE_VALUES[0])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPE_VALUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {TASK_TYPE_LABELS[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v ?? "normal")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITY_VALUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {TASK_PRIORITY_LABELS[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Échéance</Label>
              <Input
                id="task-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assigné à *</Label>
              <Select value={assigneeId || undefined} onValueChange={(v) => setAssigneeId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir un membre" />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Fiche prospect (optionnel)</Label>
              <Select value={leadId} onValueChange={(v) => setLeadId(v ?? EMPTY_LEAD)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Aucun rattachement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_LEAD}>Aucun rattachement</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {feedback ? (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                feedback.type === "ok"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                  : "border-destructive/40 bg-destructive/10 text-destructive"
              }`}
            >
              {feedback.text}
            </div>
          ) : null}

          <Button type="submit" disabled={isPending || !assigneeId}>
            {isPending ? "Création…" : "Créer la tâche"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
