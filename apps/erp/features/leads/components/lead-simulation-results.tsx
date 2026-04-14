import type { WorkflowScopedListRow } from "@/features/cee-workflows/types";
import type { LeadRow } from "@/features/leads/types";
import { resolveLeadSimulationDetail } from "@/features/leads/lib/resolve-lead-simulation-detail";
import { formatHeatingModeLabelFr, HEATING_MODE_VALUES } from "@/features/leads/simulator/schemas/simulator.schema";
import { formatDateTimeFr } from "@/lib/format";

function euro(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function num(value: number | null, maxFractionDigits = 2): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: maxFractionDigits }).format(value);
}

function text(value: string | null): string {
  return value && value.trim() ? value : "—";
}

function heatingDisplay(raw: string | null): string {
  if (!raw?.trim()) return "—";
  const v = raw.trim();
  if ((HEATING_MODE_VALUES as readonly string[]).includes(v)) {
    return formatHeatingModeLabelFr(v as (typeof HEATING_MODE_VALUES)[number]);
  }
  return v;
}

export function LeadSimulationResults({
  lead,
  workflows = [],
}: {
  lead: LeadRow;
  workflows?: WorkflowScopedListRow[];
}) {
  const detail = resolveLeadSimulationDetail(lead, workflows);

  if (!detail) {
    return (
      <p className="max-w-4xl text-sm text-muted-foreground">
        Aucune simulation enregistrée. Les résultats saisis depuis le poste Agent, le tableau de bord ou un autre
        parcours apparaîtront ici dès qu&apos;ils seront stockés sur ce lead ou sur un workflow fiche CEE lié.
      </p>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      {detail.source === "workflow" && detail.workflowLabel ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Source :</span> workflow fiche CEE — {detail.workflowLabel}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Données d&apos;entrée</p>
          <dl className="mt-2 grid grid-cols-1 gap-y-1.5 text-sm">
            {detail.buildingHeated ? (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Bâtiment chauffé</dt>
                <dd>{detail.buildingHeated === "yes" ? "Oui" : detail.buildingHeated === "no" ? "Non" : text(detail.buildingHeated)}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Type de site</dt>
              <dd>{text(detail.clientType)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Hauteur</dt>
              <dd>{num(detail.heightM)} m</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Surface</dt>
              <dd>{num(detail.surfaceM2)} m²</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Mode chauffage</dt>
              <dd>{heatingDisplay(detail.heatingMode)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Modèle</dt>
              <dd>{text(detail.model)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Consigne</dt>
              <dd>{text(detail.consigne)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Audit simulation</p>
          <dl className="mt-2 grid grid-cols-1 gap-y-1.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">{detail.source === "workflow" ? "Mise à jour" : "Simulé le"}</dt>
              <dd>{detail.simulatedAt ? formatDateTimeFr(detail.simulatedAt) : "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Version moteur</dt>
              <dd>{text(detail.version)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Payload brut</dt>
              <dd>{detail.hasPayloadJson ? "Disponible" : "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Résultats calculés</p>
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm md:grid-cols-2">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Volume</dt>
            <dd>{num(detail.volumeM3)} m3</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Taux de brassage</dt>
            <dd>{num(detail.airChangeRate, 3)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Capacité modèle</dt>
            <dd>{num(detail.modelCapacityM3h)} m3/h</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Nb destratificateurs</dt>
            <dd>{num(detail.neededDestrat, 0)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Besoin chauffage</dt>
            <dd>{num(detail.powerKw)} kW</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Consommation annuelle</dt>
            <dd>{num(detail.consumptionKwhYear)} kWh</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Coût annuel min</dt>
            <dd>{euro(detail.costYearMin)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Coût annuel max</dt>
            <dd>{euro(detail.costYearMax)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Coût annuel sélectionné</dt>
            <dd>{euro(detail.costYearSelected)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground" title="Hypothèse déstrat : part d’économies selon la hauteur (pas un fixe 30 %).">
              Économie énergie (déstrat)
            </dt>
            <dd>{num(detail.savingKwh30)} kWh/an</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Économie € (déstrat) min</dt>
            <dd>{euro(detail.savingEur30Min)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Économie € (déstrat) max</dt>
            <dd>{euro(detail.savingEur30Max)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Économie € (déstrat) retenu</dt>
            <dd>{euro(detail.savingEur30Selected)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">CO2 évité</dt>
            <dd>{num(detail.co2SavedTons, 3)} t/an</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Prime CEE estimée</dt>
            <dd>{euro(detail.ceePrimeEstimated)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Coût install unitaire</dt>
            <dd>{euro(detail.installUnitPrice)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Coût installation total</dt>
            <dd>{euro(detail.installTotalPrice)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Reste à charge</dt>
            <dd>{euro(detail.restToCharge)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Score lead</dt>
            <dd>{num(detail.leadScore, 0)}/100</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
