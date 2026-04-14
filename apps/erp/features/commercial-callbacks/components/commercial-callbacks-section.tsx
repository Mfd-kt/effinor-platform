"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Headset } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommercialCallbackAgentRow } from "@/features/commercial-callbacks/components/commercial-callback-agent-row";
import { CommercialCallbackCallDialog } from "@/features/commercial-callbacks/components/commercial-callback-call-dialog";
import { CommercialCallbacksKpiStrip } from "@/features/commercial-callbacks/components/commercial-callbacks-kpi-strip";
import {
  partitionAgentCallbackViews,
  type AgentCallbackTabKey,
} from "@/features/commercial-callbacks/domain/callback-buckets";
import type {
  CallbackPerformanceStats,
  CommercialCallbackKpis,
} from "@/features/commercial-callbacks/queries/get-commercial-callbacks-for-agent";
import type { CommercialCallbackRow } from "@/features/commercial-callbacks/types";
import { cn } from "@/lib/utils";

type CommercialCallbacksSectionProps = {
  rows: CommercialCallbackRow[];
  kpis: CommercialCallbackKpis;
  performance: CallbackPerformanceStats;
  onOpenNew: () => void;
  onEdit: (row: CommercialCallbackRow) => void;
  /** id utilisateur → nom affiché (vue direction). */
  assignedAgentLabels?: Record<string, string>;
  /** Affiche libellé agent + bouton supprimer (direction). */
  directorTeamMode?: boolean;
};

const PRIMARY_TABS: { key: AgentCallbackTabKey; label: string; description?: string }[] = [
  {
    key: "due_now",
    label: "À faire maintenant",
    description: "Créneau urgent ou jour J sans friction.",
  },
  {
    key: "today",
    label: "Aujourd’hui",
    description: "Même jour, appel plus tard dans la journée.",
  },
  {
    key: "overdue",
    label: "En retard",
    description: "Date de rappel déjà dépassée (jours passés).",
  },
  {
    key: "upcoming",
    label: "À venir",
    description: "Échéances futures.",
  },
];

function SectionBlock({
  title,
  description,
  variant,
  children,
}: {
  title: string;
  description?: string;
  variant: "critical" | "important" | "neutral";
  children: ReactNode;
}) {
  const bar =
    variant === "critical"
      ? "bg-red-500"
      : variant === "important"
        ? "bg-orange-500"
        : "bg-emerald-600";
  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className={`mb-2 h-1 w-12 rounded-full ${bar}`} />
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

export function CommercialCallbacksSection({
  rows,
  kpis,
  performance,
  onOpenNew,
  onEdit,
  assignedAgentLabels,
  directorTeamMode = false,
}: CommercialCallbacksSectionProps) {
  const router = useRouter();
  const [callRow, setCallRow] = useState<CommercialCallbackRow | null>(null);
  const [tab, setTab] = useState<AgentCallbackTabKey>("due_now");
  const views = partitionAgentCallbackViews(rows);

  function refresh() {
    router.refresh();
  }

  const activeRows =
    tab === "archive"
      ? views.archive
      : views[tab as Exclude<AgentCallbackTabKey, "archive">];

  const emptyMessage =
    tab === "due_now"
      ? "Aucun rappel urgent pour l’instant."
      : tab === "today"
        ? "Rien de prévu plus tard aujourd’hui."
        : tab === "overdue"
          ? "Aucun rappel en retard sur des jours passés."
          : tab === "upcoming"
            ? "Aucune échéance future."
            : "Aucun rappel terminé ou clôturé dans cette liste.";

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Rappels commerciaux</h2>
        <p className="text-sm text-muted-foreground">
          {directorTeamMode
            ? "Vue équipe : tous les agents avec rappels actifs — vous pouvez retirer un rappel de la liste (suppression logique)."
            : "Exécution priorisée (score) — onglets pour cadrer la journée sans oublier le retard."}
        </p>
      </div>

      <CommercialCallbacksKpiStrip kpis={kpis} performance={performance} />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          <Headset className="mx-auto mb-2 size-8 opacity-50" />
          <p>Aucun rappel pour l’instant.</p>
          {!directorTeamMode ? (
            <Button type="button" className="mt-4" size="sm" onClick={onOpenNew}>
              Créer un rappel
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {PRIMARY_TABS.map((t) => (
                <Button
                  key={t.key}
                  type="button"
                  size="sm"
                  variant={tab === t.key ? "secondary" : "ghost"}
                  className={cn("h-8 rounded-full", tab === t.key && "ring-1 ring-border")}
                  onClick={() => setTab(t.key)}
                >
                  {t.label}
                  <span className="ml-1.5 tabular-nums text-muted-foreground">
                    ({views[t.key].length})
                  </span>
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={tab === "archive" ? "secondary" : "ghost"}
                className={cn("h-8 rounded-full", tab === "archive" && "ring-1 ring-border")}
                onClick={() => setTab("archive")}
              >
                Terminés / archivés
                <span className="ml-1.5 tabular-nums text-muted-foreground">
                  ({views.archive.length})
                </span>
              </Button>
            </div>
            {tab !== "archive" ? (
              <p className="text-xs text-muted-foreground">
                {PRIMARY_TABS.find((x) => x.key === tab)?.description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Effectués, annulés, convertis en lead — consultation seule.
              </p>
            )}
          </div>

          <SectionBlock
            title={
              tab === "due_now"
                ? "À faire maintenant"
                : tab === "today"
                  ? "Aujourd’hui (plus tard)"
                  : tab === "overdue"
                    ? "En retard"
                    : tab === "upcoming"
                      ? "À venir"
                      : "Terminés / archivés"
            }
            variant={
              tab === "overdue" || tab === "due_now"
                ? "critical"
                : tab === "today"
                  ? "important"
                  : "neutral"
            }
          >
            {activeRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            ) : (
              activeRows.map((row) => (
                <CommercialCallbackAgentRow
                  key={row.id}
                  row={row}
                  onEdit={onEdit}
                  onOpenCall={(r) => setCallRow(r)}
                  assignedAgentLabel={
                    directorTeamMode
                      ? row.assigned_agent_user_id
                        ? (assignedAgentLabels?.[row.assigned_agent_user_id] ?? "Agent inconnu")
                        : "Non assigné"
                      : null
                  }
                  allowDirectorDelete={directorTeamMode}
                />
              ))
            )}
          </SectionBlock>
        </div>
      )}

      <CommercialCallbackCallDialog
        row={callRow}
        open={callRow != null}
        onOpenChange={(o) => {
          if (!o) setCallRow(null);
        }}
        onDone={refresh}
      />
    </div>
  );
}
