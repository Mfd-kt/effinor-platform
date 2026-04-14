"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRealtimeRows } from "@/lib/supabase/use-realtime";
import {
  summarizeAdminCeeNetwork,
  type AdminCeeNetworkMember,
  type AdminCeeNetworkSheet,
  type AdminCeeNetworkTeam,
  type AdminCeeNetworkWorkflow,
} from "@/features/cee-workflows/lib/admin-cee-network";

export function CeeNetworkOverview({
  initial,
}: {
  initial: {
    sheets: AdminCeeNetworkSheet[];
    teams: AdminCeeNetworkTeam[];
    members: AdminCeeNetworkMember[];
    workflows: AdminCeeNetworkWorkflow[];
  };
}) {
  const { rows: workflowRows } = useRealtimeRows<AdminCeeNetworkWorkflow & { id: string }>({
    table: "lead_sheet_workflows",
    initialData: initial.workflows as (AdminCeeNetworkWorkflow & { id: string })[],
  });
  const { rows: teamRows } = useRealtimeRows<AdminCeeNetworkTeam & { id: string }>({
    table: "cee_sheet_teams",
    initialData: initial.teams as (AdminCeeNetworkTeam & { id: string })[],
  });
  const { rows: memberRows } = useRealtimeRows<AdminCeeNetworkMember & { id: string }>({
    table: "cee_sheet_team_members",
    initialData: initial.members as (AdminCeeNetworkMember & { id: string })[],
  });
  const { rows: sheetRows } = useRealtimeRows<AdminCeeNetworkSheet & { id: string }>({
    table: "cee_sheets",
    initialData: initial.sheets as (AdminCeeNetworkSheet & { id: string })[],
  });

  const summary = summarizeAdminCeeNetwork({
    sheets: sheetRows,
    teams: teamRows,
    members: memberRows,
    workflows: workflowRows,
  });

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader>
        <CardTitle>Vue réseau CEE</CardTitle>
        <CardDescription>
          Vision temps réel fiche CEE {"->"} équipe {"->"} rôles {"->"} charge workflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-5">
          <MetricCard label="Fiches" value={String(summary.totals.sheets)} />
          <MetricCard label="Fiches actives" value={String(summary.totals.activeSheets)} />
          <MetricCard label="Équipes" value={String(summary.totals.teams)} />
          <MetricCard label="Membres" value={String(summary.totals.members)} />
          <MetricCard label="Workflows actifs" value={String(summary.totals.activeWorkflows)} />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {summary.bySheet.map((sheet) => (
            <div key={sheet.sheetId} className="rounded-xl border border-border/70 bg-card px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-medium text-foreground">{sheet.label}</div>
                <Badge variant="secondary">{sheet.code}</Badge>
                {sheet.simulatorKey ? <Badge variant="outline">{sheet.simulatorKey}</Badge> : null}
                <Badge variant={sheet.isCommercialActive ? "default" : "secondary"}>
                  {sheet.isCommercialActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border px-3 py-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Équipe</div>
                  <div className="mt-1 font-medium">{sheet.teamName ?? "Aucune équipe"}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="outline">Agents {sheet.roles.agent}</Badge>
                    <Badge variant="outline">Confirmateurs {sheet.roles.confirmateur}</Badge>
                    <Badge variant="outline">Closers {sheet.roles.closer}</Badge>
                    <Badge variant="outline">Managers {sheet.roles.manager}</Badge>
                  </div>
                </div>

                <div className="rounded-lg border px-3 py-3">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Pipeline</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <MiniStat label="Draft" value={sheet.workflowCounts.draft} />
                    <MiniStat label="À confirmer" value={sheet.workflowCounts.toConfirm} />
                    <MiniStat label="Qualifiés" value={sheet.workflowCounts.qualified} />
                    <MiniStat label="À closer" value={sheet.workflowCounts.toClose} />
                    <MiniStat label="Accords envoyés" value={sheet.workflowCounts.agreementSent} />
                    <MiniStat label="Signés" value={sheet.workflowCounts.signed} />
                    <MiniStat label="Perdus" value={sheet.workflowCounts.lost} />
                    <MiniStat label="Total" value={sheet.workflowCounts.total} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/40 px-2 py-1">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}
