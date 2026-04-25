import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { getLatestSimulationForLead } from "@/features/simulator-cee/queries/get-latest-simulation-for-lead";
import { cn } from "@/lib/utils";

type LeadLike = { id: string } | null | undefined;

const CHAUFFAGE_LABEL: Record<string, string> = {
  gaz: "Gaz (chaudière classique)",
  gaz_cond: "Gaz condensation",
  fioul: "Fioul",
  elec: "Électrique",
  bois: "Bois / bûches",
  granules: "Granulés / pellets",
  pac_air_eau: "PAC air/eau déjà installée",
  pac_air_air: "PAC air/air déjà installée",
};

const PROFIL_LABEL: Record<string, string> = {
  proprietaire_occupant: "Propriétaire occupant",
  bailleur: "Bailleur",
  sci: "SCI",
  locataire: "Locataire",
};

const LOGEMENT_LABEL: Record<string, string> = {
  maison: "Maison",
  appartement: "Appartement",
};

const CONSTRUCTION_LABEL: Record<string, string> = {
  avant_2000: "Avant 2000",
  apres_2000: "Après 2000",
};

const FENETRES_LABEL: Record<string, string> = {
  double_vitrage: "Double vitrage",
  simple_vitrage_bois: "Simple vitrage bois",
};

const TRAVAUX_PRIO_LABEL: Record<string, string> = {
  combles: "Combles",
  murs: "Murs",
  fenetres: "Fenêtres",
  vmc: "VMC",
  chauffage: "Chauffage",
  sous_sol: "Sous-sol",
  btd: "BTD",
};

const TRAVAUX_CEE_LABEL: Record<string, string> = {
  oui: "Oui",
  non: "Non",
  jsp: "Je ne sais pas",
};

const PATRIMOINE_LABEL: Record<string, string> = {
  appartements: "Appartements",
  maisons: "Maisons",
  mixte: "Mixte",
};

const TRANCHE_LABEL: Record<string, string> = {
  tres_modeste: "Très modestes",
  modeste: "Modestes",
  intermediaire: "Intermédiaires",
  superieur: "Supérieurs",
};

function yn(v: boolean | null | undefined): string {
  if (v === true) return "Oui";
  if (v === false) return "Non";
  return "—";
}

function formatDpe(d: string | null | undefined): string {
  if (!d) return "—";
  if (d === "inconnu") return "Inconnu";
  return `Classe ${d}`;
}

/**
 * Récap simulation CEE liée au lead — première simulation (`created_at` desc) trouvée.
 * Affiche un état vide + lien simulateur si aucune simulation n’a été lancée.
 */
export async function LeadSimulationResults({
  lead,
  // `workflows` est un héritage de l’ancien pipeline cee-workflows ; on l’ignore.
  workflows: _workflows,
}: {
  lead?: LeadLike;
  workflows?: unknown;
}) {
  void _workflows;
  if (!lead?.id) return null;

  const sim = await getLatestSimulationForLead(lead.id);

  if (!sim) {
    return (
      <Card className="border-dashed border-violet-200 bg-violet-50/40 shadow-none">
        <CardContent className="flex flex-col items-start gap-3 py-6">
          <p className="text-sm text-slate-700">
            Aucune simulation CEE enregistrée pour ce lead.
          </p>
          <Link
            href="/simulateur"
            className={cn(buttonVariants({ variant: "outline" }), "rounded-full")}
          >
            Lancer une simulation
          </Link>
        </CardContent>
      </Card>
    );
  }

  const result = (sim.result_snapshot ?? {}) as Record<string, unknown>;
  const pacOperation =
    ((result.pac as Record<string, unknown> | undefined)?.operation as string | undefined) ?? null;
  const renovScenario =
    ((result.renov as Record<string, unknown> | undefined)?.scenario as string | undefined) ?? null;

  return (
    <div className="space-y-4">
      {sim.cible_ideale ? (
        <div className="flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-3">
          <span className="text-2xl" aria-hidden>
            🌟
          </span>
          <div>
            <div className="text-sm font-bold text-amber-900">Cible idéale — Prospect premium</div>
            <p className="text-xs text-amber-800">
              Configuration optimale. Reste à charge minimal attendu.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card
          className={cn(
            "rounded-2xl border-2 shadow-none",
            sim.pac_eligible
              ? "border-emerald-200 bg-emerald-50/60"
              : "border-slate-200 bg-slate-50/60 opacity-80",
          )}
        >
          <CardContent className="space-y-1 py-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800">PAC</span>
              {sim.pac_eligible && pacOperation ? (
                <Badge variant="secondary" className="rounded-full">
                  {pacOperation}
                </Badge>
              ) : null}
            </div>
            <p className={cn("text-xs", sim.pac_eligible ? "text-emerald-900" : "text-slate-500")}>
              {sim.pac_eligible ? "Éligible" : "Non éligible"}
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "rounded-2xl border-2 shadow-none",
            sim.renov_eligible
              ? "border-violet-200 bg-violet-50/60"
              : "border-slate-200 bg-slate-50/60 opacity-80",
          )}
        >
          <CardContent className="space-y-1 py-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800">Rénovation globale</span>
              {sim.renov_eligible ? (
                <Badge variant="secondary" className="rounded-full">
                  BAR-TH-174{renovScenario ? ` (${renovScenario})` : ""}
                </Badge>
              ) : null}
            </div>
            <p className={cn("text-xs", sim.renov_eligible ? "text-violet-900" : "text-slate-500")}>
              {sim.renov_eligible ? "Éligible" : "Non éligible"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <TableBody>
            {sim.profil ? (
              <TableRow>
                <TableCell className="w-2/5 font-medium text-slate-600">Profil</TableCell>
                <TableCell className="text-slate-900">
                  {PROFIL_LABEL[sim.profil] ?? sim.profil}
                </TableCell>
              </TableRow>
            ) : null}
            {sim.raison_sociale ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Raison sociale</TableCell>
                <TableCell>{sim.raison_sociale}</TableCell>
              </TableRow>
            ) : null}
            {sim.patrimoine_type ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Patrimoine</TableCell>
                <TableCell>{PATRIMOINE_LABEL[sim.patrimoine_type] ?? sim.patrimoine_type}</TableCell>
              </TableRow>
            ) : null}
            {sim.nb_logements != null ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Nombre de logements</TableCell>
                <TableCell>{sim.nb_logements}</TableCell>
              </TableRow>
            ) : null}
            {sim.surface_totale_m2 != null ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Surface totale</TableCell>
                <TableCell>{sim.surface_totale_m2.toLocaleString("fr-FR")} m²</TableCell>
              </TableRow>
            ) : null}
            {sim.type_logement ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Logement</TableCell>
                <TableCell>{LOGEMENT_LABEL[sim.type_logement] ?? sim.type_logement}</TableCell>
              </TableRow>
            ) : null}
            {sim.periode_construction ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Construction</TableCell>
                <TableCell>
                  {CONSTRUCTION_LABEL[sim.periode_construction] ?? sim.periode_construction}
                </TableCell>
              </TableRow>
            ) : null}
            {sim.type_logement === "maison" && sim.periode_construction === "avant_2000" ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">ITE/ITI &lt; 20 ans</TableCell>
                <TableCell>{yn(sim.ite_iti_recente)}</TableCell>
              </TableRow>
            ) : null}
            {sim.fenetres ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Fenêtres</TableCell>
                <TableCell>{FENETRES_LABEL[sim.fenetres] ?? sim.fenetres}</TableCell>
              </TableRow>
            ) : null}
            {sim.profil === "proprietaire_occupant" ? (
              <>
                <TableRow>
                  <TableCell className="font-medium text-slate-600">Sous-sol</TableCell>
                  <TableCell>{yn(sim.sous_sol)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-slate-600">BTD installé</TableCell>
                  <TableCell>{yn(sim.btd_installe)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-slate-600">VMC installée</TableCell>
                  <TableCell>{yn(sim.vmc_installee)}</TableCell>
                </TableRow>
              </>
            ) : null}
            {sim.chauffage ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Chauffage</TableCell>
                <TableCell>{CHAUFFAGE_LABEL[sim.chauffage] ?? sim.chauffage}</TableCell>
              </TableRow>
            ) : null}
            {sim.dpe ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">DPE</TableCell>
                <TableCell>{formatDpe(sim.dpe)}</TableCell>
              </TableRow>
            ) : null}
            {sim.travaux_cee_recus ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Travaux CEE déjà reçus</TableCell>
                <TableCell>
                  {TRAVAUX_CEE_LABEL[sim.travaux_cee_recus] ?? sim.travaux_cee_recus}
                </TableCell>
              </TableRow>
            ) : null}
            {sim.income_category ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Tranche de revenus</TableCell>
                <TableCell>{TRANCHE_LABEL[sim.income_category] ?? sim.income_category}</TableCell>
              </TableRow>
            ) : null}
            {sim.zone ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Zone climatique</TableCell>
                <TableCell>
                  {sim.zone === "idf"
                    ? "Île-de-France"
                    : sim.zone === "hors_idf"
                      ? "Hors Île-de-France"
                      : "—"}
                </TableCell>
              </TableRow>
            ) : null}
            {sim.package_recommande?.length ? (
              <TableRow>
                <TableCell className="font-medium text-slate-600">Travaux prioritaires</TableCell>
                <TableCell>
                  {sim.package_recommande.map((k) => TRAVAUX_PRIO_LABEL[k] ?? k).join(", ")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <p className="text-right text-xs text-slate-500">
        Simulé le{" "}
        {new Date(sim.created_at).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
