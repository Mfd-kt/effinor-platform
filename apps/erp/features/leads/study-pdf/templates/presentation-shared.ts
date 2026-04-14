import type {
  StudyComparableInstallation,
  StudyProductViewModel,
} from "../domain/types";
import { esc, euro, num } from "../utils/format";
import {
  STUDY_PDF_THEME,
  studyPdfLogoIconSvg,
  studyPdfRootCssVars,
  type StudyPdfTheme,
} from "../study-pdf-theme";

export const TOTAL_ENERGIES_LOGO =
  "https://upload.wikimedia.org/wikipedia/fr/thumb/f/f7/Logo_TotalEnergies.svg/960px-Logo_TotalEnergies.svg.png?_=20210529181740";

export const SCHEMA_URL =
  "https://groupe-effinor.fr/images/destrat-schema-stratification.png";

export const LEGAL_FOOTER = `EFFINOR LIGHTING -EF ECPS - 1 Avenue de l'Europe 94320 Thiais - SASU au capital de 115 900,00 euros · immatriculée sous le numéro de SIRET 907 547 665 00022 - Numéro RCS : RCS Créteil 907 547 665 · Numéro de TVA : FR59907547665 - Tél : +33 9 78 45 50 63 · Email : contact@effinor.fr - Garantie décennale : Responsabilité civile & Décennale M-TPE 2025 / Police N° PRW2501390`;

export function getPresentationCss(theme: StudyPdfTheme = STUDY_PDF_THEME): string {
  return `${studyPdfRootCssVars(theme)}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}

body{
  font-family:var(--font-sans);
  font-size:15px;line-height:1.6;color:var(--ink);
  -webkit-print-color-adjust:exact;print-color-adjust:exact;
}

.pg{width:210mm;min-height:297mm;page-break-after:always;break-after:page;position:relative;overflow:hidden;display:flex;flex-direction:column}
.pg:last-child{page-break-after:auto;break-after:auto}

.pg-head__accent{height:4px;background:var(--brand-gradient-90)}
.pg-head__bar{display:flex;align-items:center;justify-content:space-between;padding:10px 46px 10px}
.pg-head__brand{display:flex;align-items:center;gap:8px}
.pg-head__name{font-family:var(--font-heading);font-size:16px;font-weight:800;color:var(--navy);letter-spacing:1px}
.pg-head__te{height:36px;width:auto}

.sec{padding:20px 46px 16px;display:flex;flex-direction:column;gap:18px;flex:1}

.pg-foot{margin-top:auto;padding:12px 46px 14px;border-top:2px solid var(--navy);background:var(--bg2)}
.pg-foot__row{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.pg-foot__row span{display:flex;align-items:center;gap:6px;font-size:10px;color:var(--muted)}
.pg-foot__page{font-size:9px;color:var(--muted);font-weight:600}
.pg-foot__legal{font-size:7px;color:var(--muted2);text-align:center;line-height:1.5;letter-spacing:.01em}

.sec__label{font-size:11px;text-transform:uppercase;letter-spacing:.22em;color:var(--green);font-weight:700}
.sec h2{font-family:var(--font-heading);font-size:28px;font-weight:800;color:var(--navy);line-height:1.15;letter-spacing:-.01em;margin-top:4px}
.sec h3{font-family:var(--font-heading);font-size:18px;font-weight:700;color:var(--ink)}
.sec p{font-size:15px;line-height:1.65;color:var(--ink2)}
.lead-text{font-size:16px !important;line-height:1.6 !important;color:var(--ink2)}

.cover{background:var(--navy);color:var(--white);padding:44px 46px 28px;display:flex;flex-direction:column;gap:0}
.cover__logo{margin-bottom:28px}
.cover h1{font-family:var(--font-heading);font-size:44px;font-weight:800;line-height:1.05;letter-spacing:-.02em;color:#fff;margin-bottom:10px}
.cover__sub{font-size:18px;color:var(--muted2);line-height:1.4;margin-bottom:20px}
.cover__checks{list-style:none;font-size:14px;line-height:1.8;color:#CBD5E1;margin-bottom:20px}
.cover__checks li::before{content:"\\2713  ";font-weight:700;color:var(--green)}

.cover__kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.cover__kpi{background:var(--navy2);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px 14px}
.cover__kpi-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted2);font-weight:600}
.cover__kpi-val{font-size:32px;font-weight:800;color:#fff;margin-top:6px;line-height:1}
.cover__kpi-hint{font-size:10.5px;color:var(--muted);margin-top:6px;line-height:1.3}
.cover__kpi--accent{background:var(--green-soft);border-color:var(--green-border-soft)}
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
.cover__foot{margin-top:auto;padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);font-size:6.5px;color:var(--muted);text-align:center;line-height:1.4}

.quote-block{background:var(--green-tint-8);border-left:5px solid var(--green);border-radius:0 10px 10px 0;padding:22px 28px}
.quote-block p{font-size:19px;font-weight:700;line-height:1.4;color:var(--navy);margin:0}
.quote-block p+p{margin-top:6px}

.blist{list-style:none;font-size:15px;line-height:1.65;color:var(--ink2)}
.blist li{position:relative;padding-left:22px;margin-bottom:6px}
.blist li::before{content:"";position:absolute;left:0;top:9px;width:8px;height:8px;background:var(--green);border-radius:2px}

.schema{border-radius:8px;overflow:hidden;border:1px solid var(--line)}
.schema img{width:100%;display:block}
.schema figcaption{padding:8px 14px;font-size:11px;color:var(--muted);background:var(--bg2)}

.meta-strip{display:flex;flex-wrap:wrap;gap:4px 16px;padding:10px 0;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
.meta-strip strong{color:var(--ink);font-weight:600}

.params{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.param{padding:12px;background:var(--bg2);border-radius:8px;border:1px solid var(--line)}
.param__lbl{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-weight:600}
.param__val{font-size:17px;font-weight:700;color:var(--ink);margin-top:4px}

.hyp{background:var(--bg2);border-radius:8px;padding:16px 20px;border:1px solid var(--line)}
.hyp h3{margin-bottom:8px;font-size:16px}
.hyp-list{list-style:none;font-size:13px;line-height:1.6;color:var(--ink2)}
.hyp-list li{position:relative;padding-left:16px;margin-bottom:4px}
.hyp-list li::before{content:"";position:absolute;left:0;top:8px;width:5px;height:5px;background:var(--green);border-radius:50%}

.kpi-row{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.kpi-box{text-align:center;padding:24px 14px 20px;border-radius:10px;background:var(--bg2);border:1px solid var(--line)}
.kpi-box--blue{background:var(--green-tint-6);border-color:var(--green-border-soft)}
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

.reading-box{border-left:5px solid var(--green);background:var(--green-tint-6);border-radius:0 10px 10px 0;padding:18px 24px}
.reading-box p{font-size:14px;line-height:1.6;color:var(--navy);margin:0}

.climate-zone{border-radius:10px;overflow:hidden;border:1px solid var(--line);margin-top:6px;flex:1;display:flex;flex-direction:column}
.climate-zone img{width:100%;flex:1;display:block;object-fit:cover}
.climate-zone figcaption{padding:6px 14px;font-size:10px;color:var(--muted);background:var(--bg2);line-height:1.4}

.prod-card{display:grid;grid-template-columns:160px 1fr;gap:20px;align-items:start;border:1px solid var(--line);border-radius:10px;padding:20px;background:var(--white);break-inside:avoid}
.prod-card+.prod-card{margin-top:14px}
.prod-img{border-radius:6px;overflow:hidden;background:var(--bg2);min-height:130px;display:flex;align-items:center;justify-content:center}
.prod-img img{width:100%;height:130px;object-fit:contain;display:block}
.prod-img--empty{border:2px dashed var(--line);flex-direction:column;gap:4px;font-size:11px;color:var(--muted);text-align:center;padding:16px}
.prod-img--empty span{font-weight:600;color:var(--ink2);font-size:12px}
.prod-body h3{font-family:var(--font-heading);font-size:18px;font-weight:700;color:var(--navy);margin-bottom:6px}
.prod-desc{font-size:12px;color:var(--ink2);line-height:1.5;margin-bottom:10px}
.spec-tbl{width:100%;border-collapse:collapse;font-size:12px}
.spec-tbl td{padding:4px 0;border-bottom:1px solid var(--line)}
.spec-tbl td:first-child{color:var(--muted);width:48%}
.spec-tbl td:last-child{font-weight:600;text-align:right;color:var(--ink)}
.spec-tbl tr:last-child td{border-bottom:none}
.prod-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:10px}
.badge{display:inline-block;font-size:9px;font-weight:600;padding:3px 8px;border-radius:20px;background:var(--green-tint-12);color:var(--green);text-transform:uppercase;letter-spacing:.05em}
.prod-rationale{font-size:11px;font-style:italic;color:var(--muted);margin-top:10px;padding-top:8px;border-top:1px solid var(--line);line-height:1.45}

.gal-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}
.gal-item{border-radius:6px;overflow:hidden;background:var(--bg2);border:1px solid var(--line);aspect-ratio:4/3;display:flex;align-items:center;justify-content:center}
.gal-item img{width:100%;height:100%;object-fit:cover;display:block}

.comp-stack{display:flex;flex-direction:column;gap:12px}
.comp{border-radius:10px;padding:18px;break-inside:avoid}
.comp--a{background:#F8FAFC;border:1px solid #E2E8F0}
.comp--b{background:#ECFDF5;border:1px solid #A7F3D0}
.comp--c{background:var(--bg2);border:1px solid var(--line)}
.comp__top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:6px}
.comp__top h3{font-family:var(--font-heading);font-size:15px;font-weight:700;color:var(--ink)}
.comp__tag{font-size:9px;font-weight:600;color:var(--green);background:var(--green-tint-12);padding:2px 8px;border-radius:20px;white-space:nowrap}
.comp__meta{font-size:11px;color:var(--muted);margin-bottom:4px}
.comp__result{font-size:13px;color:var(--ink2);margin-bottom:10px}
.comp__nums{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.comp__big{display:block;font-size:20px;font-weight:800;color:var(--navy)}
.comp__lbl{display:block;font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-top:2px}

.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.step{text-align:center;padding:20px 14px 18px;border-radius:10px;background:var(--bg2);border:1px solid var(--line)}
.step__num{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:var(--navy);color:var(--green);font-size:14px;font-weight:800;margin-bottom:10px}
.step__title{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:6px}
.step__desc{font-size:12px;color:var(--ink2);line-height:1.45}

.legal-box{background:var(--amber-l);border:1px solid ${theme.amberBorder};border-radius:8px;padding:14px 20px;font-size:12px;line-height:1.5;color:${theme.amberDark}}
.legal-box strong{color:${theme.amberDark}}

.conclusion p{font-size:15px;line-height:1.65;color:var(--ink2);margin-bottom:12px}
.conclusion p:last-child{margin-bottom:0}
.conclusion strong{color:var(--ink)}

.decision-box{background:var(--navy);color:#fff;border-radius:10px;padding:24px 28px}
.decision-box h3{font-family:var(--font-heading);font-size:18px;font-weight:800;margin-bottom:10px;color:var(--green)}
.decision-box p{color:#CBD5E1;font-size:14px;line-height:1.55;margin:0}
.decision-box p+p{margin-top:6px}

.divider{height:1px;background:var(--line);margin:2px 0}
`;
}

export function pageHead(theme: StudyPdfTheme = STUDY_PDF_THEME): string {
  const icon = studyPdfLogoIconSvg(theme);
  return `<div class="pg-head"><div class="pg-head__accent"></div><div class="pg-head__bar"><div class="pg-head__brand">${icon}<span class="pg-head__name">EFFINOR</span></div><img class="pg-head__te" src="${esc(TOTAL_ENERGIES_LOGO)}" alt="TotalEnergies" /></div></div>`;
}

export function pageFoot(
  pageNum: number,
  totalPages: number,
  theme: StudyPdfTheme = STUDY_PDF_THEME,
): string {
  const icon = studyPdfLogoIconSvg(theme);
  return `<div class="pg-foot"><div class="pg-foot__row"><span>${icon} Effinor</span><span class="pg-foot__page">Page ${pageNum}/${totalPages}</span></div><div class="pg-foot__legal">${esc(LEGAL_FOOTER)}</div></div>`;
}

export function productImageBlock(p: StudyProductViewModel): string {
  if (p.imageUrlResolved) {
    return `<div class="prod-img"><img src="${esc(p.imageUrlResolved)}" alt="${esc(p.displayName)}" /></div>`;
  }
  return `<div class="prod-img prod-img--empty"><span>${esc(p.displayName)}</span><small>Visuel non disponible</small></div>`;
}

export function productSpecTable(specs: { label: string; value: string }[]): string {
  const rows = specs
    .map((s) => `<tr><td>${esc(s.label)}</td><td>${esc(s.value)}</td></tr>`)
    .join("");
  return `<table class="spec-tbl"><tbody>${rows}</tbody></table>`;
}

export function productGallery(p: StudyProductViewModel): string {
  const urls = p.galleryUrls ?? [];
  if (urls.length === 0) return "";
  const items = urls
    .slice(0, 6)
    .map((u) => `<div class="gal-item"><img src="${esc(u)}" alt="${esc(p.displayName)}" /></div>`)
    .join("");
  return `<div class="gal-grid">${items}</div>`;
}

export function productCard(p: StudyProductViewModel): string {
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

export function comparableBlock(
  c: StudyComparableInstallation,
  idx: number,
  opts?: { showCeilingHeight?: boolean },
): string {
  const showCeilingHeight = opts?.showCeilingHeight !== false;
  const themes = ["comp--a", "comp--b", "comp--c"];
  const metaMid = showCeilingHeight
    ? ` · ${num(c.surfaceM2)} m² · ${num(c.heightM, 1)} m · ${esc(c.heatingMode)}`
    : ` · ${num(c.surfaceM2)} m² · ${esc(c.heatingMode)}`;
  return `
    <div class="comp ${themes[idx % 3]}">
      <div class="comp__top">
        <h3>${esc(c.title)}</h3>
        <span class="comp__tag">${esc(c.badge)}</span>
      </div>
      <p class="comp__meta">${esc(c.siteType)}${metaMid}</p>
      <p class="comp__result">${esc(c.measuredResult)}</p>
      <div class="comp__nums">
        <div><span class="comp__big">${euro(c.savingEuroYear)}</span><span class="comp__lbl">Économie / an</span></div>
        <div><span class="comp__big">−${num(c.invoiceDropPercent)}%</span><span class="comp__lbl">Facture énergie</span></div>
        <div><span class="comp__big">${num(c.installationDurationDays)} j.</span><span class="comp__lbl">Chantier</span></div>
      </div>
    </div>`;
}
