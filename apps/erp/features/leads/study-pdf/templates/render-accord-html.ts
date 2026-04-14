import type { StudyPdfViewModel, StudyProductViewModel } from "../domain/types";
import { dateFr, esc, euro, num } from "../utils/format";

const CEE_PRIME_RATIO = 0.7;

const TOTAL_ENERGIES_LOGO =
  "https://upload.wikimedia.org/wikipedia/fr/thumb/f/f7/Logo_TotalEnergies.svg/960px-Logo_TotalEnergies.svg.png?_=20210529181740";

const LOGO_ICON = `<svg width="44" height="44" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="28" fill="#0F172A"/><path d="M34 32C34 27.58 37.58 24 42 24H82C86.42 24 90 27.58 90 32C90 36.42 86.42 40 82 40H50V56H76C80.42 56 84 59.58 84 64C84 68.42 80.42 72 76 72H50V88H82C86.42 88 90 91.58 90 96C90 100.42 86.42 104 82 104H42C37.58 104 34 100.42 34 96V32Z" fill="#35E0A1"/></svg>`;

const LEGAL_FOOTER = `EFFINOR LIGHTING -EF ECPS - 1 Avenue de l'Europe 94320 Thiais - SASU au capital de 115 900,00 euros
immatriculée sous le numéro de SIRET 907 547 665 00022 - Numéro RCS : RCS Créteil 907 547 665
Numéro de TVA : FR59907547665 - Numéro de téléphone : +33 9 78 45 50 63
Email : contact@effinor.fr - Garantie décennale : Responsabilité civile & Décennale M-TPE 2025 / Police N° PRW2501390`;

function equipRow(p: StudyProductViewModel, qty: number): string {
  const specs = p.specsForDisplay.slice(0, 3).map((s) => `${esc(s.value)}`).join(" · ");
  const imgCell = p.imageUrlResolved
    ? `<td class="eq-img" rowspan="1"><img src="${esc(p.imageUrlResolved)}" alt="${esc(p.displayName)}" /></td>`
    : `<td class="eq-img"></td>`;
  return `<tr>${imgCell}<td class="eq-model">${esc(p.displayName)}</td><td class="eq-qty">${num(qty)}</td><td class="eq-specs">${specs}</td></tr>`;
}

export function renderAccordHtml(vm: StudyPdfViewModel): string {
  const isPac = vm.ceeSolutionKind === "pac";
  const ceePrime = Math.round(vm.simulation.ceePrimeEuro * CEE_PRIME_RATIO);
  const restCharge = euro(Math.max(0, vm.simulation.installTotalEuro - ceePrime));
  const dt = dateFr(vm.generatedAtIso);
  const co = vm.client.companyName;
  const pacEquipLabel = vm.products[0]?.displayName?.trim() || "Pompe à chaleur air / eau";
  const docSub = isPac
    ? "Projet pompe à chaleur air / eau (tertiaire et résidentiel collectif) — validation préalable à instruction technique et administrative"
    : "Projet de déstratification d'air — validation préalable à instruction technique et administrative";
  const intro = isPac
    ? "Le présent document formalise l'accord de principe du client pour poursuivre l'instruction technique et administrative d'un projet de pompe à chaleur air / eau, applicable aux bâtiments tertiaires et à l'habitat collectif, présenté par Effinor."
    : "Le présent document formalise l'accord de principe du client pour poursuivre l'instruction technique et administrative du projet de déstratification présenté par Effinor.";
  const synth = isPac
    ? `Solution ${pacEquipLabel} — ${num(vm.equipmentQuantity)} unité${vm.equipmentQuantity > 1 ? "s" : ""} — champs d'application visés : tertiaire et résidentiel collectif — économies annuelles indicatives : ${euro(vm.simulation.annualSavingEuro)}.`
    : `Solution de déstratification d'air — ${num(vm.simulation.neededDestrat)} appareil${vm.simulation.neededDestrat > 1 ? "s" : ""} ${vm.simulation.model}.`;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Accord de principe — ${esc(co)}</title>
<style>
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#0F172A;--navy2:#1E293B;--green:#35E0A1;--teal:#1EC8B0;
  --ink:#111827;--ink2:#374151;--muted:#64748B;--muted2:#94A3B8;
  --line:#E2E8F0;--bg2:#F1F5F9;--white:#fff;
  --amber-l:#FEF3C7;--amber-d:#92400E;
}
body{
  font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
  font-size:13.5px;line-height:1.55;color:var(--ink);
  -webkit-print-color-adjust:exact;print-color-adjust:exact;
}

/* Page */
.pg{width:210mm;min-height:297mm;display:flex;flex-direction:column;position:relative;page-break-after:always;break-after:page}
.pg:last-child{page-break-after:auto;break-after:auto}

/* Accent bar */
.accent-bar{height:4px;background:linear-gradient(90deg,#35E0A1,#1EC8B0)}

/* Header — like devis */
.hdr{display:flex;align-items:center;justify-content:space-between;padding:12px 40px 12px;border-bottom:2px solid var(--line)}
.hdr__brand{display:flex;align-items:center;gap:10px}
.hdr__brand svg{flex-shrink:0}
.hdr__name{font-size:22px;font-weight:800;color:var(--navy);letter-spacing:1px}
.hdr__right{display:flex;align-items:center;gap:16px}
.hdr__te{height:36px;width:auto}
.hdr__meta{text-align:right;font-size:11px;color:var(--muted);line-height:1.5}
.hdr__doc{font-size:13px;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:.08em}

/* Body */
.body{flex:1;padding:20px 40px 0;display:flex;flex-direction:column;gap:16px}

/* Document title */
.doc-title{
  background:var(--navy);color:var(--white);
  padding:14px 20px;border-radius:6px;
  display:flex;align-items:center;justify-content:space-between;
}
.doc-title h1{font-size:18px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--white)}
.doc-title__date{font-size:12px;color:var(--muted2)}

/* Subtitle */
.doc-sub{font-size:13px;color:var(--muted);font-style:italic;margin-top:-8px}

/* Intro */
.intro{font-size:13.5px;line-height:1.6;color:var(--ink2);padding:10px 0;border-bottom:1px solid var(--line)}

/* Partner — prominent */
.partner{display:flex;align-items:center;gap:16px;background:var(--navy);border-radius:8px;padding:14px 18px}
.partner__logo-wrap{flex-shrink:0;background:var(--white);border-radius:6px;padding:8px 12px}
.partner__logo-wrap img{height:32px;width:auto;display:block}
.partner__body{flex:1}
.partner__title{font-size:12px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.partner__text{font-size:11.5px;color:#CBD5E1;line-height:1.45;margin:0}

/* Section title */
.sec-title{font-size:14px;font-weight:700;color:var(--navy);padding-bottom:6px;border-bottom:2px solid var(--green);display:inline-block;margin-bottom:10px}

/* Two-column layout */
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px 24px}

/* Info grid — devis style */
.info-block{border:1px solid var(--line);border-radius:6px;padding:12px 14px}
.info-block h3{font-size:12px;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--line)}
.info{display:grid;grid-template-columns:90px 1fr;gap:4px 10px;font-size:12px}
.info dt{color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;font-size:10px;padding-top:2px}
.info dd{color:var(--ink)}

/* KPIs — devis total style */
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;break-inside:avoid}
.kpi{text-align:center;padding:12px 8px;border-radius:6px;border:1px solid var(--line);background:var(--white)}
.kpi--accent{background:var(--navy);border-color:var(--navy)}
.kpi--accent .kpi__lbl{color:var(--muted2)}
.kpi--accent .kpi__val{color:var(--green)}
.kpi__lbl{font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:700}
.kpi__val{font-size:26px;font-weight:800;color:var(--navy);margin-top:4px;letter-spacing:-.02em;line-height:1}

/* Equipment table — devis style */
.eq-tbl{width:100%;border-collapse:collapse;font-size:12.5px;border:1px solid var(--line);break-inside:avoid}
.eq-tbl th{text-align:left;padding:8px 12px;background:var(--navy);color:var(--white);font-size:10px;text-transform:uppercase;letter-spacing:.06em;font-weight:700}
.eq-tbl th:nth-child(2){text-align:center}
.eq-tbl td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.eq-th-img{width:70px}
.eq-img{width:70px;padding:6px 8px;vertical-align:middle}
.eq-img img{width:58px;height:58px;object-fit:contain;border-radius:4px;background:var(--bg2);padding:4px}
.eq-model{font-weight:700;color:var(--ink)}
.eq-qty{text-align:center;color:var(--ink);font-weight:700}
.eq-specs{font-size:11.5px;color:var(--muted);line-height:1.4}

/* Effet bloc */
.effet{background:var(--bg2);border:1px solid var(--line);border-radius:6px;padding:16px 18px;break-inside:avoid}
.effet h3{font-size:14px;font-weight:700;color:var(--navy);margin-bottom:8px}
.effet p{font-size:13px;color:var(--ink2);margin:0;line-height:1.55}
.effet-list{list-style:none;margin-top:8px;font-size:12.5px;line-height:1.55;color:var(--ink2)}
.effet-list li{position:relative;padding-left:16px;margin-bottom:3px}
.effet-list li::before{content:"—";position:absolute;left:0;color:var(--green);font-weight:700}

/* Notice / clause */
.notice{border-left:4px solid #D97706;background:var(--amber-l);border-radius:0 6px 6px 0;padding:14px 18px;font-size:12.5px;line-height:1.6;color:#78350F;break-inside:avoid}
.notice p{color:#78350F;font-size:12.5px}
.notice p+p{margin-top:6px}

/* Signature */
.sign-section{border-top:2px solid var(--navy);padding-top:14px;break-inside:avoid}
.sign-section h3{font-size:16px;font-weight:700;color:var(--navy);margin-bottom:6px}
.sign-intro{font-size:11.5px;line-height:1.5;color:var(--ink2);margin-bottom:12px}
.sign{display:grid;grid-template-columns:1fr 1fr;gap:14px 28px}
.sign-field{border-bottom:1px solid var(--muted);min-height:36px;padding-bottom:4px}
.sign-field__lbl{display:block;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;font-weight:700}
.sign-stamp{grid-column:span 2;min-height:280px;border:2px dashed var(--line);border-radius:6px;padding:14px 18px;color:var(--muted);font-size:11px;display:flex;align-items:flex-start}

/* Totals — devis style */
.totals{margin-left:auto;width:280px;break-inside:avoid}
.totals-row{display:flex;justify-content:space-between;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--line);font-size:13px}
.totals-row:last-child{border-bottom:none}
.totals-row dt{color:var(--muted);font-weight:600}
.totals-row dd{font-weight:800;color:var(--navy);font-size:15px}
.totals-row--highlight{background:var(--navy);color:var(--white);border-radius:4px;padding:8px 12px;border-bottom:none;margin-top:4px}
.totals-row--highlight dt{color:var(--muted2);font-weight:600}
.totals-row--highlight dd{color:var(--green);font-size:18px}

/* Legal footer */
.pg-foot{margin-top:auto;border-top:2px solid var(--navy);background:var(--bg2);padding:10px 40px 12px}
.pg-foot__row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.pg-foot__te{height:20px;width:auto}
.pg-foot__page{font-size:9px;color:var(--muted);font-weight:600}
.pg-foot__legal{font-size:8px;line-height:1.6;color:var(--muted);text-align:center;letter-spacing:.01em}
</style>
</head>
<body>

<section class="pg">
  <div class="accent-bar"></div>

  <div class="hdr">
    <div class="hdr__brand">
      ${LOGO_ICON}
      <span class="hdr__name">EFFINOR</span>
    </div>
    <div class="hdr__right">
      <img class="hdr__te" src="${esc(TOTAL_ENERGIES_LOGO)}" alt="TotalEnergies" />
      <div class="hdr__meta">
        <div class="hdr__doc">Accord de principe</div>
        ${esc(dt)}
      </div>
    </div>
  </div>

  <div class="body">
    <div class="doc-title">
      <h1>Accord de principe de lancement</h1>
    </div>
    <p class="doc-sub">${esc(docSub)}</p>

    <p class="intro">${esc(intro)}</p>

    <div class="partner">
      <div class="partner__logo-wrap"><img src="${esc(TOTAL_ENERGIES_LOGO)}" alt="TotalEnergies" /></div>
      <div class="partner__body">
        <div class="partner__title">Partenaire CEE — TotalEnergies</div>
        <p class="partner__text">Ce projet s'inscrit dans le cadre du dispositif des Certificats d'Économies d'Énergie (CEE). Effinor est partenaire de TotalEnergies pour la valorisation des opérations d'efficacité énergétique éligibles.</p>
      </div>
    </div>

    <div class="two-col">
      <div class="info-block">
        <h3>Société cliente</h3>
        <dl class="info">
          <dt>Société</dt><dd>${esc(co)}</dd>
          <dt>Contact</dt><dd>${esc(vm.client.contactName)}</dd>
          <dt>Téléphone</dt><dd>${esc(vm.client.phone)}</dd>
          <dt>Email</dt><dd>${esc(vm.client.email)}</dd>
        </dl>
      </div>
      <div class="info-block">
        <h3>Site concerné</h3>
        <dl class="info">
          <dt>Adresse</dt><dd>${esc(vm.site.addressLine)}</dd>
          <dt>Type</dt><dd>${esc(vm.site.type)}</dd>
          <dt>Surface</dt><dd>${num(vm.site.surfaceM2)} m²</dd>
          <dt>Hauteur</dt><dd>${num(vm.site.heightM, 1)} m</dd>
          <dt>Chauffage</dt><dd>${esc(vm.site.heatingMode)}</dd>
        </dl>
      </div>
    </div>

    <div>
      <div class="sec-title">Rappel synthétique du projet</div>
      <p style="font-size:13px;color:var(--ink2)">${esc(synth)}</p>
    </div>

${vm.products.length > 0 ? `
    <div>
      <div class="sec-title">Équipement${vm.products.length > 1 ? "s" : ""} retenu${vm.products.length > 1 ? "s" : ""}</div>
      <table class="eq-tbl">
        <thead><tr><th class="eq-th-img"></th><th>Modèle</th><th>Qté</th><th>Repères techniques</th></tr></thead>
        <tbody>${vm.products.map((p) => equipRow(p, vm.equipmentQuantity)).join("")}</tbody>
      </table>
    </div>
` : ""}

    <div class="kpis">
      <div class="kpi">
        <div class="kpi__lbl">Économie annuelle</div>
        <div class="kpi__val">${euro(vm.simulation.annualSavingEuro)}</div>
      </div>
      <div class="kpi">
        <div class="kpi__lbl">Coût installation estimé</div>
        <div class="kpi__val">${euro(vm.simulation.installTotalEuro)}</div>
      </div>
      <div class="kpi kpi--accent">
        <div class="kpi__lbl">Reste à charge</div>
        <div class="kpi__val">${restCharge}</div>
      </div>
    </div>
  </div>

  <div class="pg-foot"><div class="pg-foot__row"><img class="pg-foot__te" src="${esc(TOTAL_ENERGIES_LOGO)}" alt="TotalEnergies" /><span class="pg-foot__page">Page 1/2</span></div><div class="pg-foot__legal">${esc(LEGAL_FOOTER)}</div></div>
</section>

<!-- ═══════════ PAGE 2 — CONDITIONS + SIGNATURE ═══════════ -->
<section class="pg">
  <div class="accent-bar"></div>
  <div class="hdr">
    <div class="hdr__brand">
      ${LOGO_ICON}
      <span class="hdr__name">EFFINOR</span>
    </div>
    <div class="hdr__right">
      <img class="hdr__te" src="${esc(TOTAL_ENERGIES_LOGO)}" alt="TotalEnergies" />
      <div class="hdr__meta">
        <div class="hdr__doc">Accord de principe</div>
        ${esc(dt)}
      </div>
    </div>
  </div>

  <div class="body">
    <div class="effet">
      <h3>Effet du présent accord</h3>
      <p>La signature du présent document permet à Effinor de poursuivre l'instruction technique et administrative du projet, sur la base des éléments actuellement disponibles.</p>
      <ul class="effet-list">
        <li>validation du principe de la solution étudiée&nbsp;;</li>
        <li>préparation du dossier administratif et CEE&nbsp;;</li>
        <li>consolidation des hypothèses en vue de l'offre définitive.</li>
      </ul>
    </div>

    <div class="notice">
      <p>Le présent document ne constitue ni un devis définitif, ni un ordre de service, ni une facture.</p>
      <p>Le devis définitif sera établi après validation complète des hypothèses techniques, du site et des conditions d'éligibilité.</p>
      <p>La signature du présent accord n'emporte pas engagement financier immédiat, hors validation ultérieure expresse des documents contractuels définitifs.</p>
    </div>

    <div class="sign-section">
      <h3>Signature du client</h3>
      <p class="sign-intro">En signant le présent document, le client confirme son accord de principe pour la poursuite de l'instruction du projet dans les conditions précisées ci-dessus.</p>
      <div class="sign">
        <div class="sign-field"><span class="sign-field__lbl">Nom</span></div>
        <div class="sign-field"><span class="sign-field__lbl">Fonction</span></div>
        <div class="sign-field"><span class="sign-field__lbl">Société</span></div>
        <div class="sign-field"><span class="sign-field__lbl">Date</span></div>
        <div class="sign-stamp">Signature + cachet</div>
      </div>
    </div>
  </div>

  <div class="pg-foot"><div class="pg-foot__row"><img class="pg-foot__te" src="${esc(TOTAL_ENERGIES_LOGO)}" alt="TotalEnergies" /><span class="pg-foot__page">Page 2/2</span></div><div class="pg-foot__legal">${esc(LEGAL_FOOTER)}</div></div>
</section>

</body>
</html>`;
}
