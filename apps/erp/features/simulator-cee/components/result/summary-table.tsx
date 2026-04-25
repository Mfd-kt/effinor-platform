"use client";

import type { EligibilityResult, SimulationAnswers } from "@/features/simulator-cee/domain/types";
import { CATEGORIES } from "@/features/simulator-cee/domain/plafonds";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const PROFIL_LABEL: Record<SimulationAnswers["profil"], string> = {
  proprietaire_occupant: "Propriétaire occupant",
  bailleur: "Bailleur",
  sci: "SCI",
  locataire: "Locataire",
};

const LOGEMENT_LABEL: Record<NonNullable<SimulationAnswers["typeLogement"]>, string> = {
  maison: "Maison",
  appartement: "Appartement",
};

const CONSTRUCTION_LABEL: Record<NonNullable<SimulationAnswers["periodeConstruction"]>, string> = {
  avant_2000: "Avant 2000",
  apres_2000: "Après 2000",
};

const CHAUFFAGE_LABEL: Record<SimulationAnswers["chauffage"], string> = {
  gaz: "Gaz (chaudière classique)",
  gaz_cond: "Gaz condensation",
  fioul: "Fioul",
  elec: "Électrique",
  bois: "Bois / bûches",
  granules: "Granulés / pellets",
  pac_air_eau: "PAC air/eau déjà installée",
  pac_air_air: "PAC air/air déjà installée",
};

const FENETRES_LABEL: Record<NonNullable<SimulationAnswers["fenetres"]>, string> = {
  double_vitrage: "Double vitrage",
  simple_vitrage_bois: "Simple vitrage bois",
};

const TRAVAUX_CEE_LABEL: Record<NonNullable<SimulationAnswers["travauxCeeRecus"]>, string> = {
  oui: "Oui",
  non: "Non",
  jsp: "Je ne sais pas",
};

const PATRIMOINE_LABEL: Record<NonNullable<SimulationAnswers["patrimoineType"]>, string> = {
  appartements: "Appartements",
  maisons: "Maisons",
  mixte: "Mixte",
};

const TRAVAUX_PRIO_LABEL: Record<EligibilityResult["renov"]["package"][number], string> = {
  combles: "Combles",
  murs: "Murs",
  fenetres: "Fenêtres",
  vmc: "VMC",
  chauffage: "Chauffage",
  sous_sol: "Sous-sol",
  btd: "BTD",
};

function yn(v: boolean | undefined): string {
  if (v === true) return "Oui";
  if (v === false) return "Non";
  return "—";
}

function formatDpe(d: SimulationAnswers["dpe"]): string {
  if (d === "inconnu") return "Inconnu";
  return `Classe ${d}`;
}

type Row = { key: string; label: string; value: string };

function buildRows(answers: SimulationAnswers, result: EligibilityResult): Row[] {
  const rows: Row[] = [];

  if (result.cibleIdeale) {
    rows.push({ key: "cible_ideale", label: "🌟 Cible idéale", value: "Prospect premium" });
  }

  rows.push({ key: "profil", label: "Profil", value: PROFIL_LABEL[answers.profil] });

  if (answers.profil === "sci" || answers.profil === "bailleur") {
    if (answers.raisonSociale) {
      rows.push({ key: "rs", label: "Raison sociale", value: answers.raisonSociale });
    }
    if (answers.patrimoineType) {
      rows.push({ key: "pt", label: "Patrimoine", value: PATRIMOINE_LABEL[answers.patrimoineType] });
    }
    if (answers.nbLogements != null) {
      rows.push({ key: "nbl", label: "Nombre de logements", value: String(answers.nbLogements) });
    }
    if (answers.surfaceTotaleM2 != null) {
      rows.push({
        key: "surf",
        label: "Surface totale chauffée",
        value: `${answers.surfaceTotaleM2.toLocaleString("fr-FR")} m²`,
      });
    }
  }

  if (answers.profil === "proprietaire_occupant") {
    if (answers.typeLogement) {
      rows.push({ key: "log", label: "Logement", value: LOGEMENT_LABEL[answers.typeLogement] });
    }
    if (answers.periodeConstruction) {
      rows.push({
        key: "constr",
        label: "Construction",
        value: CONSTRUCTION_LABEL[answers.periodeConstruction],
      });
    }
    // ITE/ITI : visible pour propriétaire en maison avant 2000 (impact direct
    // sur l’éligibilité rénovation globale BAR-TH-174).
    if (
      answers.typeLogement === "maison" &&
      answers.periodeConstruction === "avant_2000"
    ) {
      rows.push({ key: "ite", label: "ITE/ITI < 20 ans", value: yn(answers.iteItiRecente) });
    }
    if (answers.fenetres) {
      rows.push({ key: "fen", label: "Fenêtres", value: FENETRES_LABEL[answers.fenetres] });
    }
    rows.push({ key: "ssol", label: "Sous-sol", value: yn(answers.sousSol) });
    rows.push({ key: "btd", label: "BTD installé", value: yn(answers.btdInstalle) });
    rows.push({ key: "vmc", label: "VMC installée", value: yn(answers.vmcInstallee) });
  }

  rows.push({ key: "chauf", label: "Chauffage", value: CHAUFFAGE_LABEL[answers.chauffage] });
  rows.push({ key: "dpe", label: "DPE", value: formatDpe(answers.dpe) });
  if (answers.travauxCeeRecus) {
    rows.push({
      key: "trcee",
      label: "Travaux CEE déjà reçus",
      value: TRAVAUX_CEE_LABEL[answers.travauxCeeRecus],
    });
  }

  rows.push({
    key: "addr",
    label: "Adresse",
    value: `${answers.adresse.adresse}, ${answers.adresse.codePostal} ${answers.adresse.ville}`,
  });

  if (answers.profil === "proprietaire_occupant") {
    rows.push({ key: "foyer", label: "Personnes au foyer", value: String(answers.nbPersonnes) });
    rows.push({ key: "tranche", label: "Tranche de revenus", value: CATEGORIES[answers.trancheRevenu] });
  }

  if (result.renov.package.length) {
    rows.push({
      key: "pkg",
      label: "Travaux prioritaires",
      value: result.renov.package.map((k) => TRAVAUX_PRIO_LABEL[k]).join(", "),
    });
  }

  return rows;
}

export function SummaryTable({
  answers,
  result,
}: {
  answers: SimulationAnswers;
  result: EligibilityResult;
}) {
  const rows = buildRows(answers, result);
  return (
    <div className="overflow-hidden rounded-2xl border border-violet-100 bg-white">
      <Table>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.key} className="border-violet-50">
              <TableCell className="w-2/5 font-medium text-slate-600">{r.label}</TableCell>
              <TableCell className="text-slate-900">{r.value}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
