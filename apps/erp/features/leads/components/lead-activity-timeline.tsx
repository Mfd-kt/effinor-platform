import { GitBranch, Sparkles, UserPlus } from "lucide-react";

import { formatDateTimeFr } from "@/lib/format";
import type { LeadWorkflowActivityEventRow } from "@/features/leads/queries/get-lead-workflow-activity-events";
import { cn } from "@/lib/utils";

type MergedItem =
  | {
      kind: "lead_created";
      key: string;
      at: string;
      title: string;
      subtitle: string | null;
      sheetLine: null;
    }
  | {
      kind: "workflow";
      key: string;
      at: string;
      title: string;
      subtitle: string | null;
      sheetLine: string | null;
    };

function authorLine(profile: LeadWorkflowActivityEventRow["created_by_profile"]): string | null {
  if (!profile) return null;
  const name = profile.full_name?.trim();
  if (name) return name;
  const mail = profile.email?.trim();
  return mail || null;
}

function mergeItems(
  leadCreatedAt: string,
  leadCreatedByLabel: string | null,
  workflowLabelsById: Record<string, string>,
  events: LeadWorkflowActivityEventRow[],
): MergedItem[] {
  const rows: MergedItem[] = [
    {
      kind: "lead_created",
      key: "lead-created",
      at: leadCreatedAt,
      title: "Lead créé",
      subtitle: leadCreatedByLabel,
      sheetLine: null,
    },
    ...events.map((e) => ({
      kind: "workflow" as const,
      key: e.id,
      at: e.created_at,
      title: e.event_label,
      subtitle: authorLine(e.created_by_profile),
      sheetLine: workflowLabelsById[e.lead_sheet_workflow_id] ?? null,
    })),
  ];

  rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return rows;
}

type Props = {
  leadCreatedAt: string;
  leadCreatedByLabel: string | null;
  workflowLabelsById: Record<string, string>;
  events: LeadWorkflowActivityEventRow[];
  className?: string;
};

export function LeadActivityTimeline({
  leadCreatedAt,
  leadCreatedByLabel,
  workflowLabelsById,
  events,
  className,
}: Props) {
  const items = mergeItems(leadCreatedAt, leadCreatedByLabel, workflowLabelsById, events);

  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-card shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border/70 px-3 py-2.5">
        <h2 className="text-sm font-semibold leading-tight text-foreground">Activité</h2>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
          Création, statuts workflow et actions sur le dossier (comme un fil CRM).
        </p>
      </div>
      <div className="max-h-[min(52vh,28rem)] overflow-y-auto px-2 py-3 lg:max-h-[min(45vh,26rem)]">
        <ul className="relative space-y-0 pl-2">
          <li
            aria-hidden
            className="absolute bottom-2 left-[11px] top-2 w-px bg-border"
          />
          {items.map((item) => (
            <li key={item.key} className="relative flex gap-2.5 pb-4 pl-1 last:pb-0">
              <div
                className={cn(
                  "relative z-[1] mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background",
                  item.kind === "lead_created"
                    ? "border-sky-200 bg-sky-50 text-sky-700"
                    : "border-violet-200 bg-violet-50 text-violet-700",
                )}
              >
                {item.kind === "lead_created" ? (
                  <UserPlus className="size-3.5" />
                ) : (
                  <GitBranch className="size-3.5" />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[13px] font-medium leading-snug text-foreground">{item.title}</p>
                {item.kind === "workflow" && item.sheetLine ? (
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Sparkles className="size-3 shrink-0 opacity-70" />
                    <span className="truncate">{item.sheetLine}</span>
                  </p>
                ) : null}
                <p className="mt-1 text-[10px] text-muted-foreground">
                  <span className="tabular-nums">{formatDateTimeFr(item.at)}</span>
                  {item.subtitle ? (
                    <>
                      <span className="mx-1 opacity-40">·</span>
                      <span>{item.subtitle}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
