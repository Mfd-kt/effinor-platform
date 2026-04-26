"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSimulationForLeadAction } from "@/features/simulator-cee/actions/save-simulation-for-lead-action";
import { submitSimulationAction } from "@/features/simulator-cee/actions/submit-simulation";
import { computeResult, detectZone } from "@/features/simulator-cee/domain/eligibility-rules";
import { buildTranches } from "@/features/simulator-cee/domain/plafonds";
import {
  countByPhase,
  getActiveSteps,
  type SimulatorStepId,
  type StepContext,
  type StepPhase,
} from "@/features/simulator-cee/domain/steps";
import type {
  DpeLetter,
  FenetresType,
  PatrimoineType,
  ProfilOccupant,
  SimulationAddress,
  SimulationAnswers,
  SimulationContact,
  SimulationRappel,
  TrancheRevenu,
  TravauxCeeRecus,
  TypeChauffage,
  TypeLogement,
} from "@/features/simulator-cee/domain/types";
import { AddressInput } from "@/features/simulator-cee/components/steps/address-input";
import { ContactForm } from "@/features/simulator-cee/components/steps/contact-form";
import { CounterInput } from "@/features/simulator-cee/components/steps/counter-input";
import { DpeSelector } from "@/features/simulator-cee/components/steps/dpe-selector";
import { RadioCard, type RadioOption } from "@/features/simulator-cee/components/steps/radio-card";
import { RappelForm } from "@/features/simulator-cee/components/steps/rappel-form";
import { TrancheSelector } from "@/features/simulator-cee/components/steps/tranche-selector";
import { YesNo, YesNoUnknown } from "@/features/simulator-cee/components/steps/yes-no";
import { PreliminaryResult } from "@/features/simulator-cee/components/result/preliminary-result";
import { ResultScreen } from "@/features/simulator-cee/components/result/result-screen";
import { BottomCta, GhostCtaButton, PrimaryCtaButton } from "@/features/simulator-cee/components/ui/bottom-cta";
import { ProgressHeader } from "@/features/simulator-cee/components/ui/progress-header";
import { StepIllustration } from "@/features/simulator-cee/components/ui/step-illustration";
import { StepTip } from "@/features/simulator-cee/components/ui/step-tip";

const PROFIL_OPTIONS: RadioOption<ProfilOccupant>[] = [
  { value: "proprietaire_occupant", label: "Propriétaire occupant", description: "Résidence principale ou secondaire" },
  { value: "bailleur", label: "Bailleur", description: "Organisme ou société bailleur" },
  { value: "sci", label: "SCI", description: "Société civile immobilière" },
  { value: "locataire", label: "Locataire", description: "Non éligible à la création de lead ici" },
];

const LOGEMENT_OPTIONS: RadioOption<TypeLogement>[] = [
  { value: "maison", label: "Maison" },
  { value: "appartement", label: "Appartement" },
];

const CHAUFFAGE_OPTIONS: RadioOption<TypeChauffage>[] = [
  { value: "gaz", label: "Gaz", description: "Chaudière classique" },
  { value: "gaz_cond", label: "Gaz à condensation", description: "Chaudière performante" },
  { value: "fioul", label: "Fioul" },
  { value: "elec", label: "Électrique", description: "Radiateurs / convecteurs" },
  { value: "bois", label: "Bois", description: "Bûches" },
  { value: "granules", label: "Granulés", description: "Pellets" },
  { value: "pac_air_eau", label: "PAC air/eau déjà installée", description: "🌀 Pompe à chaleur sur réseau d’eau" },
  { value: "pac_air_air", label: "PAC air/air déjà installée", description: "💨 Climatisation réversible" },
];

const CONSTRUCTION_OPTIONS: RadioOption<NonNullable<SimulationAnswers["periodeConstruction"]>>[] = [
  { value: "avant_2000", label: "Avant 2000" },
  { value: "apres_2000", label: "Après 2000" },
];

const FENETRES_OPTIONS: RadioOption<FenetresType>[] = [
  { value: "double_vitrage", label: "Double vitrage" },
  { value: "simple_vitrage_bois", label: "Simple vitrage bois" },
];

const PATRIMOINE_OPTIONS: RadioOption<PatrimoineType>[] = [
  { value: "appartements", label: "Appartements" },
  { value: "maisons", label: "Maisons" },
  { value: "mixte", label: "Mixte" },
];

const TRAVAUX_CEE_OPTIONS: { value: TravauxCeeRecus; label: string }[] = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
  { value: "jsp", label: "Je ne sais pas" },
];

const emptyAddress = (): SimulationAddress => ({
  adresse: "",
  codePostal: "",
  ville: "",
});

const emptyContact = (): SimulationContact => ({
  civilite: "M.",
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
});

const emptyRappel = (): SimulationRappel => ({
  date: "",
  heure: "10:00",
});

function toSimulationAnswers(partial: Partial<SimulationAnswers>): SimulationAnswers {
  return {
    profil: partial.profil ?? "proprietaire_occupant",
    raisonSociale: partial.raisonSociale,
    patrimoineType: partial.patrimoineType,
    nbLogements: partial.nbLogements,
    surfaceTotaleM2: partial.surfaceTotaleM2,
    typeLogement: partial.typeLogement,
    periodeConstruction: partial.periodeConstruction,
    iteItiRecente: partial.iteItiRecente,
    fenetres: partial.fenetres,
    sousSol: partial.sousSol,
    btdInstalle: partial.btdInstalle,
    vmcInstallee: partial.vmcInstallee,
    chauffage: partial.chauffage ?? "gaz",
    dpe: partial.dpe ?? "D",
    travauxCeeRecus: partial.travauxCeeRecus,
    nbPersonnes: partial.nbPersonnes ?? 2,
    trancheRevenu: partial.trancheRevenu ?? "modeste",
    adresse: partial.adresse ?? emptyAddress(),
    contact: partial.contact,
    rappel: partial.rappel,
  };
}

const PHASE_LABEL: Record<StepPhase, string> = {
  qualification: "Qualification",
  finalisation: "Finalisation",
  result: "Résultat",
};

function canProceed(stepId: SimulatorStepId, a: Partial<SimulationAnswers>): boolean {
  switch (stepId) {
    case "profil":
      return Boolean(a.profil);
    case "raison_sociale":
      return Boolean((a.raisonSociale ?? "").trim());
    case "patrimoine_type":
      return Boolean(a.patrimoineType);
    case "nb_logements":
      return typeof a.nbLogements === "number" && a.nbLogements >= 1;
    case "surface_totale":
      return typeof a.surfaceTotaleM2 === "number" && a.surfaceTotaleM2 >= 1;
    case "logement":
      return Boolean(a.typeLogement);
    case "construction":
      return Boolean(a.periodeConstruction);
    case "ite_iti":
      return typeof a.iteItiRecente === "boolean";
    case "fenetres":
      return Boolean(a.fenetres);
    case "sous_sol":
      return typeof a.sousSol === "boolean";
    case "btd":
      return typeof a.btdInstalle === "boolean";
    case "vmc":
      return typeof a.vmcInstallee === "boolean";
    case "chauffage":
      return Boolean(a.chauffage);
    case "chauffage_24_mois":
      return typeof a.chauffage24Mois === "boolean";
    case "dpe":
      return Boolean(a.dpe);
    case "age_logement":
      return Boolean(a.ageLogement);
    case "travaux_cee":
      return Boolean(a.travauxCeeRecus);
    case "foyer":
      return typeof a.nbPersonnes === "number" && a.nbPersonnes >= 1;
    case "tranche":
      return Boolean(a.trancheRevenu);
    case "adresse": {
      const ad = a.adresse;
      return Boolean(
        ad && ad.adresse.trim().length > 0 && /^\d{5}$/.test(ad.codePostal) && ad.ville.trim().length > 0,
      );
    }
    case "contact": {
      const c = a.contact;
      return Boolean(
        c &&
          c.civilite &&
          c.prenom.trim() &&
          c.nom.trim() &&
          c.email.includes("@") &&
          c.telephone.trim().length >= 6,
      );
    }
    case "rappel": {
      const r = a.rappel;
      return Boolean(r && r.date && r.heure);
    }
    case "preliminary_result":
    case "resultat":
      return true;
    default:
      return false;
  }
}

export type SimulatorCeeProps = {
  /** Quand vrai : rend dans un conteneur (modal) plutôt qu’en pleine page. */
  embedded?: boolean;
  /** Callback succès création lead (utilisé par le modal pour fermer + naviguer). */
  onLeadCreated?: (leadId: string) => void;
  /** Bouton « Annuler » (modal). */
  onCancel?: () => void;
  /**
   * Pré-remplissage (ex. réponses déjà collectées via le simulateur public).
   * Écrase les defaults (chauffage = 'gaz', etc.) pour les champs présents.
   */
  initialAnswers?: Partial<SimulationAnswers>;
  /**
   * Si défini : au lieu de créer un nouveau lead, on enregistre la simulation
   * sur ce lead existant (`saveSimulationForLeadAction`).
   */
  targetLeadId?: string;
};

export function SimulatorCee({
  embedded,
  onLeadCreated,
  onCancel,
  initialAnswers,
  targetLeadId,
}: SimulatorCeeProps = {}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Partial<SimulationAnswers>>(() => {
    const base: Partial<SimulationAnswers> = {
      chauffage: "gaz",
      dpe: "D",
      nbPersonnes: 2,
      trancheRevenu: "modeste",
      adresse: emptyAddress(),
      contact: emptyContact(),
      rappel: emptyRappel(),
    };
    const merged: Partial<SimulationAnswers> = { ...base, ...(initialAnswers ?? {}) };
    // Garantit que adresse/contact/rappel restent des objets complets même si
    // `initialAnswers` ne les fournit pas.
    merged.adresse = initialAnswers?.adresse ?? base.adresse;
    merged.contact = initialAnswers?.contact ?? base.contact;
    merged.rappel = initialAnswers?.rappel ?? base.rappel;
    return merged;
  });

  const fullAnswers = useMemo(() => toSimulationAnswers(answers), [answers]);
  const result = useMemo(() => computeResult(fullAnswers), [fullAnswers]);
  const hasAnyEligibility = result.pac.eligible || result.renov.eligible;

  /**
   * `forceCollect` = override agent : on garde le prospect même non éligible.
   * Active les étapes adresse / contact / rappel / résultat.
   */
  const [forceCollect, setForceCollect] = useState(false);

  const stepCtx: StepContext = useMemo(
    () => ({ forceCollect, hasAnyEligibility }),
    [forceCollect, hasAnyEligibility],
  );

  const activeSteps = useMemo(() => getActiveSteps(answers, stepCtx), [answers, stepCtx]);
  const [stepId, setStepId] = useState<SimulatorStepId>("profil");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ids = activeSteps.map((s) => s.id);
    if (!ids.includes(stepId)) {
      setStepId(ids[0] ?? "profil");
    }
  }, [activeSteps, stepId]);

  const stepIndex = Math.max(
    0,
    activeSteps.findIndex((s) => s.id === stepId),
  );
  const current = activeSteps[stepIndex];

  // Compteur de phase contextuel (Qualification X/N puis Finalisation Y/M).
  const phaseCounts = useMemo(() => countByPhase(activeSteps), [activeSteps]);
  const phasePosition = useMemo(() => {
    if (!current) return { idx: 0, total: 0 };
    const sameOrPrior = activeSteps.filter(
      (s, i) => s.phase === current.phase && i <= stepIndex,
    ).length;
    return { idx: sameOrPrior - 1, total: phaseCounts[current.phase] };
  }, [activeSteps, current, stepIndex, phaseCounts]);

  const zoneForTranches = detectZone(answers.adresse?.codePostal);
  const trancheOptions = useMemo(
    () => buildTranches(zoneForTranches, answers.nbPersonnes ?? 2),
    [zoneForTranches, answers.nbPersonnes],
  );

  function goNext() {
    const next = activeSteps[stepIndex + 1];
    if (next) setStepId(next.id);
  }

  function goPrev() {
    const prev = activeSteps[stepIndex - 1];
    if (prev) setStepId(prev.id);
  }

  function updateAndAdvance(patch: Partial<SimulationAnswers>) {
    setAnswers((prev) => {
      const next = { ...prev, ...patch };
      const nextActive = getActiveSteps(next, stepCtx);
      const idx = nextActive.findIndex((s) => s.id === stepId);
      const nextStep = idx >= 0 ? nextActive[idx + 1] : nextActive[0];
      if (nextStep) {
        setStepId(nextStep.id);
      }
      return next;
    });
  }

  async function onCreateLead(opts: { savedDespiteNonEligible?: boolean } = {}) {
    setSubmitting(true);
    try {
      const res = targetLeadId
        ? await saveSimulationForLeadAction(targetLeadId, fullAnswers, opts)
        : await submitSimulationAction(fullAnswers, opts);
      if (res.ok) {
        toast.success(targetLeadId ? "Simulation enregistrée" : "Lead créé");
        if (onLeadCreated) {
          onLeadCreated(res.leadId);
        } else {
          router.push(`/leads/${res.leadId}`);
        }
      } else {
        toast.error(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleForceCollectAndAdvance() {
    setForceCollect(true);
    // Le state `forceCollect` débloquera les steps adresse/contact/rappel.
    // On avance immédiatement à l’étape suivante (recompute en useEffect).
    setStepId("adresse");
  }

  function handleNewProspect() {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/leads");
    }
  }

  const nextDisabled = current ? !canProceed(current.id, answers) : true;
  const isResult = stepId === "resultat";
  const isPreliminary = stepId === "preliminary_result";

  return (
    <div
      className={
        embedded
          ? "flex h-full flex-col bg-white"
          : "min-h-[calc(100vh-4rem)] bg-white pb-28"
      }
    >
      <div className={embedded ? "flex-1 overflow-y-auto" : ""}>
        {/* Zone illustration : fond blanc, contenu pédagogique (image + texte). */}
        {current?.illustration ? (
          <div className="border-b border-violet-100 bg-white px-4 py-6">
            <StepIllustration {...current.illustration} />
          </div>
        ) : null}

        {/* Zone formulaire : fond lavande, progress + contrôles. */}
        <div className="bg-gradient-to-b from-[#f4f0ff] to-white px-4 py-6">
          <div className="mx-auto max-w-2xl space-y-4">
            {!isResult && current ? (
              <ProgressHeader
                stepIndex={phasePosition.idx}
                stepCount={phasePosition.total}
                label={current.label}
                phaseLabel={PHASE_LABEL[current.phase]}
              />
            ) : null}

            {stepId === "profil" ? (
          <div className="space-y-4">
            <RadioCard
              name="profil"
              value={answers.profil}
              onChange={(profil) => updateAndAdvance({ profil })}
              options={PROFIL_OPTIONS}
            />
          </div>
        ) : null}

        {stepId === "raison_sociale" ? (
          <div className="space-y-2">
            <Label htmlFor="rs">Raison sociale</Label>
            <Input
              id="rs"
              value={answers.raisonSociale ?? ""}
              onChange={(e) => setAnswers((p) => ({ ...p, raisonSociale: e.target.value }))}
              className="rounded-xl border-violet-200 bg-white"
              placeholder="Ex. SCI LES LILAS, SEM Habitat…"
            />
          </div>
        ) : null}

        {stepId === "patrimoine_type" ? (
          <RadioCard
            name="patrimoine"
            value={answers.patrimoineType}
            onChange={(patrimoineType) => updateAndAdvance({ patrimoineType })}
            options={PATRIMOINE_OPTIONS}
          />
        ) : null}

        {stepId === "nb_logements" ? (
          <CounterInput
            label="Nombre de logements du patrimoine"
            value={answers.nbLogements ?? 1}
            onChange={(nbLogements) => setAnswers((p) => ({ ...p, nbLogements }))}
            min={1}
            max={500}
          />
        ) : null}

        {stepId === "surface_totale" ? (
          <div className="space-y-2">
            <Label htmlFor="surf">Surface totale chauffée (m²)</Label>
            <Input
              id="surf"
              inputMode="numeric"
              value={answers.surfaceTotaleM2 ?? ""}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ""));
                setAnswers((p) => ({ ...p, surfaceTotaleM2: Number.isFinite(n) && n > 0 ? n : undefined }));
              }}
              className="rounded-xl border-violet-200 bg-white"
              placeholder="Ex. 1200"
            />
          </div>
        ) : null}

        {stepId === "logement" ? (
          <RadioCard
            name="logement"
            value={answers.typeLogement}
            onChange={(typeLogement) => updateAndAdvance({ typeLogement })}
            options={LOGEMENT_OPTIONS}
          />
        ) : null}

        {stepId === "construction" ? (
          <RadioCard
            name="construction"
            value={answers.periodeConstruction}
            onChange={(periodeConstruction) => updateAndAdvance({ periodeConstruction })}
            options={CONSTRUCTION_OPTIONS}
          />
        ) : null}

        {stepId === "ite_iti" ? (
          <div className="space-y-3">
            <StepTip>
              Une isolation thermique récente (intérieure ou extérieure) impacte fortement les calculs CEE.
            </StepTip>
            <YesNo
              value={answers.iteItiRecente}
              onChange={(iteItiRecente) => updateAndAdvance({ iteItiRecente })}
            />
          </div>
        ) : null}

        {stepId === "fenetres" ? (
          <RadioCard
            name="fenetres"
            value={answers.fenetres}
            onChange={(fenetres) => updateAndAdvance({ fenetres })}
            options={FENETRES_OPTIONS}
          />
        ) : null}

        {stepId === "sous_sol" ? (
          <YesNo value={answers.sousSol} onChange={(sousSol) => updateAndAdvance({ sousSol })} />
        ) : null}

        {stepId === "btd" ? (
          <div className="space-y-3">
            <StepTip>BTD = Bouche de Thermo-Diffusion (régulation de chauffage central).</StepTip>
            <YesNo
              value={answers.btdInstalle}
              onChange={(btdInstalle) => updateAndAdvance({ btdInstalle })}
            />
          </div>
        ) : null}

        {stepId === "vmc" ? (
          <YesNo
            value={answers.vmcInstallee}
            onChange={(vmcInstallee) => updateAndAdvance({ vmcInstallee })}
          />
        ) : null}

        {stepId === "chauffage" ? (
          <RadioCard
            name="chauffage"
            value={answers.chauffage}
            onChange={(chauffage) => updateAndAdvance({ chauffage })}
            options={CHAUFFAGE_OPTIONS}
          />
        ) : null}

        {stepId === "chauffage_24_mois" ? (
          <YesNo
            value={answers.chauffage24Mois}
            yesLabel="⚠️ Oui, remplacement récent"
            noLabel="✅ Non, chauffage ≥ 24 mois"
            onChange={(chauffage24Mois) => updateAndAdvance({ chauffage24Mois })}
          />
        ) : null}

        {stepId === "dpe" ? (
          <DpeSelector
            value={answers.dpe}
            onChange={(dpe: DpeLetter) => updateAndAdvance({ dpe })}
          />
        ) : null}

        {stepId === "age_logement" ? (
          <RadioCard
            name="age_logement"
            value={answers.ageLogement}
            onChange={(ageLogement) => updateAndAdvance({ ageLogement })}
            options={[
              { value: "moins_15_ans", label: "Moins de 15 ans" },
              { value: "plus_15_ans", label: "Plus de 15 ans" },
            ]}
          />
        ) : null}

        {stepId === "travaux_cee" ? (
          <div className="space-y-3">
            <StepTip>
              Travaux financés via les Certificats d’Économies d’Énergie (CEE) ces 5 dernières années.
            </StepTip>
            <YesNoUnknown<TravauxCeeRecus>
              value={answers.travauxCeeRecus}
              onChange={(travauxCeeRecus) => updateAndAdvance({ travauxCeeRecus })}
              options={TRAVAUX_CEE_OPTIONS}
            />
          </div>
        ) : null}

        {stepId === "foyer" ? (
          <CounterInput
            label="Nombre de personnes au foyer fiscal"
            value={answers.nbPersonnes ?? 1}
            onChange={(nbPersonnes) => setAnswers((p) => ({ ...p, nbPersonnes }))}
          />
        ) : null}

        {stepId === "tranche" ? (
          <TrancheSelector
            value={answers.trancheRevenu}
            onChange={(trancheRevenu: TrancheRevenu) => updateAndAdvance({ trancheRevenu })}
            options={trancheOptions}
          />
        ) : null}

        {stepId === "adresse" ? (
          <AddressInput
            value={answers.adresse ?? emptyAddress()}
            onChange={(adresse) => setAnswers((p) => ({ ...p, adresse }))}
          />
        ) : null}

        {stepId === "contact" ? (
          <ContactForm
            value={answers.contact ?? emptyContact()}
            onChange={(contact) => setAnswers((p) => ({ ...p, contact }))}
          />
        ) : null}

        {stepId === "rappel" ? (
          <RappelForm
            value={answers.rappel ?? emptyRappel()}
            onChange={(rappel) => setAnswers((p) => ({ ...p, rappel }))}
          />
        ) : null}

            {stepId === "preliminary_result" ? <PreliminaryResult result={result} /> : null}

            {stepId === "resultat" ? <ResultScreen answers={fullAnswers} result={result} /> : null}
          </div>
        </div>
      </div>

      <BottomCta embedded={embedded}>
        {onCancel ? <GhostCtaButton onClick={onCancel}>Annuler</GhostCtaButton> : null}
        {stepIndex > 0 && !isResult && !isPreliminary ? (
          <GhostCtaButton onClick={goPrev}>Retour</GhostCtaButton>
        ) : null}
        <div className="flex-1" />

        {isPreliminary ? (
          hasAnyEligibility ? (
            <PrimaryCtaButton onClick={goNext}>Continuer — Enregistrer le lead</PrimaryCtaButton>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <PrimaryCtaButton onClick={handleNewProspect}>Nouveau prospect</PrimaryCtaButton>
              <button
                type="button"
                onClick={handleForceCollectAndAdvance}
                className="text-xs text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
              >
                Enregistrer quand même ce prospect
              </button>
            </div>
          )
        ) : !isResult ? (
          <PrimaryCtaButton disabled={nextDisabled} onClick={goNext}>
            Continuer
          </PrimaryCtaButton>
        ) : (
          <PrimaryCtaButton
            loading={submitting}
            onClick={() => onCreateLead({ savedDespiteNonEligible: forceCollect })}
          >
            {forceCollect ? "Enregistrer (non éligible)" : "Créer le lead"}
          </PrimaryCtaButton>
        )}
      </BottomCta>
    </div>
  );
}
