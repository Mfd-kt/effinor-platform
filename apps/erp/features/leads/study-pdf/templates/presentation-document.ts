import type { StudyPdfViewModel } from "../domain/types";
import { STUDY_PDF_FONT_LINKS, STUDY_PDF_THEME, studyPdfLogoCoverSvg } from "../study-pdf-theme";
import { dateFr, esc, euro, num } from "../utils/format";
import { getClimateZoneDataUri } from "./climate-zone-image";
import {
  comparableBlock,
  getPresentationCss,
  LEGAL_FOOTER,
  pageFoot,
  pageHead,
  productCard,
  SCHEMA_URL,
  TOTAL_ENERGIES_LOGO,
} from "./presentation-shared";

const CEE_PRIME_RATIO = 0.7;

export type PresentationVariant = "destrat" | "pac";

export function renderPresentationDocument(vm: StudyPdfViewModel, variant: PresentationVariant): string {
  const isPac = variant === "pac";
  const theme = STUDY_PDF_THEME;
  const ceePrime = Math.round(vm.simulation.ceePrimeEuro * CEE_PRIME_RATIO);
  const restCharge = euro(Math.max(0, vm.simulation.installTotalEuro - ceePrime));
  const productsHtml = vm.products.map((p) => productCard(p)).join("");
  const comparablesHtml = vm.comparables
    .map((c, i) => comparableBlock(c, i, { showCeilingHeight: !isPac }))
    .join("");
  const climateZoneUri = getClimateZoneDataUri();
  const co = vm.client.companyName;
  const totalPages = 6 + (vm.products.length > 0 ? 1 : 0);
  let pg = 1;
  const css = getPresentationCss(theme);
  const logoCover = studyPdfLogoCoverSvg(theme);

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
${STUDY_PDF_FONT_LINKS}
<title>Présentation projet — ${esc(co)}</title>
<style>${css}</style>
</head>
<body>

<section class="pg cover">
  <div class="cover__logo">${logoCover}</div>

  <h1>${isPac ? "Étude d'opportunité<br/>Pompe à chaleur air / eau" : "Étude d'opportunité<br/>Déstratification d'air"}</h1>
  <p class="cover__sub">${
    isPac
      ? "Analyse technique et économique préliminaire — bâtiments tertiaires et résidentiels (collectif)"
      : "Analyse technique et économique préliminaire"
  }</p>

  <ul class="cover__checks">
    ${
      isPac
        ? `<li>Pré-étude pour chauffage et eau chaude sanitaire en tertiaire ou résidentiel collectif</li>
    <li>Solution air / eau à haut rendement saisonnier, compatible opérations CEE</li>
    <li>Dispositif CEE mobilisable via partenaire obligé</li>`
        : `<li>Étude basée sur les caractéristiques réelles du site</li>
    <li>Simulation économique cohérente avec votre mode de chauffage</li>
    <li>Dispositif CEE mobilisable via partenaire obligé</li>`
    }
  </ul>

  <div class="cover__kpis">
    <div class="cover__kpi">
      <div class="cover__kpi-label">Économie annuelle</div>
      <div class="cover__kpi-val">${euro(vm.simulation.annualSavingEuro)}</div>
      <div class="cover__kpi-hint">Gain estimé sur scénario de référence</div>
    </div>
    <div class="cover__kpi">
      <div class="cover__kpi-label">Coût installation estimé</div>
      <div class="cover__kpi-val">${euro(vm.simulation.installTotalEuro)}</div>
      <div class="cover__kpi-hint">Avant prise en charge CEE</div>
    </div>
    <div class="cover__kpi cover__kpi--accent">
      <div class="cover__kpi-label">Reste à charge</div>
      <div class="cover__kpi-val">${restCharge}</div>
      <div class="cover__kpi-hint">Après prise en charge CEE</div>
    </div>
  </div>

  <div class="cover__impact">${
    isPac && vm.pacCommercialMessage
      ? esc(vm.pacCommercialMessage)
      : "Dans de nombreux cas comparables, le financement via les CEE permet de couvrir une part significative, voire la totalité de l'investissement."
  }</div>

  <div class="cover__partner">
    <div class="cover__partner-logo">
      <img src="${esc(TOTAL_ENERGIES_LOGO)}" alt="TotalEnergies" />
    </div>
    <div class="cover__partner-body">
      <div class="cover__partner-title">Partenaire CEE — TotalEnergies</div>
      <div class="cover__partner-text">Effinor est partenaire du dispositif des Certificats d'Économies d'Énergie (CEE) avec TotalEnergies. Ce partenariat permet de mobiliser un financement structuré pour les opérations d'efficacité énergétique éligibles.</div>
      <div class="cover__partner-legal">Financement soumis à éligibilité et validation du dossier — document édité par Effinor.</div>
    </div>
  </div>

  <div class="cover__meta">
    ${esc(co)} · ${esc(vm.client.contactName)} · ${esc(vm.site.addressLine)}<br/>
    ${esc(dateFr(vm.generatedAtIso))} — ${esc(vm.generatedByLabel)}
  </div>

  <div class="cover__foot">${esc(LEGAL_FOOTER)}</div>
</section>

<section class="pg">
  ${pageHead(theme)}
  <div class="sec">
    ${
      isPac
        ? `<div>
      <div class="sec__label">Le constat</div>
      <h2>Chauffage performant pour le tertiaire<br/>et le résidentiel collectif</h2>
    </div>

    <p class="lead-text">Les bâtiments tertiaires (bureaux, commerces, ERP légers, locaux d'activité) et les immeubles résidentiels collectifs restent souvent équipés de générateurs à rendement limité ou d'installations mal dimensionnées. La facture de chauffage et d'eau chaude sanitaire pèse sur les charges, tandis que les objectifs de décarbonation appellent à des solutions à haut rendement saisonnier.</p>

    <ul class="blist">
      <li>Consommation énergétique élevée pour le chauffage et, le cas échéant, l'ECS</li>
      <li>Confort thermique et régulation perfectibles selon les usages réels</li>
      <li>Trajectoire réglementaire et environnementale à intégrer (rénovation, performance)</li>
      <li>Façade technique et réseau hydraulique à valider avant dimensionnement définitif</li>
    </ul>

    <div class="reading-box">
      <p>La <strong>pompe à chaleur air / eau</strong> capte l'énergie présente dans l'air extérieur pour la transférer à un circuit d'eau de chauffage. Elle s'inscrit dans une démarche d'efficacité énergétique reconnue, applicable à de nombreux contextes <strong>tertiaires</strong> et <strong>résidentiels collectifs</strong>, sous réserve d'étude de faisabilité et d'éligibilité CEE.</p>
    </div>`
        : `<div>
      <div class="sec__label">Le constat</div>
      <h2>Vous payez pour chauffer l'air<br/>qui ne sert pas au sol</h2>
    </div>

    <p class="lead-text">Dans les bâtiments à grande hauteur, l'air chaud se stratifie naturellement en partie haute. La chaleur produite reste au plafond tandis que la zone occupée demeure plus froide. Cette dissociation crée une surconsommation évitable et un inconfort thermique durable.</p>

    <ul class="blist">
      <li>Surconsommation énergétique structurelle</li>
      <li>Inconfort thermique pour les occupants</li>
      <li>Sollicitation excessive du système de chauffage</li>
      <li>Le thermostat ne perçoit pas l'énergie accumulée en hauteur</li>
    </ul>

    <figure class="schema">
      <img src="${esc(SCHEMA_URL)}" alt="Schéma stratification thermique" />
      <figcaption>Avant : stratification thermique — Après : homogénéisation par brassage contrôlé</figcaption>
    </figure>`
    }

    <div class="meta-strip">
      <span>Site <strong>${esc(vm.site.label)}</strong></span>
      <span>Type <strong>${esc(vm.site.type)}</strong></span>
      <span>Surface <strong>${num(vm.site.surfaceM2)} m²</strong></span>
      ${
        isPac
          ? ""
          : `<span>Hauteur <strong>${num(vm.site.heightM, 1)} m</strong></span>
      <span>Volume <strong>${num(vm.site.volumeM3)} m³</strong></span>`
      }
      <span>Chauffage <strong>${esc(vm.site.heatingMode)}</strong></span>
    </div>
  </div>
  ${pageFoot(++pg, totalPages, theme)}
</section>

<section class="pg">
  ${pageHead(theme)}
  <div class="sec">
    ${
      isPac
        ? `<div>
      <div class="sec__label">La solution</div>
      <h2>Pompe à chaleur air / eau<br/>pour le tertiaire et le résidentiel</h2>
    </div>

    <p class="lead-text">La solution étudiée repose sur une <strong>pompe à chaleur air / eau</strong> : elle produit la chaleur utile en prélevant l'énergie de l'air extérieur et en l'élevant au niveau du réseau hydraulique (radiateurs, planchers chauffants, convecteurs, etc.). Elle convient à de nombreux bâtiments <strong>tertiaires</strong> et à l'<strong>habitat collectif</strong> (copropriétés, résidences), dans le respect des contraintes acoustiques, d'implantation et de raccordement au réseau existant ou projeté.</p>

    <div class="quote-block">
      <p>Une même technologie pour sécuriser le confort</p>
      <p>et réduire la facture énergétique sur le long terme.</p>
    </div>

    <ul class="blist">
      <li>Haut rendement saisonnier et pilotage adapté aux usages</li>
      <li>Réduction des consommations par rapport à une chaudière seule ou ancienne</li>
      <li>Compatibilité avec les opérations CEE (sous conditions d'éligibilité et de dossier)</li>
      <li>Dimensionnement et référence matériel à confirmer après audit technique</li>
    </ul>

    <div class="params">
      <div class="param"><div class="param__lbl">Solution indiquée</div><div class="param__val">${esc(vm.simulation.model)}</div></div>
      <div class="param"><div class="param__lbl">Unités préconisées</div><div class="param__val">${num(vm.equipmentQuantity)}</div></div>
      ${
        vm.simulation.powerKw > 0
          ? `<div class="param"><div class="param__lbl">Puissance (indicatif)</div><div class="param__val">${num(vm.simulation.powerKw, 1)} kW</div></div>`
          : ""
      }
      <div class="param"><div class="param__lbl">Surface de référence</div><div class="param__val">${num(vm.site.surfaceM2)} m²</div></div>
    </div>

    <div class="hyp">
      <h3>Hypothèses de calcul</h3>
      <ul class="hyp-list">
        <li>Données site et usages transmis par le donneur d'ordre</li>
        <li>Simulation économique cohérente avec le mode de chauffage déclaré</li>
        <li>Ordres de grandeur non contractuels avant visite technique et devis définitif</li>
        <li>Éligibilité CEE et prime estimée sous réserve de validation du dossier</li>
      </ul>
    </div>`
        : `<div>
      <div class="sec__label">La solution</div>
      <h2>Utiliser la chaleur<br/>que vous payez déjà</h2>
    </div>

    <p class="lead-text">La déstratification remet en circulation l'air chaud accumulé en hauteur afin de le redistribuer en zone utile. L'objectif n'est pas de produire davantage de chaleur, mais de mieux valoriser celle déjà générée.</p>

    <div class="quote-block">
      <p>Vous ne produisez pas plus de chaleur.</p>
      <p>Vous utilisez celle que vous payez déjà.</p>
    </div>

    <ul class="blist">
      <li>Homogénéisation des températures en zone occupée</li>
      <li>Réduction des besoins de chauffage</li>
      <li>Amélioration du confort thermique</li>
      <li>Diminution des cycles de relance</li>
    </ul>

    <div class="params">
      <div class="param"><div class="param__lbl">Modèle retenu</div><div class="param__val">${esc(vm.simulation.model)}</div></div>
      <div class="param"><div class="param__lbl">Débit unitaire</div><div class="param__val">${num(vm.simulation.modelCapacityM3h)} m³/h</div></div>
      <div class="param"><div class="param__lbl">Nombre d'unités</div><div class="param__val">${num(vm.simulation.neededDestrat)}</div></div>
      <div class="param"><div class="param__lbl">Taux renouvellement</div><div class="param__val">${num(vm.simulation.airChangeRate, 2)} h⁻¹</div></div>
    </div>

    <div class="hyp">
      <h3>Hypothèses de calcul</h3>
      <ul class="hyp-list">
        <li>Volume calculé à partir des données déclarées</li>
        <li>Modélisation économique basée sur le mode de chauffage transmis</li>
        <li>Taux d'économie indicatif retenu : 30&nbsp;%</li>
        <li>Les valeurs définitives seront ajustées après validation terrain</li>
      </ul>
    </div>`
    }
  </div>
  ${pageFoot(++pg, totalPages, theme)}
</section>

${vm.products.length > 0 ? `
<section class="pg">
  ${pageHead(theme)}
  <div class="sec">
    <div>
      <div class="sec__label">Équipement${vm.products.length > 1 ? "s" : ""}</div>
      <h2>Équipement${vm.products.length > 1 ? "s" : ""} préconisé${vm.products.length > 1 ? "s" : ""}</h2>
    </div>
    ${productsHtml}
  </div>
  ${pageFoot(++pg, totalPages, theme)}
</section>
` : ""}

<section class="pg">
  ${pageHead(theme)}
  <div class="sec">
    <div>
      <div class="sec__label">Projection</div>
      <h2>Impact économique<br/>et environnemental</h2>
    </div>

    <div class="kpi-row">
      <div class="kpi-box kpi-box--blue">
        <div class="kpi-box__lbl">Économie annuelle</div>
        <div class="kpi-box__val">${euro(vm.simulation.annualSavingEuro)}</div>
        <div class="kpi-box__hint">Gain estimé / an</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-box__lbl">Coût installation estimé</div>
        <div class="kpi-box__val">${euro(vm.simulation.installTotalEuro)}</div>
        <div class="kpi-box__hint">Avant prise en charge CEE</div>
      </div>
      <div class="kpi-box kpi-box--amber">
        <div class="kpi-box__lbl">Reste à charge</div>
        <div class="kpi-box__val">${restCharge}</div>
        <div class="kpi-box__hint">Après prise en charge CEE</div>
      </div>
    </div>

    <div class="kpi2">
      <div class="kpi-sm">
        <div class="kpi-sm__lbl">Coût énergétique annuel de référence</div>
        <div class="kpi-sm__val">${euro(vm.simulation.annualCostEuro)}</div>
      </div>
      <div class="kpi-sm">
        <div class="kpi-sm__lbl">CO₂ évité (ordre de grandeur)</div>
        <div class="kpi-sm__val">${num(vm.simulation.co2SavedTons, 2)} t / an</div>
      </div>
    </div>

    <div class="reading-box">
      <p>Les ordres de grandeur présentés traduisent une cohérence technique et économique du projet. Le devis définitif, émis après validation des hypothèses de terrain, pourra ajuster les montants indiqués à ce stade.</p>
    </div>

    ${climateZoneUri ? `<figure class="climate-zone">
      <img src="${climateZoneUri}" alt="Gains par zone climatique et hauteur de bâtiment" />
      <figcaption>${
        isPac
          ? "Illustration indicative — gains liés au chauffage en tertiaire et résidentiel collectif selon zone climatique et contexte bâtiment (non contractuel)."
          : "Gains estimés en % sur la facture de chauffage, par zone climatique (H1, H2, H3) et hauteur de bâtiment"
      }</figcaption>
    </figure>` : ""}
  </div>
  ${pageFoot(++pg, totalPages, theme)}
</section>

<section class="pg">
  ${pageHead(theme)}
  <div class="sec">
${vm.comparables.length > 0 ? `
    <div>
      <div class="sec__label">Références</div>
      <h2>Installations comparables</h2>
    </div>
    <p style="font-size:12px;color:var(--muted);">Configurations proches du site analysé — résultats non transposables mécaniquement.</p>
    <div class="comp-stack">${comparablesHtml}</div>
` : ""}
  </div>
  ${pageFoot(++pg, totalPages, theme)}
</section>

<section class="pg">
  ${pageHead(theme)}
  <div class="sec">
    <div>
      <div class="sec__label">Financement</div>
      <h2>Comment votre installation est financée</h2>
    </div>

    <div class="steps">
      <div class="step">
        <div class="step__num">1</div>
        <div class="step__title">Obligation réglementaire</div>
        <div class="step__desc">Les fournisseurs d'énergie doivent contribuer à la réalisation d'économies d'énergie.</div>
      </div>
      <div class="step">
        <div class="step__num">2</div>
        <div class="step__title">Financement CEE</div>
        <div class="step__desc">Ils soutiennent des opérations éligibles comme ${
          isPac
            ? "les pompes à chaleur air / eau performantes (tertiaire, résidentiel collectif)"
            : "la déstratification"
        } dans le cadre du dispositif CEE.</div>
      </div>
      <div class="step">
        <div class="step__num">3</div>
        <div class="step__title">Votre bénéfice</div>
        <div class="step__desc">Selon les caractéristiques du dossier, ce financement peut couvrir une part significative, voire la totalité de l'investissement.</div>
      </div>
    </div>

    <div class="legal-box">
      <strong>Cadre réglementaire.</strong> Ce mécanisme relève du Code de l'Énergie. Il ne s'agit pas d'une remise commerciale, mais d'un dispositif réglementaire encadré.
    </div>

    <div class="divider"></div>

    <div>
      <div class="sec__label">Synthèse</div>
      <h2>Conclusion de l'étude</h2>
    </div>

    <div class="conclusion">
      <p>Au regard des données analysées, le projet présente une <strong>cohérence technique et économique forte</strong>.</p>
      <p>${
        isPac
          ? "La <strong>pompe à chaleur air / eau</strong> étudiée vise à moderniser la production de chaleur pour des usages <strong>tertiaires</strong> et <strong>résidentiels collectifs</strong>, avec un potentiel d'économies et de décarbonation, dans un cadre de financement CEE structuré."
          : "La solution proposée permet de réduire significativement les pertes énergétiques tout en s'inscrivant dans un cadre de financement structuré."
      }</p>
      <p>Les éléments réunis à ce stade permettent d'envisager une <strong>mise en \u0153uvre rapide</strong>, sous réserve de validation technique finale et des conditions d'éligibilité.</p>
    </div>

    <div class="decision-box">
      <h3>Prêt à avancer ?</h3>
      <p>Un document d'accord de principe de lancement vous est remis en complément de cette présentation.</p>
      <p>Il vous permet d'engager la suite du projet de manière formalisée, sans engagement financier immédiat.</p>
    </div>
  </div>
  ${pageFoot(++pg, totalPages, theme)}
</section>

</body>
</html>`;
}
