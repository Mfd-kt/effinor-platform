import { describe, expect, it } from "vitest";

import type { StudyPdfViewModel, StudyProductViewModel } from "../domain/types";
import { renderLeadStudyHtml } from "./render-study-html";
import { renderPresentationHtml } from "./render-presentation-html";
import { renderAccordHtml } from "./render-accord-html";

function sampleVm(): StudyPdfViewModel {
  return {
    templateVersion: "v3",
    generatedAtIso: new Date().toISOString(),
    generatedByLabel: "Expert",
    ceeSolutionKind: "destrat",
    presentationTemplateKey: "destrat_v1",
    agreementTemplateKey: "destrat_v1",
    simulationVersusSheetMismatch: false,
    equipmentQuantity: 6,
    pacCommercialMessage: null,
    client: {
      companyName: "Client Test",
      contactName: "Marie Dupont",
      contactRole: "DG",
      phone: "06",
      email: "a@b.fr",
      department: "91",
      activityType: "INDUSTRIE",
    },
    site: {
      label: "Massy",
      addressLine: "1 rue A",
      postalCode: "91300",
      city: "Massy",
      type: "INDUSTRIE",
      surfaceM2: 2500,
      heightM: 8,
      volumeM3: 20000,
      heatingMode: "Gaz",
    },
    simulation: {
      model: "generfeu",
      neededDestrat: 6,
      modelCapacityM3h: 10000,
      powerKw: 300,
      airChangeRate: 2.5,
      annualConsumptionKwh: 500000,
      annualCostEuro: 60000,
      annualSavingKwh: 150000,
      annualSavingEuro: 18000,
      co2SavedTons: 30,
      ceePrimeEuro: 12000,
      installTotalEuro: 22000,
      restToChargeEuro: 10000,
      score: 80,
    },
    qualification: {
      status: "pending",
      notes: ["note a"],
      contextSummary: "ok",
    },
    media: {
      logoUrl: null,
      aerialPhotoUrl: null,
      cadastralPhotoUrl: null,
      studyMediaUrls: [],
    },
    comparables: [],
    products: [
      {
        id: "generfeu",
        displayName: "Generfeu Haute Performance",
        description: "Description test.",
        imageUrlResolved: null,
        galleryUrls: [],
        specsForDisplay: [{ label: "Débit", value: "10 000 m³/h" }],
        keyMetricsForDisplay: [{ label: "Repère", value: "Grand volume" }],
        rationaleText: "Phrase de justification test.",
      },
    ] satisfies StudyProductViewModel[],
  };
}

function samplePacVm(): StudyPdfViewModel {
  const vm = sampleVm();
  return {
    ...vm,
    ceeSolutionKind: "pac",
    presentationTemplateKey: "pac_v1",
    agreementTemplateKey: "pac_v1",
    equipmentQuantity: 2,
    products: [
      {
        id: "bosch-pac",
        displayName: "Bosch PAC air / eau",
        description: "PAC test.",
        imageUrlResolved: null,
        galleryUrls: [],
        specsForDisplay: [{ label: "Puissance", value: "12 kW" }],
        keyMetricsForDisplay: [],
        rationaleText: "Justification PAC.",
      },
    ] satisfies StudyProductViewModel[],
  };
}

describe("renderLeadStudyHtml (legacy)", () => {
  it("renders core sections", () => {
    const html = renderLeadStudyHtml(sampleVm());
    expect(html).toContain("Étude d'opportunité");
    expect(html).toContain("Équipement préconisé");
    expect(html).toContain("Accord de principe");
  });
});

describe("renderPresentationHtml", () => {
  it("renders premium brochure sections", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("Étude d'opportunité");
    expect(html).toContain("Déstratification d'air");
    expect(html).toContain("Client Test");
    expect(html).toContain("Generfeu Haute Performance");
    expect(html).toContain("Impact économique");
    expect(html).toContain("Conclusion de l'étude");
  });

  it("renders cover KPIs with correct text", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("Économie annuelle");
    expect(html).toContain("Coût installation estimé");
    expect(html).toContain("Reste à charge");
  });

  it("renders impact banner on cover", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("le financement via les CEE");
  });

  it("renders TotalEnergies partner block on cover", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("Partenaire CEE — TotalEnergies");
    expect(html).toContain("partenaire du dispositif");
    expect(html).toContain("édité par Effinor");
  });

  it("renders TotalEnergies logo in page header on every page", () => {
    const html = renderPresentationHtml(sampleVm());
    const logoCount = html.split("pg-head__te").length - 1;
    expect(logoCount).toBeGreaterThanOrEqual(4);
  });

  it("renders CEE financing steps", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("Obligation réglementaire");
    expect(html).toContain("Financement CEE");
    expect(html).toContain("Votre bénéfice");
  });

  it("renders exact problem section content", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("Vous payez pour chauffer");
    expect(html).toContain("surconsommation évitable");
  });

  it("renders quote block", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("Vous ne produisez pas plus de chaleur");
    expect(html).toContain("Vous utilisez celle que vous payez déjà");
  });

  it("renders hypothesis section", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("Hypothèses de calcul");
    expect(html).toContain("Taux d'économie indicatif");
  });

  it("renders decision reading box", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("cohérence technique et économique");
    expect(html).toContain("Le devis définitif");
  });

  it("renders transition to accord", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("Prêt à avancer");
    expect(html).toContain("accord de principe");
  });

  it("handles product fallback image", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("Visuel non disponible");
  });

  it("renders separate product page for single product", () => {
    const vm = sampleVm();
    vm.products = [vm.products[0]];
    const html = renderPresentationHtml(vm);
    expect(html).toContain("Équipement préconisé");
    expect(html).not.toContain("Équipements préconisés");
  });

  it("renders plural title for multiple products", () => {
    const vm = sampleVm();
    vm.products = [vm.products[0], { ...vm.products[0], id: "ds7", displayName: "DS7" }];
    const html = renderPresentationHtml(vm);
    expect(html).toContain("Équipements préconisés");
  });

  it("omits product section when no products", () => {
    const vm = sampleVm();
    vm.products = [];
    const html = renderPresentationHtml(vm);
    expect(html).not.toContain("Équipement préconisé");
    expect(html).not.toContain("Generfeu Haute Performance");
  });

  it("renders PAC-specific brochure copy when ceeSolutionKind is pac", () => {
    const vm = samplePacVm();
    vm.comparables = [
      {
        id: "c-pac",
        title: "Référence test",
        siteType: "Tertiaire",
        surfaceM2: 2000,
        heightM: 11,
        heatingMode: "Gaz",
        measuredResult: "Résultat",
        savingEuroYear: 1000,
        invoiceDropPercent: 20,
        installationDurationDays: 2,
        photoUrl: null,
        badge: "Réf.",
      },
    ];
    const html = renderPresentationHtml(vm);
    expect(html).toContain("Pompe à chaleur air / eau");
    expect(html).toContain("bâtiments tertiaires et résidentiels (collectif)");
    expect(html).toContain("Pré-étude pour chauffage et eau chaude sanitaire en tertiaire ou résidentiel collectif");
    expect(html).toContain("Chauffage performant pour le tertiaire");
    expect(html).toContain("les pompes à chaleur air / eau performantes (tertiaire, résidentiel collectif)");
    expect(html).toContain(
      "Illustration indicative — gains liés au chauffage en tertiaire et résidentiel collectif selon zone climatique",
    );
    expect(html).not.toContain("Vous payez pour chauffer");
    expect(html).not.toContain("Volume / hauteur");
    expect(html).not.toContain("Hauteur <strong>");
    expect(html).not.toContain("11 m");
  });

  it("embeds ERP charte primary color in presentation CSS", () => {
    const html = renderPresentationHtml(sampleVm());
    expect(html).toContain("#10B981");
    expect(html).toContain("#059669");
  });

  it("renders comparables and CEE financing", () => {
    const vm = sampleVm();
    vm.comparables = [
      {
        id: "c1",
        title: "Entrepôt Alpha",
        siteType: "LOGISTIQUE",
        surfaceM2: 4000,
        heightM: 10,
        heatingMode: "Gaz",
        measuredResult: "Bonne perf",
        savingEuroYear: 8000,
        invoiceDropPercent: 25,
        installationDurationDays: 3,
        photoUrl: null,
        badge: "Référence",
      },
    ];
    const html = renderPresentationHtml(vm);
    expect(html).toContain("Entrepôt Alpha");
    expect(html).toContain("Comment votre installation est financée");
  });
});

describe("renderAccordHtml", () => {
  it("renders accord title and subtitle", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("Accord de principe de lancement");
    expect(html).toContain("validation préalable à instruction technique");
    expect(html).toContain("Client Test");
  });

  it("renders intro paragraph", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("formalise l'accord de principe du client");
    expect(html).toContain("instruction technique et administrative");
  });

  it("renders client and site info", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("Société cliente");
    expect(html).toContain("Site concerné");
    expect(html).toContain("Marie Dupont");
    expect(html).toContain("1 rue A");
  });

  it("renders project summary", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("Rappel synthétique");
    expect(html).toContain("déstratification");
    expect(html).toContain("generfeu");
  });

  it("renders effet du present accord block", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("Effet du présent accord");
    expect(html).toContain("poursuivre l'instruction technique");
    expect(html).toContain("validation du principe");
    expect(html).toContain("dossier administratif et CEE");
    expect(html).toContain("offre définitive");
  });

  it("renders signature section with client intro text", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("Signature du client");
    expect(html).toContain("confirme son accord de principe");
    expect(html).toContain("Nom");
    expect(html).toContain("Fonction");
    expect(html).toContain("Société");
    expect(html).toContain("Date");
    expect(html).toContain("Signature + cachet");
  });

  it("renders KPIs", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("Économie annuelle");
    expect(html).toContain("Coût installation estimé");
    expect(html).toContain("Reste à charge");
  });

  it("renders clause with all three paragraphs", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("devis définitif");
    expect(html).toContain("ordre de service");
    expect(html).toContain("validation complète");
    expect(html).toContain("engagement financier immédiat");
  });

  it("renders TotalEnergies partner block", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("Partenaire CEE — TotalEnergies");
    expect(html).toContain("partenaire de TotalEnergies");
  });

  it("renders TotalEnergies logo and Effinor logo in accord", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("TotalEnergies");
    expect(html).toContain("EFFINOR");
    expect(html).toContain("pg-foot");
  });

  it("renders legal footer", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("EFFINOR LIGHTING");
    expect(html).toContain("SIRET 907 547 665");
  });

  it("renders simplified equipment table with Qté column", () => {
    const html = renderAccordHtml(sampleVm());
    expect(html).toContain("Generfeu Haute Performance");
    expect(html).toContain("Équipement retenu");
    expect(html).toContain("Qté");
    expect(html).toContain("Repères techniques");
  });

  it("omits equipment table when no products", () => {
    const vm = sampleVm();
    vm.products = [];
    const html = renderAccordHtml(vm);
    expect(html).not.toContain("Équipement retenu");
    expect(html).not.toContain("Generfeu Haute Performance");
  });

  it("renders PAC-specific accord copy when ceeSolutionKind is pac", () => {
    const html = renderAccordHtml(samplePacVm());
    expect(html).toContain("Projet pompe à chaleur air / eau (tertiaire et résidentiel collectif)");
    expect(html).toContain("projet de pompe à chaleur air / eau");
    expect(html).toContain("tertiaire et résidentiel collectif — économies annuelles indicatives");
    expect(html).toContain("Bosch PAC air / eau");
    expect(html).not.toContain("déstratification");
    expect(html).not.toContain("<dt>Hauteur</dt>");
  });

  it("escapes product name in accord synth once (no double-encoding)", () => {
    const vm = samplePacVm();
    vm.products[0] = { ...vm.products[0], displayName: "PAC A & B <test>" };
    const html = renderAccordHtml(vm);
    expect(html).toContain("PAC A &amp; B &lt;test&gt;");
    expect(html).not.toContain("&amp;amp;");
  });
});
