import type {
  StudyComparableInstallation,
  StudyPdfViewModel,
  StudyProductViewModel,
} from "../domain/types";
import { dateFr, esc, euro, num } from "../utils/format";
import { getClimateZoneDataUri } from "./climate-zone-image";

const CEE_PRIME_RATIO = 0.7;

const TOTAL_ENERGIES_LOGO =
  "https://upload.wikimedia.org/wikipedia/fr/thumb/f/f7/Logo_TotalEnergies.svg/960px-Logo_TotalEnergies.svg.png?_=20210529181740";

const SCHEMA_URL =
  "https://groupe-effinor.fr/images/destrat-schema-stratification.png";

const LOGO_COVER = `<svg width="280" height="70" viewBox="0 0 720 180" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="efG" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#35E0A1"/><stop offset="100%" stop-color="#1EC8B0"/></linearGradient></defs><g transform="translate(20,20)"><rect width="120" height="120" rx="28" fill="#0F172A"/><rect x="2" y="2" width="116" height="116" rx="26" stroke="rgba(255,255,255,0.08)" stroke-width="2"/><path d="M34 32C34 27.58 37.58 24 42 24H82C86.42 24 90 27.58 90 32C90 36.42 86.42 40 82 40H50V56H76C80.42 56 84 59.58 84 64C84 68.42 80.42 72 76 72H50V88H82C86.42 88 90 91.58 90 96C90 100.42 86.42 104 82 104H42C37.58 104 34 100.42 34 96V32Z" fill="url(#efG)"/><path d="M77 26L61 53H74L58 86" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.96"/></g><g transform="translate(170,38)"><text x="0" y="52" fill="#FFFFFF" font-family="Arial,Helvetica,sans-serif" font-size="54" font-weight="700" letter-spacing="2">EFFINOR</text><text x="2" y="90" fill="#35E0A1" font-family="Arial,Helvetica,sans-serif" font-size="18" font-weight="600" letter-spacing="4">PERFORMANCE ÉNERGÉTIQUE</text></g></svg>`;

const LOGO_ICON = `<svg width="32" height="32" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="120" rx="28" fill="#0F172A"/><path d="M34 32C34 27.58 37.58 24 42 24H82C86.42 24 90 27.58 90 32C90 36.42 86.42 40 82 40H50V56H76C80.42 56 84 59.58 84 64C84 68.42 80.42 72 76 72H50V88H82C86.42 88 90 91.58 90 96C90 100.42 86.42 104 82 104H42C37.58 104 34 100.42 34 96V32Z" fill="#35E0A1"/></svg>`;

const LEGAL_FOOTER = `EFFINOR LIGHTING -EF ECPS - 1 Avenue de l'Europe 94320 Thiais - SASU au capital de 115 900,00 euros · immatriculée sous le numéro de SIRET 907 547 665 00022 - Numéro RCS : RCS Créteil 907 547 665 · Numéro de TVA : FR59907547665 - Tél : +33 9 78 45 50 63 · Email : contact@effinor.fr - Garantie décennale : Responsabilité civile & Décennale M-TPE 2025 / Police N° PRW2501390`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pageHead(): string {
  return `<div class="pg-head"><div class="pg-head__accent"></div><div class="pg-head__bar"><div class="pg-head__brand">${LOGO_ICON}<span class="pg-head__name">EFFINOR</span></div><img class="pg-head__te" src="${esc(TOTAL_ENERGIES_LOGO)}" alt="TotalEnergies" /></div></div>`;
}

function pageFoot(pageNum: number, totalPages: number): string {
  return `<div class="pg-foot"><div class="pg-foot__row"><span>${LOGO_ICON} Effinor</span><span class="pg-foot__page">Page ${pageNum}/${totalPages}</span></div><div class="pg-foot__legal">${esc(LEGAL_FOOTER)}</div></div>`;
}

function productImageBlock(p: StudyProductViewModel): string {
  if (p.imageUrlResolved) {
    return `<div class="prod-img"><img src="${esc(p.imageUrlResolved)}" alt="${esc(p.displayName)}" /></div>`;
  }
  return `<div class="prod-img prod-img--empty"><span>${esc(p.displayName)}</span><small>Visuel non disponible</small></div>`;
}

function productSpecTable(specs: { label: string; value: string }[]): string {
  const rows = specs
    .map((s) => `<tr><td>${esc(s.label)}</td><td>${esc(s.value)}</td></tr>`)
    .join("");
  return `<table class="spec-tbl"><tbody>${rows}</tbody></table>`;
}

function productGallery(p: StudyProductViewModel): string {
  const urls = p.galleryUrls ?? [];
  if (urls.length === 0) return "";
  const items = urls
    .slice(0, 6)
    .map((u) => `<div class="gal-item"><img src="${esc(u)}" alt="${esc(p.displayName)}" /></div>`)
    .join("");
  return `<div class="gal-grid">${items}</div>`;
}

function productCard(p: StudyProductViewModel): string {
  return `
    <div class="prod-card">
      ${productImageBlock(p)}
      <div class="prod-body">
        <h3>${esc(p.displayName)}</h3>
        <p class="prod-desc">${esc(p.description)}</p>
        ${productSpecTable(p.specsForDisplay)}
        <div class="prod-badges">${p.keyMetricsForDisplay.map((k) => `<span class="badge">${esc(k.value)}</span>`).join("")}</div>
        <p class="prod-rationale">${esc(p.rationaleText)}</p>
      </div>
    </div>
    ${productGallery(p)}`;
}

function comparableBlock(c: StudyComparableInstallation, idx: number): string {
  const themes = ["comp--a", "comp--b", "comp--c"];
  return `
    <div class="comp ${themes[idx % 3]}">
      <div class="comp__top">
        <h3>${esc(c.title)}</h3>
        <span class="comp__tag">${esc(c.badge)}</span>
      </div>
      <p class="comp__meta">${esc(c.siteType)} · ${num(c.surfaceM2)} m² · ${num(c.heightM, 1)} m · ${esc(c.heatingMode)}</p>
      <p class="comp__result">${esc(c.measuredResult)}</p>
      <div class="comp__nums">
        <div><span class="comp__big">${euro(c.savingEuroYear)}</span><span class="comp__lbl">Économie / an</span></div>
        <div><span class="comp__big">−${num(c.invoiceDropPercent)}%</span><span class="comp__lbl">Facture énergie</span></div>
        <div><span class="comp__big">${num(c.installationDurationDays)} j.</span><span class="comp__lbl">Chantier</span></div>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------

const CSS = `
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}

:root{
  --navy:#0F172A;--navy2:#1E293B;--green:#35E0A1;--teal:#1EC8B0;
  --ink:#111827;--ink2:#374151;--muted:#64748B;--muted2:#94A3B8;
  --line:#E2E8F0;--bg2:#F1F5F9;--white:#fff;
  --amber-l:#FEF3C7;
}

body{
  font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;
  font-size:15px;line-height:1.6;color:var(--ink);
  -webkit-print-color-adjust:exact;print-color-adjust:exact;
}

.pg{width:210mm;min-height:297mm;page-break-after:always;break-after:page;position:relative;overflow:hidden;display:flex;flex-direction:column}
.pg:last-child{page-break-after:auto;break-after:auto}

/* Page header */
.pg-head__accent{height:4px;background:linear-gradient(90deg,#35E0A1,#1EC8B0)}
.pg-head__bar{display:flex;align-items:center;justify-content:space-between;padding:10px 46px 10px}
.pg-head__brand{display:flex;align-items:center;gap:8px}
.pg-head__name{font-size:16px;font-weight:800;color:var(--navy);letter-spacing:1px}
.pg-head__te{height:36px;width:auto}

.sec{padding:20px 46px 16px;display:flex;flex-direction:column;gap:18px;flex:1}

/* Footer */
.pg-foot{margin-top:auto;padding:12px 46px 14px;border-top:2px solid var(--navy);background:var(--bg2)}
.pg-foot__row{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.pg-foot__row span{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--muted)}
.pg-foot__te{height:16px;width:auto;opacity:.5}
.pg-foot__page{font-size:9px;color:var(--muted);font-weight:600}
.pg-foot__legal{font-size:7px;color:var(--muted2);text-align:center;line-height:1.5;letter-spacing:.01em}

/* Section labels */
.sec__label{font-size:11px;text-transform:uppercase;letter-spacing:.22em;color:var(--green);font-weight:700}
.sec h2{font-size:28px;font-weight:800;color:var(--navy);line-height:1.15;letter-spacing:-.01em;margin-top:4px}
.sec h3{font-size:18px;font-weight:700;color:var(--ink)}
.sec p{font-size:15px;line-height:1.65;color:var(--ink2)}
.lead-text{font-size:16px !important;line-height:1.6 !important;color:var(--ink2)}

/* ══════════════════════════════════════════════
   COVER
   ══════════════════════════════════════════════ */
.cover{background:var(--navy);color:var(--white);padding:44px 46px 28px;display:flex;flex-direction:column;gap:0}
.cover__logo{margin-bottom:28px}
.cover h1{font-size:44px;font-weight:800;line-height:1.05;letter-spacing:-.02em;color:#fff;margin-bottom:10px}
.cover__sub{font-size:18px;color:var(--muted2);line-height:1.4;margin-bottom:20px}
.cover__checks{list-style:none;font-size:14px;line-height:1.8;color:#CBD5E1;margin-bottom:20px}
.cover__checks li::before{content:"✔  ";font-weight:700;color:var(--green)}

.cover__kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.cover__kpi{background:var(--navy2);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px 14px}
.cover__kpi-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted2);font-weight:600}
.cover__kpi-val{font-size:32px;font-weight:800;color:#fff;margin-top:6px;line-height:1}
.cover__kpi-hint{font-size:10.5px;color:var(--muted);margin-top:6px;line-height:1.3}
.cover__kpi--accent{background:rgba(53,224,161,0.12);border-color:rgba(53,224,161,0.25)}
.cover__kpi--accent .cover__kpi-val{color:var(--green)}

.cover__impact{padding:10px 14px;background:var(--navy2);border:1px solid rgba(255,255,255,0.08);border-radius:6px;font-size:12.5px;line-height:1.5;color:#CBD5E1;margin-bottom:12px}

.cover__partner{background:var(--navy2);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px 18px;display:flex;align-items:center;gap:16px;margin-bottom:12px}
.cover__partner-logo{flex-shrink:0;background:#fff;border-radius:6px;padding:8px 12px}
.cover__partner-logo img{height:28px;width:auto;display:block}
.cover__partner-body{flex:1}
.cover__partner-title{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#fff;margin-bottom:4px}
.cover__partner-text{font-size:12px;line-height:1.45;color:#CBD5E1}
.cover__partner-legal{font-size:9.5px;color:var(--muted);margin-top:3px}

.cover__meta{font-size:11px;color:var(--muted);line-height:1.5}

/* Cover legal footer */
.cover__foot{margin-top:auto;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:6.5px;color:var(--muted);text-align:center;line-height:1.4}

/* ── Quote block ── */
.quote-block{background:rgba(53,224,161,0.08);border-left:5px solid var(--green);border-radius:0 10px 10px 0;padding:22px 28px}
.quote-block p{font-size:19px;font-weight:700;line-height:1.4;color:var(--navy);margin:0}
.quote-block p+p{margin-top:6px}

/* ── Bullet list ── */
.blist{list-style:none;font-size:15px;line-height:1.65;color:var(--ink2)}
.blist li{position:relative;padding-left:22px;margin-bottom:6px}
.blist li::before{content:"";position:absolute;left:0;top:9px;width:8px;height:8px;background:var(--green);border-radius:2px}

/* ── Schema ── */
.schema{border-radius:8px;overflow:hidden;border:1px solid var(--line)}
.schema img{width:100%;display:block}
.schema figcaption{padding:8px 14px;font-size:11px;color:var(--muted);background:var(--bg2)}

/* ── Meta strip ── */
.meta-strip{display:flex;flex-wrap:wrap;gap:4px 16px;padding:10px 0;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
.meta-strip strong{color:var(--ink);font-weight:600}

/* ── Params grid ── */
.params{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.param{padding:12px;background:var(--bg2);border-radius:6px;border:1px solid var(--line)}
.param__lbl{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600}
.param__val{font-size:17px;font-weight:700;color:var(--ink);margin-top:4px}

/* ── Hyp block ── */
.hyp{background:var(--bg2);border-radius:8px;padding:16px 20px;border:1px solid var(--line)}
.hyp h3{margin-bottom:8px;font-size:16px}
.hyp-list{list-style:none;font-size:13px;line-height:1.6;color:var(--ink2)}
.hyp-list li{position:relative;padding-left:16px;margin-bottom:4px}
.hyp-list li::before{content:"";position:absolute;left:0;top:8px;width:5px;height:5px;background:var(--green);border-radius:50%}

/* ── KPI row ── */
.kpi-row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.kpi-box{text-align:center;padding:24px 14px 20px;border-radius:10px;background:var(--bg2);border:1px solid var(--line)}
.kpi-box--blue{background:rgba(53,224,161,0.06);border-color:rgba(53,224,161,0.2)}
.kpi-box--amber{background:var(--navy);border-color:var(--navy2)}
.kpi-box__lbl{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:700}
.kpi-box--amber .kpi-box__lbl{color:var(--muted2)}
.kpi-box__val{font-size:40px;font-weight:800;color:var(--navy);margin-top:8px;letter-spacing:-.02em;line-height:1}
.kpi-box--amber .kpi-box__val{color:var(--green)}
.kpi-box__hint{font-size:11px;color:var(--muted);margin-top:8px;line-height:1.3}

.kpi2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.kpi-sm{padding:16px 18px;border-left:4px solid var(--green);background:var(--bg2);border-radius:0 8px 8px 0}
.kpi-sm__lbl{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.kpi-sm__val{font-size:24px;font-weight:800;color:var(--ink);margin-top:4px}

.reading-box{border-left:5px solid var(--green);background:rgba(53,224,161,0.06);border-radius:0 10px 10px 0;padding:18px 24px}
.reading-box p{font-size:14px;line-height:1.6;color:var(--navy);margin:0}

/* ── Climate zone map ── */
.climate-zone{border-radius:10px;overflow:hidden;border:1px solid var(--line);margin-top:6px;flex:1;display:flex;flex-direction:column}
.climate-zone img{width:100%;flex:1;display:block;object-fit:cover}
.climate-zone figcaption{padding:6px 14px;font-size:10px;color:var(--muted);background:var(--bg2);line-height:1.4}

/* ── Product cards ── */
.prod-card{display:grid;grid-template-columns:160px 1fr;gap:20px;align-items:start;border:1px solid var(--line);border-radius:10px;padding:20px;background:var(--white);break-inside:avoid}
.prod-card+.prod-card{margin-top:14px}
.prod-img{border-radius:6px;overflow:hidden;background:var(--bg2);min-height:130px;display:flex;align-items:center;justify-content:center}
.prod-img img{width:100%;height:130px;object-fit:contain;display:block}
.prod-img--empty{border:2px dashed var(--line);flex-direction:column;gap:4px;font-size:11px;color:var(--muted);text-align:center;padding:16px}
.prod-img--empty span{font-weight:600;color:var(--ink2);font-size:12px}
.prod-body h3{font-size:18px;font-weight:700;color:var(--navy);margin-bottom:6px}
.prod-desc{font-size:12px;color:var(--ink2);line-height:1.5;margin-bottom:10px}
.spec-tbl{width:100%;border-collapse:collapse;font-size:12px}
.spec-tbl td{padding:4px 0;border-bottom:1px solid var(--line)}
.spec-tbl td:first-child{color:var(--muted);width:48%}
.spec-tbl td:last-child{font-weight:600;text-align:right;color:var(--ink)}
.spec-tbl tr:last-child td{border-bottom:none}
.prod-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}
.badge{display:inline-block;font-size:9px;font-weight:600;padding:3px 8px;border-radius:20px;background:rgba(53,224,161,0.12);color:var(--teal);text-transform:uppercase;letter-spacing:.05em}
.prod-rationale{font-size:11px;font-style:italic;color:var(--muted);margin-top:10px;padding-top:8px;border-top:1px solid var(--line);line-height:1.45}

/* ── Product gallery ── */
.gal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.gal-item{border-radius:6px;overflow:hidden;background:var(--bg2);border:1px solid var(--line);aspect-ratio:4/3;display:flex;align-items:center;justify-content:center}
.gal-item img{width:100%;height:100%;object-fit:cover;display:block}

/* ── Comparables ── */
.comp-stack{display:flex;flex-direction:column;gap:12px}
.comp{border-radius:10px;padding:18px;break-inside:avoid}
.comp--a{background:#F0F9FF;border:1px solid #BAE6FD}
.comp--b{background:#F0FDF4;border:1px solid #BBF7D0}
.comp--c{background:var(--bg2);border:1px solid var(--line)}
.comp__top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:6px}
.comp__top h3{font-size:15px;font-weight:700;color:var(--ink)}
.comp__tag{font-size:9px;font-weight:600;color:var(--teal);background:rgba(53,224,161,0.12);padding:2px 8px;border-radius:20px;white-space:nowrap}
.comp__meta{font-size:11px;color:var(--muted);margin-bottom:4px}
.comp__result{font-size:13px;color:var(--ink2);margin-bottom:10px}
.comp__nums{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.comp__big{display:block;font-size:20px;font-weight:800;color:var(--navy)}
.comp__lbl{display:block;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:2px}

/* ── CEE Steps ── */
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.step{text-align:center;padding:20px 14px 18px;border-radius:10px;background:var(--bg2);border:1px solid var(--line)}
.step__num{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:var(--navy);color:var(--green);font-size:14px;font-weight:800;margin-bottom:10px}
.step__title{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:6px}
.step__desc{font-size:12px;color:var(--ink2);line-height:1.45}

.legal-box{background:var(--amber-l);border:1px solid #FDE68A;border-radius:8px;padding:14px 20px;font-size:12px;line-height:1.5;color:#78350F}
.legal-box strong{color:#92400E}

/* ── Conclusion ── */
.conclusion p{font-size:15px;line-height:1.65;color:var(--ink2);margin-bottom:12px}
.conclusion p:last-child{margin-bottom:0}
.conclusion strong{color:var(--ink)}

.decision-box{background:var(--navy);color:#fff;border-radius:10px;padding:24px 28px}
.decision-box h3{font-size:18px;font-weight:800;margin-bottom:10px;color:var(--green)}
.decision-box p{color:#CBD5E1;font-size:14px;line-height:1.55;margin:0}
.decision-box p+p{margin-top:6px}

.divider{height:1px;background:var(--line);margin:2px 0}
`;

// ---------------------------------------------------------------------------
// Main render
// ---------------------------------------------------------------------------

export function renderPresentationHtml(vm: StudyPdfViewModel): string {
  const isPac = vm.ceeSolutionKind === "pac";
  const ceePrime = Math.round(vm.simulation.ceePrimeEuro * CEE_PRIME_RATIO);
  const restCharge = euro(Math.max(0, vm.simulation.installTotalEuro - ceePrime));
  const productsHtml = vm.products.map((p) => productCard(p)).join("");
  const comparablesHtml = vm.comparables.map((c, i) => comparableBlock(c, i)).join("");
  const climateZoneUri = getClimateZoneDataUri();
  const co = vm.client.companyName;
  const totalPages = 6 + (vm.products.length > 0 ? 1 : 0);
  let pg = 1;

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Présentation projet — ${esc(co)}</title>
<style>${CSS}</style>
</head>
<body>

<!-- ═══════════ PAGE 1 — COUVERTURE ═══════════ -->
<section class="pg cover">
  <div class="cover__logo">${LOGO_COVER}</div>

  <h1>${isPac ? "Étude d'opportunité<br/>Pompe à chaleur air / eau" : "Étude d'opportunité<br/>Déstratification d'air"}</h1>
  <p class="cover__sub">Analyse technique et économique préliminaire</p>

  <ul class="cover__checks">
    <li>Étude basée sur les caractéristiques réelles du site</li>
    <li>Simulation économique cohérente avec votre mode de chauffage</li>
    <li>Dispositif CEE mobilisable via partenaire obligé</li>
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

<!-- ═══════════ PAGE 2 — LE PROBLÈME ═══════════ -->
<section class="pg">
  ${pageHead()}
  <div class="sec">
    <div>
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
    </figure>

    <div class="meta-strip">
      <span>Site <strong>${esc(vm.site.label)}</strong></span>
      <span>Type <strong>${esc(vm.site.type)}</strong></span>
      <span>Surface <strong>${num(vm.site.surfaceM2)} m²</strong></span>
      <span>Hauteur <strong>${num(vm.site.heightM, 1)} m</strong></span>
      <span>Volume <strong>${num(vm.site.volumeM3)} m³</strong></span>
      <span>Chauffage <strong>${esc(vm.site.heatingMode)}</strong></span>
    </div>
  </div>
  ${pageFoot(++pg, totalPages)}
</section>

<!-- ═══════════ PAGE 3 — SOLUTION ═══════════ -->
<section class="pg">
  ${pageHead()}
  <div class="sec">
    <div>
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
    </div>
  </div>
  ${pageFoot(++pg, totalPages)}
</section>

${vm.products.length > 0 ? `
<!-- ═══════════ PAGE 4 — PRODUIT(S) ═══════════ -->
<section class="pg">
  ${pageHead()}
  <div class="sec">
    <div>
      <div class="sec__label">Équipement${vm.products.length > 1 ? "s" : ""}</div>
      <h2>Équipement${vm.products.length > 1 ? "s" : ""} préconisé${vm.products.length > 1 ? "s" : ""}</h2>
    </div>
    ${productsHtml}
  </div>
  ${pageFoot(++pg, totalPages)}
</section>
` : ""}

<!-- ═══════════ PAGE 5 — PROJECTION ÉCONOMIQUE ═══════════ -->
<section class="pg">
  ${pageHead()}
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
      <figcaption>Gains estimés en % sur la facture de chauffage, par zone climatique (H1, H2, H3) et hauteur de bâtiment</figcaption>
    </figure>` : ""}
  </div>
  ${pageFoot(++pg, totalPages)}
</section>

<!-- ═══════════ PAGE 6 — COMPARABLES + CEE ═══════════ -->
<section class="pg">
  ${pageHead()}
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
  ${pageFoot(++pg, totalPages)}
</section>

<!-- ═══════════ PAGE 7 — CEE + CONCLUSION ═══════════ -->
<section class="pg">
  ${pageHead()}
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
          isPac ? "les pompes à chaleur performantes" : "la déstratification"
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
      <p>La solution proposée permet de réduire significativement les pertes énergétiques tout en s'inscrivant dans un cadre de financement structuré.</p>
      <p>Les éléments réunis à ce stade permettent d'envisager une <strong>mise en œuvre rapide</strong>, sous réserve de validation technique finale et des conditions d'éligibilité.</p>
    </div>

    <div class="decision-box">
      <h3>Prêt à avancer ?</h3>
      <p>Un document d'accord de principe de lancement vous est remis en complément de cette présentation.</p>
      <p>Il vous permet d'engager la suite du projet de manière formalisée, sans engagement financier immédiat.</p>
    </div>
  </div>
  ${pageFoot(++pg, totalPages)}
</section>

</body>
</html>`;
}
