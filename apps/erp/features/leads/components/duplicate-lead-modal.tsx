"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "@/features/leads/constants";
import { formatHeatingModesDisplay } from "@/features/leads/lib/heating-modes";
import { formatMediaListForDisplay } from "@/features/leads/lib/lead-media-json";
import type { LeadRow } from "@/features/leads/types";
import { cn } from "@/lib/utils";

const REASON_LABEL: Record<"company" | "email" | "phone" | "siret", string> = {
  company: "la même raison sociale",
  email: "le même e-mail",
  phone: "le même numéro de téléphone",
  siret: "le même SIRET",
};

function str(v: string | null | undefined): string {
  const t = v?.trim();
  return t ? t : "—";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatBool(v: boolean | null | undefined): string {
  if (v === true) return "Oui";
  if (v === false) return "Non";
  return "—";
}

function Detail({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-0.5 text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="break-words font-medium text-foreground">{value}</span>
    </div>
  );
}

export type DuplicateLeadModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  lead: LeadRow | null;
  matchReason: "company" | "email" | "phone" | "siret";
};

export function DuplicateLeadModal({
  open,
  onOpenChange,
  leadId,
  lead,
  matchReason,
}: DuplicateLeadModalProps) {
  const reasonText = REASON_LABEL[matchReason];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex max-h-[92vh] flex-col gap-0 rounded-t-xl border-x border-t p-0 sm:mx-auto sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b px-4 pt-2 pb-4 text-left">
          <SheetTitle>Lead déjà enregistré</SheetTitle>
          <SheetDescription className="text-left">
            Un lead existe déjà avec {reasonText}. Veuillez contacter un responsable pour récupérer ou
            réattribuer cette fiche. Les coordonnées du lead existant sont affichées ci-dessous (lecture
            seule).
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4">
          <div className="space-y-6 py-4 pr-3">
            {!lead ? (
              <p className="text-sm text-muted-foreground">
                Les détails n&apos;ont pas pu être chargés. Référence interne :{" "}
                <span className="font-mono text-xs">{leadId}</span>
              </p>
            ) : (
              <>
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Identification
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail label="ID fiche" value={<span className="font-mono text-xs">{lead.id}</span>} />
                    <Detail label="Créé le" value={formatDate(lead.created_at)} />
                    <Detail label="Statut" value={LEAD_STATUS_LABELS[lead.lead_status] ?? lead.lead_status} />
                    <Detail label="Source" value={LEAD_SOURCE_LABELS[lead.source] ?? lead.source} />
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Société & contact
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail label="Raison sociale" value={str(lead.company_name)} className="sm:col-span-2" />
                    <Detail label="Civilité" value={str(lead.civility)} />
                    <Detail label="Prénom" value={str(lead.first_name)} />
                    <Detail label="Nom" value={str(lead.last_name)} />
                    <Detail label="E-mail" value={str(lead.email)} />
                    <Detail label="Téléphone" value={str(lead.phone)} />
                    <Detail label="Fonction" value={str(lead.contact_role)} />
                    <Detail label="SIRET" value={str(lead.siret)} />
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Siège social
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail label="Adresse" value={str(lead.head_office_address)} className="sm:col-span-2" />
                    <Detail label="Code postal" value={str(lead.head_office_postal_code)} />
                    <Detail label="Ville" value={str(lead.head_office_city)} />
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Site des travaux
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail label="Adresse" value={str(lead.worksite_address)} className="sm:col-span-2" />
                    <Detail label="Code postal" value={str(lead.worksite_postal_code)} />
                    <Detail label="Ville" value={str(lead.worksite_city)} />
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Suivi & qualification
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail label="Campagne" value={str(lead.campaign)} />
                    <Detail label="Landing" value={str(lead.landing)} />
                    <Detail label="Rappel téléphone" value={formatDate(lead.callback_at)} />
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Pré-qualification technique
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail label="Surface (m²)" value={lead.surface_m2 != null ? String(lead.surface_m2) : "—"} />
                    <Detail
                      label="Hauteur plafond (m)"
                      value={lead.ceiling_height_m != null ? String(lead.ceiling_height_m) : "—"}
                    />
                    <Detail label="Type de bâtiment" value={str(lead.building_type)} className="sm:col-span-2" />
                    <Detail label="Bâtiment chauffé" value={formatBool(lead.heated_building)} />
                    <Detail label="Mode de chauffage" value={formatHeatingModesDisplay(lead.heating_type)} />
                    <Detail
                      label="Entrepôts"
                      value={lead.warehouse_count != null ? String(lead.warehouse_count) : "—"}
                    />
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Liens & médias
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-1">
                    <Detail
                      label="Photos aériennes"
                      value={formatMediaListForDisplay(lead.aerial_photos)}
                      className="whitespace-pre-wrap sm:col-span-2"
                    />
                    <Detail
                      label="Parcelle cadastrale"
                      value={formatMediaListForDisplay(lead.cadastral_parcel_files)}
                      className="whitespace-pre-wrap sm:col-span-2"
                    />
                    <Detail
                      label="Enregistrements"
                      value={formatMediaListForDisplay(lead.recording_files)}
                      className="whitespace-pre-wrap sm:col-span-2"
                    />
                    <Detail label="Notes enregistrement" value={str(lead.recording_notes)} />
                  </div>
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="shrink-0 border-t bg-background px-4 py-4">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Link href={`/leads/${leadId}`} className={buttonVariants({ variant: "outline" })}>
              Ouvrir la fiche lead
            </Link>
            <Button type="button" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
