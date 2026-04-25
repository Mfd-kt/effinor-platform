import { describe, expect, it } from "vitest";

import {
  computePacEligibility,
  computeRenovGlobaleEligibility,
  computeResult,
  isCibleIdeale,
} from "@/features/simulator-cee/domain/eligibility-rules";
import type { SimulationAnswers } from "@/features/simulator-cee/domain/types";

function baseOwnerMaison(overrides: Partial<SimulationAnswers> = {}): SimulationAnswers {
  return {
    profil: "proprietaire_occupant",
    typeLogement: "maison",
    periodeConstruction: "avant_2000",
    iteItiRecente: false,
    fenetres: "simple_vitrage_bois",
    sousSol: false,
    btdInstalle: false,
    vmcInstallee: false,
    chauffage: "gaz",
    dpe: "D",
    travauxCeeRecus: "non",
    nbPersonnes: 2,
    trancheRevenu: "modeste",
    adresse: { adresse: "1 rue de Paris", codePostal: "75001", ville: "Paris" },
    contact: {
      civilite: "M.",
      prenom: "Jean",
      nom: "DUPONT",
      email: "j@d.fr",
      telephone: "+33612345678",
    },
    rappel: { date: "2026-05-01", heure: "10:00" },
    ...overrides,
  };
}

describe("computeResult — règles BAR-TH-171 / 174 / 179", () => {
  it("Cas A — proprio + maison + après 2000 + gaz + double vitrage + sous-sol → PAC OUI (171), Renov SC1", () => {
    const r = computeResult(
      baseOwnerMaison({
        periodeConstruction: "apres_2000",
        chauffage: "gaz",
        dpe: "D",
        fenetres: "double_vitrage",
        sousSol: true,
      }),
    );
    expect(r.pac.eligible).toBe(true);
    expect(r.pac.operation).toBe("BAR-TH-171");
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.scenario).toBe("SC1");
  });

  it("Cas B — proprio + maison + avant 2000 + granulés + sous-sol → PAC NON, Renov SC1 + pkg complet", () => {
    const r = computeResult(
      baseOwnerMaison({
        periodeConstruction: "avant_2000",
        iteItiRecente: false,
        chauffage: "granules",
        dpe: "F",
        sousSol: true,
        btdInstalle: false,
        vmcInstallee: false,
        fenetres: "double_vitrage",
      }),
    );
    expect(r.pac.eligible).toBe(false);
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.scenario).toBe("SC1");
    expect(r.renov.package).toEqual(["combles", "sous_sol", "btd", "vmc"]);
  });

  it("Cas C — proprio + maison + avant 2000 + ITE OUI + gaz + pas de sous-sol → PAC OUI (171), Renov SC2", () => {
    const r = computeResult(
      baseOwnerMaison({
        periodeConstruction: "avant_2000",
        iteItiRecente: true,
        chauffage: "gaz",
        sousSol: false,
        fenetres: "double_vitrage",
      }),
    );
    expect(r.pac.eligible).toBe(true);
    expect(r.pac.operation).toBe("BAR-TH-171");
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.scenario).toBe("SC2");
    expect(r.renov.package).toContain("combles");
    expect(r.renov.package).toContain("murs");
  });

  it("Cas D — proprio + maison + avant 2000 + gaz + pas d'ITE → PAC OUI, Renov NON", () => {
    const r = computeResult(
      baseOwnerMaison({
        periodeConstruction: "avant_2000",
        iteItiRecente: false,
        chauffage: "gaz",
        fenetres: "double_vitrage",
      }),
    );
    expect(r.pac.eligible).toBe(true);
    expect(r.renov.eligible).toBe(false);
  });

  it("Cas E — SCI + appartements + gaz → PAC OUI (179), Renov OUI (toutes DPE)", () => {
    const r = computeResult(
      baseOwnerMaison({
        profil: "sci",
        typeLogement: "appartement",
        chauffage: "gaz",
        dpe: "G",
        raisonSociale: "SCI Test",
        patrimoineType: "appartements",
        nbLogements: 12,
        surfaceTotaleM2: 800,
        fenetres: "double_vitrage",
      }),
    );
    expect(r.pac.eligible).toBe(true);
    expect(r.pac.operation).toBe("BAR-TH-179");
    // SCI/appartement : appartement bloque BAR-TH-174 même pour SCI ?
    // -> Selon nos règles : appartement → pas éligible BAR-TH-174 (test à valider)
    // Hmm, le spec dit "BAR-TH-174 — uniquement maisons individuelles" tout en haut,
    // donc oui on bloque même pour SCI en appartement.
    expect(r.renov.eligible).toBe(false);
  });

  it("Cas F — proprio + maison + avant 2000 + élec + simple vitrage + pas d'ITE → PAC NON, Renov NON", () => {
    const r = computeResult(
      baseOwnerMaison({
        periodeConstruction: "avant_2000",
        iteItiRecente: false,
        chauffage: "elec",
        fenetres: "simple_vitrage_bois",
      }),
    );
    expect(r.pac.eligible).toBe(false);
    expect(r.renov.eligible).toBe(false);
  });
});

describe("computeResult — règles finales (sec. 8 du brief)", () => {
  const baseOwner = (): SimulationAnswers =>
    baseOwnerMaison({
      profil: "proprietaire_occupant",
      typeLogement: "maison",
      periodeConstruction: "apres_2000",
      fenetres: "double_vitrage",
      sousSol: true,
      btdInstalle: false,
      vmcInstallee: false,
      iteItiRecente: false,
    });

  it("Règle 1 — simple vitrage bois → PAC éligible BAR-TH-171, rénov NON", () => {
    const r = computeResult({ ...baseOwner(), fenetres: "simple_vitrage_bois", chauffage: "gaz" });
    expect(r.pac.eligible).toBe(true);
    expect(r.pac.operation).toBe("BAR-TH-171");
    expect(r.renov.eligible).toBe(false);
  });

  it("Règle 2 — fioul → PAC éligible BAR-TH-171, rénov NON", () => {
    const r = computeResult({ ...baseOwner(), chauffage: "fioul" });
    expect(r.pac.eligible).toBe(true);
    expect(r.pac.operation).toBe("BAR-TH-171");
    expect(r.renov.eligible).toBe(false);
  });

  it("fioul + SCI maison → PAC BAR-TH-179, rénov NON (fioul = exclusion absolue 174)", () => {
    const r = computeResult({ ...baseOwner(), profil: "sci", chauffage: "fioul" });
    expect(r.pac.operation).toBe("BAR-TH-179");
    // Note : la règle "fioul = exclusion 174" est absolue (avant le check SCI)
    expect(r.renov.eligible).toBe(false);
  });

  it("Règle 3 — avant 2000 + pac_air_eau → rénov éligible SC1 (sans ITE), PAC NON (déjà installée)", () => {
    const r = computeResult({
      ...baseOwner(),
      periodeConstruction: "avant_2000",
      chauffage: "pac_air_eau",
      iteItiRecente: false,
    });
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.scenario).toBe("SC1");
    expect(r.pac.eligible).toBe(false);
  });

  it("avant 2000 + pac_air_air → rénov éligible SC2 sans sous-sol", () => {
    const r = computeResult({
      ...baseOwner(),
      periodeConstruction: "avant_2000",
      chauffage: "pac_air_air",
      sousSol: false,
      iteItiRecente: false,
    });
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.scenario).toBe("SC2");
  });

  it("double vitrage + après 2000 + gaz → rénov éligible SC1", () => {
    const r = computeResult({ ...baseOwner(), chauffage: "gaz" });
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.scenario).toBe("SC1");
  });

  it("proprio occupant appartement + gaz → PAC BAR-TH-171, pas de 174", () => {
    const r = computeResult({ ...baseOwner(), typeLogement: "appartement", chauffage: "gaz" });
    expect(r.pac.eligible).toBe(true);
    expect(r.pac.operation).toBe("BAR-TH-171");
    expect(r.renov.eligible).toBe(false);
  });

  it("avant 2000 + ITE récente + gaz → rénov éligible", () => {
    const r = computeResult({
      ...baseOwner(),
      periodeConstruction: "avant_2000",
      iteItiRecente: true,
      chauffage: "gaz",
    });
    expect(r.renov.eligible).toBe(true);
  });

  it("avant 2000 + pas ITE + gaz → rénov non éligible", () => {
    const r = computeResult({
      ...baseOwner(),
      periodeConstruction: "avant_2000",
      iteItiRecente: false,
      chauffage: "gaz",
    });
    expect(r.renov.eligible).toBe(false);
  });
});

describe("computePacEligibility — bloqueurs", () => {
  it("pac_air_eau déjà installée → non éligible", () => {
    const r = computePacEligibility(baseOwnerMaison({ chauffage: "pac_air_eau" }));
    expect(r.eligible).toBe(false);
    expect(r.raison).toMatch(/PAC déjà installée/);
  });

  it("pac_air_air déjà installée → non éligible", () => {
    const r = computePacEligibility(baseOwnerMaison({ chauffage: "pac_air_air" }));
    expect(r.eligible).toBe(false);
  });

  it("locataire → non éligible", () => {
    const r = computePacEligibility(baseOwnerMaison({ profil: "locataire" }));
    expect(r.eligible).toBe(false);
    expect(r.raison).toMatch(/propriétaires/i);
  });

  it("bois → non éligible PAC", () => {
    const r = computePacEligibility(baseOwnerMaison({ chauffage: "bois" }));
    expect(r.eligible).toBe(false);
  });
});

describe("computeRenovGlobaleEligibility — bloqueurs", () => {
  it("locataire → non éligible", () => {
    const r = computeRenovGlobaleEligibility(baseOwnerMaison({ profil: "locataire" }));
    expect(r.eligible).toBe(false);
  });

  it("appartement → non éligible (même SCI)", () => {
    const r = computeRenovGlobaleEligibility(
      baseOwnerMaison({ profil: "sci", typeLogement: "appartement", fenetres: "double_vitrage" }),
    );
    expect(r.eligible).toBe(false);
    expect(r.raison).toMatch(/maisons individuelles/i);
  });

  it("simple vitrage bois → non éligible (exclusion absolue)", () => {
    const r = computeRenovGlobaleEligibility(
      baseOwnerMaison({
        periodeConstruction: "apres_2000",
        chauffage: "gaz",
        fenetres: "simple_vitrage_bois",
      }),
    );
    expect(r.eligible).toBe(false);
    expect(r.raison).toMatch(/simple vitrage/i);
  });
});

describe("Financement (BAR-TH-174 V A80.3)", () => {
  const baseEligibleOwner = (): SimulationAnswers =>
    baseOwnerMaison({
      profil: "proprietaire_occupant",
      typeLogement: "maison",
      periodeConstruction: "apres_2000",
      fenetres: "double_vitrage",
      sousSol: true,
      btdInstalle: false,
      vmcInstallee: false,
      iteItiRecente: false,
      chauffage: "gaz",
      chauffage24Mois: false,
      travauxCeeRecus: "non",
    });

  it("PO modeste + DPE D → CEE ×2", () => {
    const r = computeResult({ ...baseEligibleOwner(), trancheRevenu: "modeste", dpe: "D" });
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.financement).toBe("cee_x2");
    expect(r.renov.financementLabel).toMatch(/Coup de pouce/);
  });

  it("PO supérieur + DPE D → CEE simple", () => {
    const r = computeResult({ ...baseEligibleOwner(), trancheRevenu: "superieur", dpe: "D" });
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.financement).toBe("cee_simple");
  });

  it("PO modeste + DPE F + plus de 15 ans → ANAH (techniquement éligible mais bascule)", () => {
    const r = computeResult({
      ...baseEligibleOwner(),
      trancheRevenu: "modeste",
      dpe: "F",
      ageLogement: "plus_15_ans",
    });
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.financement).toBe("anah_bascule");
  });

  it("PO modeste + DPE F + moins de 15 ans → CEE ×2 (pas de bascule)", () => {
    const r = computeResult({
      ...baseEligibleOwner(),
      trancheRevenu: "modeste",
      dpe: "F",
      ageLogement: "moins_15_ans",
    });
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.financement).toBe("cee_x2");
  });

  it("Renov non éligible → financement non_applicable", () => {
    const r = computeResult({
      ...baseEligibleOwner(),
      fenetres: "simple_vitrage_bois",
    });
    expect(r.renov.eligible).toBe(false);
    expect(r.renov.financement).toBe("non_applicable");
  });
});

describe("Chauffage 24 mois (bloqueur BAR-TH-174)", () => {
  it("chauffage changé < 24 mois → rénov non éligible", () => {
    const r = computeResult(
      baseOwnerMaison({
        periodeConstruction: "apres_2000",
        fenetres: "double_vitrage",
        chauffage: "gaz",
        chauffage24Mois: true,
      }),
    );
    expect(r.renov.eligible).toBe(false);
    expect(r.renov.raison ?? "").toMatch(/24 derniers mois/);
  });
});

describe("Travaux CEE antérieurs (cumul interdit)", () => {
  it("travaux CEE = oui → rénov non éligible", () => {
    const r = computeResult(
      baseOwnerMaison({
        periodeConstruction: "apres_2000",
        fenetres: "double_vitrage",
        chauffage: "gaz",
        travauxCeeRecus: "oui",
      }),
    );
    expect(r.renov.eligible).toBe(false);
    expect(r.renov.raison ?? "").toMatch(/cumul/i);
  });

  it("travaux CEE = jsp → éligible avec warning", () => {
    const r = computeResult(
      baseOwnerMaison({
        periodeConstruction: "apres_2000",
        fenetres: "double_vitrage",
        chauffage: "gaz",
        travauxCeeRecus: "jsp",
      }),
    );
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.warnings.length).toBeGreaterThan(0);
    expect(r.renov.warnings[0]).toMatch(/visite technique/i);
  });

  it("travaux CEE = non → éligible sans warning", () => {
    const r = computeResult(
      baseOwnerMaison({
        periodeConstruction: "apres_2000",
        fenetres: "double_vitrage",
        chauffage: "gaz",
        travauxCeeRecus: "non",
      }),
    );
    expect(r.renov.eligible).toBe(true);
    expect(r.renov.warnings.length).toBe(0);
  });
});

describe("Flow intermédiaire — éligibilité globale", () => {
  it("locataire → aucune éligibilité (PAC + Renov refusés)", () => {
    const r = computeResult(baseOwnerMaison({ profil: "locataire" }));
    expect(r.pac.eligible || r.renov.eligible).toBe(false);
    expect(r.doNotDispatch).toBe(true);
  });

  it("proprio + fioul + maison après 2000 → PAC seul éligible (BAR-TH-171)", () => {
    const r = computeResult(
      baseOwnerMaison({
        periodeConstruction: "apres_2000",
        chauffage: "fioul",
        fenetres: "double_vitrage",
      }),
    );
    expect(r.pac.eligible).toBe(true);
    expect(r.pac.operation).toBe("BAR-TH-171");
    expect(r.renov.eligible).toBe(false);
    // hasAnyEligibility doit être true → flow finalisation autorisé sans override
    expect(r.pac.eligible || r.renov.eligible).toBe(true);
  });
});

describe("isCibleIdeale", () => {
  const base: SimulationAnswers = {
    profil: "proprietaire_occupant",
    typeLogement: "maison",
    periodeConstruction: "apres_2000",
    iteItiRecente: false,
    fenetres: "double_vitrage",
    sousSol: true,
    btdInstalle: false,
    vmcInstallee: false,
    chauffage: "gaz",
    dpe: "D",
    nbPersonnes: 2,
    trancheRevenu: "modeste",
    adresse: { adresse: "1 rue", codePostal: "75001", ville: "Paris" },
  };

  it("config complète + modeste → true", () => {
    expect(isCibleIdeale(base)).toBe(true);
  });
  it("config complète + très modeste → true", () => {
    expect(isCibleIdeale({ ...base, trancheRevenu: "tres_modeste" })).toBe(true);
  });
  it("config complète + intermédiaire → false", () => {
    expect(isCibleIdeale({ ...base, trancheRevenu: "intermediaire" })).toBe(false);
  });
  it("config complète + supérieur → false", () => {
    expect(isCibleIdeale({ ...base, trancheRevenu: "superieur" })).toBe(false);
  });
  it("SCI + modeste + reste config OK → true", () => {
    expect(isCibleIdeale({ ...base, profil: "sci" })).toBe(true);
  });
  it("bailleur + modeste + reste config OK → true", () => {
    expect(isCibleIdeale({ ...base, profil: "bailleur" })).toBe(true);
  });
  it("locataire → false même si reste OK", () => {
    expect(isCibleIdeale({ ...base, profil: "locataire" })).toBe(false);
  });
  it("appartement → false", () => {
    expect(isCibleIdeale({ ...base, typeLogement: "appartement" })).toBe(false);
  });
  it("avant 2000 → false", () => {
    expect(isCibleIdeale({ ...base, periodeConstruction: "avant_2000" })).toBe(false);
  });
  it("simple vitrage bois → false", () => {
    expect(isCibleIdeale({ ...base, fenetres: "simple_vitrage_bois" })).toBe(false);
  });
  it("pas de sous-sol → false", () => {
    expect(isCibleIdeale({ ...base, sousSol: false })).toBe(false);
  });
  it("BTD déjà installé → false", () => {
    expect(isCibleIdeale({ ...base, btdInstalle: true })).toBe(false);
  });
  it("VMC déjà installée → false", () => {
    expect(isCibleIdeale({ ...base, vmcInstallee: true })).toBe(false);
  });
});
