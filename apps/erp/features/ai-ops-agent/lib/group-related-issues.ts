import type { AiOpsDetectedIssue, AiOpsIssueType } from "../ai-ops-types";
import { mergePriorities, mergeSeverities, computeAiOpsPriority, computeAiOpsSeverity } from "./ai-ops-priority";

const BATCHABLE = [
  "overdue_callback",
  "badly_handled_lead",
  "stalled_workflow",
  "missing_fields",
] as const satisfies readonly AiOpsIssueType[];

const MIN_BATCH = 2;

function batchTypeFor(base: AiOpsIssueType): AiOpsDetectedIssue["issueType"] {
  switch (base) {
    case "overdue_callback":
      return "batch_overdue_callback";
    case "badly_handled_lead":
      return "batch_badly_handled_lead";
    case "stalled_workflow":
      return "batch_stalled_workflow";
    case "missing_fields":
      return "batch_missing_fields";
    default:
      return base;
  }
}

function buildBatchBody(base: AiOpsIssueType, items: AiOpsDetectedIssue[]): string {
  const n = items.length;
  switch (base) {
    case "overdue_callback":
      return `${n} rappels commerciaux nécessitent ton attention (retard ou échéance du jour). Ouvre la liste des rappels et traite les plus urgents en priorité.`;
    case "badly_handled_lead":
      return `${n} leads sur ton périmètre attendent une action (nouveau sans suite ou simulateur sans relance).`;
    case "stalled_workflow":
      return `${n} dossiers n’ont pas d’agent assigné alors qu’une équipe est disponible — répartis ou prends le dossier.`;
    case "missing_fields":
      return `${n} fiches lead ont des informations incomplètes (coordonnées / siège) — complète-les pour fluidifier la suite.`;
    default:
      return `${n} points nécessitent ton attention.`;
  }
}

function buildBatchTopic(base: AiOpsIssueType, n: number): string {
  switch (base) {
    case "overdue_callback":
      return n > 1 ? `Rappels : ${n} à traiter` : "Rappel à traiter";
    case "badly_handled_lead":
      return n > 1 ? `Leads : ${n} en attente` : "Lead en attente";
    case "stalled_workflow":
      return n > 1 ? `Dossiers sans agent : ${n}` : "Dossier sans agent";
    case "missing_fields":
      return n > 1 ? `Fiches incomplètes : ${n}` : "Fiche incomplète";
    default:
      return "Points à traiter";
  }
}

/**
 * Regroupe les issues unitaires par utilisateur et type pour réduire le bruit.
 */
export function groupRelatedIssuesForUser(issues: AiOpsDetectedIssue[]): AiOpsDetectedIssue[] {
  const passthrough: AiOpsDetectedIssue[] = [];
  const buckets = new Map<string, AiOpsDetectedIssue[]>();

  for (const issue of issues) {
    if (!(BATCHABLE as readonly string[]).includes(issue.issueType)) {
      passthrough.push(issue);
      continue;
    }
    const k = `${issue.targetUserId}:${issue.issueType}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(issue);
  }

  const merged: AiOpsDetectedIssue[] = [];
  for (const [, items] of buckets) {
    if (items.length < MIN_BATCH) {
      merged.push(...items);
      continue;
    }
    const base = items[0].issueType as (typeof BATCHABLE)[number];
    let priority = items[0].priority;
    let severity = computeAiOpsSeverity(items[0]);
    const related = items
      .map((i) => ({
        type: i.entityType ?? base.replace(/_/g, " "),
        id: i.entityId ?? "",
      }))
      .filter((r) => r.id);

    for (let i = 1; i < items.length; i++) {
      priority = mergePriorities(priority, computeAiOpsPriority(items[i]));
      severity = mergeSeverities(severity, computeAiOpsSeverity(items[i]));
    }

    const batchIssue: AiOpsDetectedIssue = {
      targetUserId: items[0].targetUserId,
      roleTarget: items[0].roleTarget,
      issueType: batchTypeFor(base),
      dedupeKey: `batch:${base}:${items[0].targetUserId}`,
      topic: buildBatchTopic(base, items.length),
      priority,
      severity,
      messageType: "alert",
      body: buildBatchBody(base, items),
      requiresAction: true,
      actionType: base === "overdue_callback" ? "open_callback" : "open_lead",
      actionPayload:
        base === "overdue_callback"
          ? { href: "/commercial-callbacks", grouped: true }
          : { href: "/leads", grouped: true },
      entityType: null,
      entityId: null,
      metadataJson: {
        grouped: true,
        grouped_from: base,
        related_entities: related,
        grouped_count: items.length,
      },
      estimatedValueEur: Math.max(...items.map((i) => i.estimatedValueEur ?? 0), 0),
    };
    merged.push(batchIssue);
  }

  return [...passthrough, ...merged];
}
