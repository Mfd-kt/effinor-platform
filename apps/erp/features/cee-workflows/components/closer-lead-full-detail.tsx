"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Building2, ExternalLink, FileImage, User } from "lucide-react";

import { CollapsibleSection } from "@/components/shared/collapsible-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CloserLeadQuickEditDialog } from "@/features/cee-workflows/components/closer-lead-quick-edit-dialog";
import { LeadDetailMediaLinks } from "@/features/leads/components/lead-detail-media-links";
import { formatHeatingModesDisplay } from "@/features/leads/lib/heating-modes";
import { stringArrayFromLeadJson } from "@/features/leads/lib/lead-media-json";
import type { LeadDetailRow } from "@/features/leads/types";

function firstUrlFromJson(json: unknown): string | null {
  if (typeof json === "string" && json.trim()) return json.trim();
  if (Array.isArray(json) && json.length > 0 && typeof json[0] === "string") {
    return json[0].trim() || null;
  }
  return null;
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

function fmtNum(n: number | null | undefined, unit?: string): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toLocaleString("fr-FR")}${unit ?? ""}`;
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 text-sm sm:grid-cols-2">{children}</div>;
}

function Item({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="break-words text-foreground">{value ?? "—"}</div>
    </div>
  );
}

export function CloserLeadFullDetailPanel({
  lead,
  leadId,
  leadSourceForEdit,
  onLeadUpdated,
}: {
  lead: LeadDetailRow | null;
  leadId: string;
  /** Données brutes du lead (sans fusion workflow) pour le formulaire d’édition. */
  leadSourceForEdit: LeadDetailRow | null;
  onLeadUpdated?: () => void;
}) {
  const leadHref = `/leads/${leadId}`;
  const studyUrls = lead ? stringArrayFromLeadJson(lead.study_media_files) : [];
  const hasClassicMedia = lead
    ? Boolean(
        firstUrlFromJson(lead.aerial_photos) ||
          firstUrlFromJson(lead.cadastral_parcel_files) ||
          firstUrlFromJson(lead.recording_files),
      )
    : false;
  const hasAnyMedia = hasClassicMedia || studyUrls.length > 0;

  if (!lead) {
    return (
      <Card className="border-amber-200/80 bg-amber-50/40 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fiche lead</CardTitle>
          <CardDescription>
            Les informations détaillées ne sont pas disponibles (droits d’accès ou lead introuvable). Vous pouvez
            toutefois ouvrir la fiche si votre profil le permet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={leadHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Ouvrir la fiche lead
            <ExternalLink className="size-3.5" />
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Fiche lead complète</h3>
        <div className="flex flex-wrap items-center gap-2">
          {leadSourceForEdit ? (
            <CloserLeadQuickEditDialog
              lead={leadSourceForEdit}
              leadId={leadId}
              onSaved={() => onLeadUpdated?.()}
            />
          ) : null}
          <Link
            href={leadHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Ouvrir dans « Leads »
            <ExternalLink className="size-3.5" />
          </Link>
        </div>
      </div>

      <CollapsibleSection title="Société et piste commerciale" icon={<Building2 className="size-4" />} defaultOpen>
        <DetailGrid>
          <Item label="Source" value={lead.source} />
          <Item label="Campagne" value={lead.campaign} />
          <Item label="Landing" value={lead.landing} />
          <Item label="Intérêt produit" value={lead.product_interest} />
          <Item label="Canal" value={lead.lead_channel} />
          <Item label="Origine" value={lead.lead_origin} />
          <Item label="SIRET" value={lead.siret} />
          <Item label="SIRET siège" value={lead.head_office_siret} />
          <Item label="SIRET chantier" value={lead.worksite_siret} />
          <Item label="Statut lead" value={lead.lead_status} />
          <Item label="Qualification" value={lead.qualification_status} />
          <Item label="Rappel prévu" value={fmtDateTime(lead.callback_at)} />
          <Item
            label="Créé le"
            value={`${fmtDateTime(lead.created_at)}${lead.created_by_agent?.full_name ? ` · ${lead.created_by_agent.full_name}` : ""}`}
          />
          <Item
            label="Confirmé par"
            value={
              lead.confirmed_by
                ? `${lead.confirmed_by.full_name ?? lead.confirmed_by.email}`
                : "—"
            }
          />
          <Item label="Dernière mise à jour" value={fmtDateTime(lead.updated_at)} />
        </DetailGrid>
      </CollapsibleSection>

      <CollapsibleSection title="Contact" icon={<User className="size-4" />} defaultOpen>
        <DetailGrid>
          <Item label="Prénom" value={lead.first_name} />
          <Item label="Nom" value={lead.last_name} />
          <Item label="Nom affiché" value={lead.contact_name} />
          <Item label="Poste" value={lead.job_title} />
          <Item label="Service" value={lead.department} />
          <Item label="Rôle contact" value={lead.contact_role} />
          <Item label="Téléphone" value={lead.phone} />
          <Item label="Email" value={lead.email} />
        </DetailGrid>
      </CollapsibleSection>

      <CollapsibleSection title="Siège social">
        <DetailGrid>
          <Item label="Adresse" value={lead.head_office_address} />
          <Item label="Code postal" value={lead.head_office_postal_code} />
          <Item label="Ville" value={lead.head_office_city} />
        </DetailGrid>
      </CollapsibleSection>

      <CollapsibleSection title="Site / chantier" defaultOpen>
        <DetailGrid>
          <Item label="Adresse" value={lead.worksite_address} />
          <Item label="Code postal" value={lead.worksite_postal_code} />
          <Item label="Ville" value={lead.worksite_city} />
        </DetailGrid>
      </CollapsibleSection>

      <CollapsibleSection title="Bâtiment et chauffage">
        <DetailGrid>
          <Item label="Type de bâtiment" value={lead.building_type} />
          <Item label="Surface (m²)" value={fmtNum(lead.surface_m2, " m²")} />
          <Item label="Hauteur sous plafond (m)" value={fmtNum(lead.ceiling_height_m, " m")} />
          <Item
            label="Bâtiment chauffé"
            value={lead.heated_building == null ? "—" : lead.heated_building ? "Oui" : "Non"}
          />
          <Item label="Mode(s) de chauffage" value={formatHeatingModesDisplay(lead.heating_type)} />
          <Item label="Nombre d’entrepôts" value={fmtNum(lead.warehouse_count)} />
        </DetailGrid>
      </CollapsibleSection>

      <CollapsibleSection title="Simulation enregistrée sur le lead" defaultOpen>
        <p className="mb-3 text-xs text-muted-foreground">
          Ces champs correspondent aux colonnes <code className="rounded bg-muted px-1">sim_*</code> du lead. Si l’agent a
          surtout enregistré la simulation sur le <strong>dossier workflow</strong>, elles peuvent être vides en base :
          l’écran closer les complète alors avec le résultat de simulation du workflow (même source que la carte
          « Résultat simulation » ci‑dessous).
        </p>
        <DetailGrid>
          <Item label="Surface sim." value={fmtNum(lead.sim_surface_m2, " m²")} />
          <Item label="Hauteur sim." value={fmtNum(lead.sim_height_m, " m")} />
          <Item label="Type de site" value={lead.sim_client_type} />
          <Item label="Modèle" value={lead.sim_model} />
          <Item label="Chauffage (sim.)" value={lead.sim_heating_mode} />
          <Item label="Consigne" value={lead.sim_consigne} />
          <Item label="Volume (m³)" value={fmtNum(lead.sim_volume_m3, " m³")} />
          <Item label="Taux renouvellement d’air" value={fmtNum(lead.sim_air_change_rate)} />
          <Item label="Débit modèle (m³/h)" value={fmtNum(lead.sim_model_capacity_m3h)} />
          <Item label="Unités déstrat." value={fmtNum(lead.sim_needed_destrat)} />
          <Item label="Puissance (kW)" value={fmtNum(lead.sim_power_kw, " kW")} />
          <Item label="Conso. annuelle (kWh)" value={fmtNum(lead.sim_consumption_kwh_year)} />
          <Item label="Coût an min / max / retenu (€)" value={`${fmtNum(lead.sim_cost_year_min)} / ${fmtNum(lead.sim_cost_year_max)} / ${fmtNum(lead.sim_cost_year_selected)}`} />
          <Item label="Économie kWh (30%)" value={fmtNum(lead.sim_saving_kwh_30)} />
          <Item label="Économie € (30%) min / max / retenu" value={`${fmtNum(lead.sim_saving_eur_30_min)} / ${fmtNum(lead.sim_saving_eur_30_max)} / ${fmtNum(lead.sim_saving_eur_30_selected)}`} />
          <Item label="CO₂ évité (t)" value={fmtNum(lead.sim_co2_saved_tons)} />
          <Item label="Prime CEE estimée (€)" value={fmtNum(lead.sim_cee_prime_estimated)} />
          <Item label="Prix unitaire install. (€)" value={fmtNum(lead.sim_install_unit_price)} />
          <Item label="Total installation (€)" value={fmtNum(lead.sim_install_total_price)} />
          <Item label="Reste à charge (€)" value={fmtNum(lead.sim_rest_to_charge)} />
          <Item label="Score lead (sim.)" value={fmtNum(lead.sim_lead_score)} />
          <Item label="Version simulateur" value={lead.sim_version} />
          <Item label="Simulé le" value={fmtDateTime(lead.simulated_at)} />
        </DetailGrid>
      </CollapsibleSection>

      <CollapsibleSection title="Synthèse IA">
        <div className="space-y-3 text-sm">
          <Item label="Score IA" value={fmtNum(lead.ai_lead_score)} />
          <div className="space-y-0.5">
            <div className="text-xs font-medium text-muted-foreground">Résumé</div>
            <p className="whitespace-pre-wrap break-words text-foreground">
              {lead.ai_lead_summary?.trim() || "—"}
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Notes enregistrées sur le lead">
        <p className="whitespace-pre-wrap break-words text-sm text-foreground">
          {lead.recording_notes?.trim() || "—"}
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Fichiers et médias" icon={<FileImage className="size-4" />}>
        <div className="space-y-4">
          {hasClassicMedia ? (
            <div className="[&_.mb-8]:mb-0">
              <LeadDetailMediaLinks lead={lead} />
            </div>
          ) : null}
          {studyUrls.length > 0 ? (
            <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 px-3 py-3">
              <div className="text-xs font-medium text-muted-foreground">Médias d’étude</div>
              <ul className="space-y-2 text-sm">
                {studyUrls.map((url) => (
                  <li key={url}>
                    <Link
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {url}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {!hasAnyMedia ? (
            <p className="text-sm text-muted-foreground">Aucun média renseigné sur cette fiche.</p>
          ) : null}
        </div>
      </CollapsibleSection>
    </div>
  );
}
