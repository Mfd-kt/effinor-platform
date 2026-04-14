"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ConfirmateurWorkflowDetail as ConfirmateurWorkflowDetailData } from "@/features/cee-workflows/queries/get-confirmateur-workflow-detail";
import { AgentSimulationResultCard } from "@/features/cee-workflows/components/agent-simulation-result-card";
import type { SimulatorProductCardViewModel } from "@/features/products/domain/types";

export function ConfirmateurWorkflowDetail({
  detail,
  recommendedProduct,
}: {
  detail: ConfirmateurWorkflowDetailData;
  recommendedProduct: SimulatorProductCardViewModel | null;
}) {
  const workflow = detail.workflow;
  const lead = workflow.lead;
  const simulationResult = workflow.simulation_result_json as Record<string, unknown>;

  return (
    <div className="space-y-5">
      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{lead?.company_name ?? "Société inconnue"}</span>
            {workflow.cee_sheet?.code ? <Badge variant="secondary">{workflow.cee_sheet.code}</Badge> : null}
            <Badge variant="outline">{workflow.workflow_status}</Badge>
          </CardTitle>
          <CardDescription>
            Dossier confirmateur : contrôle, qualification, production documentaire et transmission.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div><strong>Contact :</strong> {lead?.contact_name || "Non renseigné"}</div>
            <div><strong>Téléphone :</strong> {lead?.phone || "Non renseigné"}</div>
            <div><strong>Email :</strong> {lead?.email || "Non renseigné"}</div>
            <div><strong>Adresse :</strong> {[lead?.worksite_address, lead?.worksite_postal_code, lead?.worksite_city].filter(Boolean).join(", ") || "Non renseignée"}</div>
          </div>
          <div className="space-y-2 text-sm">
            <div><strong>Fiche CEE :</strong> {workflow.cee_sheet?.label ?? "Inconnue"}</div>
            <div><strong>Simulateur :</strong> {workflow.cee_sheet?.simulator_key ?? "Non configuré"}</div>
            <div><strong>Agent :</strong> {workflow.assigned_agent?.full_name || workflow.assigned_agent?.email || "Non affecté"}</div>
            <div><strong>Confirmateur :</strong> {workflow.assigned_confirmateur?.full_name || workflow.assigned_confirmateur?.email || "Non affecté"}</div>
          </div>
        </CardContent>
      </Card>

      <AgentSimulationResultCard
        result={
          simulationResult && typeof simulationResult === "object" && !Array.isArray(simulationResult)
            ? (simulationResult as never)
            : null
        }
        recommendedProduct={recommendedProduct}
      />

      {detail.cart ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Panier / produit recommandé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {detail.cart.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-muted-foreground">{item.product.product_code}</div>
                </div>
                <div className="text-right text-muted-foreground">
                  <div>Qté {item.quantity}</div>
                  <div>{item.line_total_ht ?? item.unit_price_ht ?? "—"} € HT</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle>Historique workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {detail.events.length === 0 ? (
            <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground">
              Aucun événement historique.
            </div>
          ) : (
            detail.events.map((event) => (
              <div key={event.id} className="rounded-lg border px-3 py-3 text-sm">
                <div className="font-medium">{event.event_label}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString("fr-FR")}
                  {event.created_by_profile
                    ? ` · ${event.created_by_profile.full_name || event.created_by_profile.email}`
                    : ""}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
