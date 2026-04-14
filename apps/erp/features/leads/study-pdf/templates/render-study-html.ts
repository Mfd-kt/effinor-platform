import type {
  StudyComparableInstallation,
  StudyPdfViewModel,
  StudyProductViewModel,
} from "../domain/types";
import { dateFr, esc, euro, num } from "../utils/format";

function imageOrFallback(url: string | null, caption: string): string {
  if (!url) {
    return `<div class="img-fallback" role="img" aria-label="${esc(caption)}"><strong>${esc(caption)}</strong><span>Visuel non disponible</span></div>`;
  }
  return `<figure class="figure-site"><img src="${esc(url)}" alt="${esc(caption)}"/><figcaption>${esc(caption)}</figcaption></figure>`;
}

const TOTAL_ENERGIES_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/fr/thumb/f/f7/Logo_TotalEnergies.svg/960px-Logo_TotalEnergies.svg.png";

/** Encadré partenaire CEE informatif (logo + légende obligatoire). */
function ceePartnerBlock(): string {
  return `
    <aside class="cee-partner-box" aria-label="Partenaire CEE">
      <p class="cee-partner-box__title">Partenaire CEE</p>
      <p class="cee-partner-box__text">Dans le cadre du dispositif des Certificats d'Économies d'Énergie (CEE), cette opération peut être valorisée avec l'appui d'un fournisseur d'énergie obligé.</p>
      <div class="cee-partner-box__logo-wrap">
        <img src="${esc(TOTAL_ENERGIES_LOGO_URL)}" alt="Logo TotalEnergies" />
      </div>
      <p class="cee-partner-box__cap">Partenaire obligé — dispositif CEE (selon éligibilité du dossier)</p>
    </aside>`;
}

function footerNote(): string {
  return `<footer class="sheet-foot"><span>Effinor — Étude d'opportunité préliminaire — usage interne / destinataire désigné</span></footer>`;
}

function sheet(content: string, opts?: { breakBefore?: boolean }): string {
  const cls = `sheet${opts?.breakBefore ? " sheet--break-before" : ""}`;
  return `<section class="${cls}">${content}${footerNote()}</section>`;
}

function comparableCard(item: StudyComparableInstallation, index: number): string {
  const variant = index % 2 === 0 ? "comparable--a" : "comparable--b";
  return `
    <article class="comparable ${variant}">
      <header class="comparable__head">
        <h3 class="comparable__title">${esc(item.title)}</h3>
        <p class="comparable__meta">${esc(item.siteType)} · ${num(item.surfaceM2)} m² · ${num(item.heightM, 1)} m sous plafond · ${esc(item.heatingMode)}</p>
      </header>
      <p class="comparable__outcome">${esc(item.measuredResult)}</p>
      <dl class="comparable__metrics">
        <div><dt>Économie annuelle observée</dt><dd>${euro(item.savingEuroYear)}</dd></div>
        <div><dt>Évolution facture énergétique</dt><dd>−${num(item.invoiceDropPercent)} %</dd></div>
        <div><dt>Durée chantier indicatif</dt><dd>${num(item.installationDurationDays)} j.</dd></div>
      </dl>
      <span class="comparable__tag">${esc(item.badge)}</span>
    </article>`;
}

function productImageBlock(p: StudyProductViewModel): string {
  if (p.imageUrlResolved) {
    return `<div class="product-card__media"><img src="${esc(p.imageUrlResolved)}" alt="${esc(p.displayName)}" /></div>`;
  }
  return `<div class="product-card__media product-card__media--empty" role="img" aria-label="${esc(p.displayName)}">
    <div class="product-img-fallback-inner">
      <strong>${esc(p.displayName)}</strong>
      <span>Visuel produit non disponible</span>
    </div>
  </div>`;
}

function productSpecsRows(specs: { label: string; value: string }[]): string {
  return specs
    .map(
      (s) =>
        `<div class="product-spec-row"><span class="product-spec-row__l">${esc(s.label)}</span><span class="product-spec-row__v">${esc(s.value)}</span></div>`,
    )
    .join("");
}

function productKeyMetricsList(items: { label: string; value: string }[]): string {
  return `<ul class="product-key-list">${items.map((k) => `<li>${esc(k.value)}</li>`).join("")}</ul>`;
}

function productCard(p: StudyProductViewModel): string {
  return `
    <article class="product-card">
      ${productImageBlock(p)}
      <div class="product-card__body">
        <h3 class="product-card__title">${esc(p.displayName)}</h3>
        <p class="product-card__desc">${esc(p.description)}</p>
        <p class="product-card__section-title">Caractéristiques principales</p>
        <div class="product-card__specs">${productSpecsRows(p.specsForDisplay)}</div>
        <p class="product-card__section-title">Repères techniques</p>
        ${productKeyMetricsList(p.keyMetricsForDisplay)}
        <p class="product-card__rationale">${esc(p.rationaleText)}</p>
      </div>
    </article>`;
}

/** Feuille « Équipement(s) préconisé(s) » — omise si aucun produit résolu. */
function renderEquipmentSheet(products: StudyProductViewModel[]): string {
  if (products.length === 0) return "";
  const title = products.length === 1 ? "Équipement préconisé" : "Équipements préconisés";
  const layoutClass =
    products.length === 1
      ? "product-layout product-layout--one"
      : products.length === 2
        ? "product-layout product-layout--two"
        : "product-layout product-layout--many";
  const cards = products.map((p) => productCard(p)).join("");
  return sheet(`
    <header class="sheet-head">
      <div>
        <div class="sheet-head__label">Section 3</div>
        <h2 class="sheet-head__title">${title}</h2>
        <p class="sheet-head__sub">Fiche(s) issue(s) du référentiel produit — données indicatives, non contractuelles.</p>
      </div>
    </header>
    <div class="${layoutClass}">${cards}</div>
  `);
}

export function renderLeadStudyHtml(vm: StudyPdfViewModel): string {
  const beforeAfterSchemaUrl =
    "https://groupe-effinor.fr/images/destrat-schema-stratification.png";

  const comparablesHtml =
    vm.comparables.length > 0
      ? vm.comparables.map((item, i) => comparableCard(item, i)).join("")
      : `<p class="muted" style="margin:0;font-size:11px;">Aucun cas comparable n'a été joint à ce document ; les références sectorielles peuvent être communiquées sur demande lors de l'échange technique.</p>`;

  const qualNotes = vm.qualification.notes.slice(0, 10);
  const notesList =
    qualNotes.length > 0
      ? qualNotes.map((note) => `<li>${esc(note)}</li>`).join("")
      : `<li class="muted">Les pièces et validations seront précisées lors de l'avancement du dossier et de la visite technique si nécessaire.</li>`;

  const restCharge = euro(Math.max(0, vm.simulation.restToChargeEuro));

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>Étude d'opportunité — ${esc(vm.client.companyName)}</title>
    <style>
      @page { size: A4; margin: 13mm 14mm 16mm 14mm; }
      :root {
        --ink: #0f172a;
        --ink-soft: #334155;
        --muted: #64748b;
        --line: #e4edf4;
        --line-strong: #94a3b8;
        --fill: #f1f5f9;
        --fill-warm: #fffbeb;
        --p: #116bad;
        --p-deep: #0d5280;
        --accent: #e8a317;
        --paper: #ffffff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif;
        font-size: 11.2px;
        line-height: 1.48;
        color: var(--ink);
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      h1, h2, h3 { margin: 0; font-weight: 600; }
      .sheet {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-height: 247mm;
        page-break-after: always;
        break-after: page;
        padding-bottom: 2mm;
      }
      .sheet:last-of-type { page-break-after: auto; break-after: auto; }
      .sheet--break-before { page-break-before: always; break-before: page; }

      .sheet-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        padding-bottom: 8px;
        border-bottom: 2px solid var(--p);
      }
      .sheet-head__label {
        font-size: 9px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--p);
        font-weight: 700;
      }
      .sheet-head__title {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 17.5px;
        line-height: 1.22;
        color: var(--p-deep);
        margin-top: 3px;
      }
      .sheet-head__sub { font-size: 11px; color: var(--muted); margin-top: 4px; max-width: 420px; }

      .cover { padding-top: 2mm; }
      .cover-hero {
        display: grid;
        grid-template-columns: 1.15fr 0.85fr;
        gap: 16px;
        align-items: start;
      }
      @media print {
        .cover-hero { grid-template-columns: 1.1fr 0.9fr; }
      }
      .cover-title-block h1 {
        font-family: Georgia, "Times New Roman", serif;
        font-size: 28px;
        line-height: 1.12;
        color: var(--p);
        letter-spacing: -0.02em;
      }
      .cover-title-block .cover-kicker {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
        margin-bottom: 8px;
      }
      .cover-title-block .cover-tagline {
        font-size: 12.5px;
        color: var(--ink-soft);
        margin-top: 10px;
        line-height: 1.45;
      }

      .check-list {
        margin: 12px 0 0;
        padding: 0;
        list-style: none;
        font-size: 11.5px;
        line-height: 1.55;
        color: var(--ink-soft);
      }
      .check-list li {
        position: relative;
        padding-left: 22px;
        margin-bottom: 6px;
      }
      .check-list li::before {
        content: "✔";
        position: absolute;
        left: 0;
        color: var(--p);
        font-weight: 700;
      }

      .cee-partner-box {
        border: 1px solid var(--line);
        background: #fff;
        border-radius: 6px;
        padding: 14px 14px 12px;
        font-size: 10px;
        line-height: 1.5;
        color: var(--ink-soft);
      }
      .cee-partner-box__title {
        font-weight: 700;
        color: var(--p);
        margin: 0 0 8px;
        font-size: 11px;
        text-transform: none;
      }
      .cee-partner-box__text { margin: 0 0 12px; }
      .cee-partner-box__logo-wrap {
        text-align: center;
        margin: 0 0 8px;
      }
      .cee-partner-box__logo-wrap img { max-width: 140px; height: auto; object-fit: contain; }
      .cee-partner-box__cap {
        margin: 0;
        font-size: 9px;
        color: var(--muted);
        text-align: center;
        line-height: 1.35;
      }

      .meta-panel {
        border: 1px solid var(--line);
        border-radius: 4px;
        padding: 12px 14px;
        background: var(--paper);
      }
      .meta-panel dl { margin: 0; display: grid; gap: 7px; }
      .meta-panel dt {
        float: left;
        clear: left;
        width: 118px;
        font-size: 9.5px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
        font-weight: 600;
      }
      .meta-panel dd { margin: 0 0 0 124px; font-size: 11.5px; color: var(--ink); }

      .kpi-hero {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 2px;
      }
      .kpi-hero__cell {
        border: none;
        border-top: 3px solid var(--p);
        border-radius: 6px;
        padding: 14px 14px 12px;
        background: var(--fill);
      }
      .kpi-hero__cell--accent { border-top-color: var(--accent); background: #fffef8; }
      .kpi-hero__label {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
        font-weight: 700;
      }
      .kpi-hero__value {
        font-size: 26px;
        font-weight: 700;
        color: var(--p-deep);
        margin-top: 6px;
        letter-spacing: -0.02em;
      }
      .kpi-hero__hint { font-size: 9.5px; color: var(--muted); margin-top: 6px; line-height: 1.38; }
      .kpi-hero__hint-extra { font-size: 9.5px; color: var(--ink-soft); margin-top: 6px; line-height: 1.35; font-weight: 600; }

      .impact-line {
        background: #f0f7fc;
        border-left: 4px solid var(--p);
        padding: 12px 16px;
        margin: 4px 0 0;
        font-size: 11.5px;
        line-height: 1.45;
        font-style: italic;
        color: var(--ink-soft);
        border-radius: 0 4px 4px 0;
      }

      .facts-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px 14px;
        padding: 12px 14px;
        background: transparent;
        border: none;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        font-size: 10.5px;
      }
      .facts-row span { color: var(--muted); }
      .facts-row strong { color: var(--ink); font-weight: 600; }

      .pull-quote {
        border-left: 4px solid var(--p);
        padding: 12px 14px 12px 16px;
        background: var(--fill);
        border-radius: 0 4px 4px 0;
        margin: 0;
      }
      .pull-quote p { margin: 0 0 10px; font-size: 12.5px; line-height: 1.45; color: var(--ink); }
      .pull-quote p:last-child { margin-bottom: 0; }
      .pull-quote .lead { font-weight: 700; font-size: 13px; margin-bottom: 10px; color: var(--p-deep); }
      .pull-quote ul { margin: 8px 0 10px; padding-left: 18px; font-size: 11.5px; line-height: 1.45; color: var(--ink-soft); }
      .pull-quote li { margin-bottom: 4px; }

      .exec-summary {
        border: none;
        border-radius: 6px;
        padding: 16px 20px;
        background: #f7fafd;
      }
      .exec-summary h2 {
        font-family: Georgia, serif;
        font-size: 14px;
        color: var(--p);
        margin-bottom: 10px;
      }
      .exec-summary p { margin: 0 0 10px; font-size: 11.5px; line-height: 1.52; color: var(--ink-soft); }
      .exec-summary p:last-child { margin-bottom: 0; }
      .exec-summary ul { margin: 8px 0 0; padding-left: 18px; font-size: 11.5px; line-height: 1.5; color: var(--ink-soft); }
      .exec-summary li { margin-bottom: 4px; }

      .two-col-editorial {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        align-items: start;
      }

      .figure-site {
        margin: 0;
        border: 1px solid var(--line);
        border-radius: 4px;
        overflow: hidden;
        background: #eef2f6;
      }
      .figure-site img {
        width: 100%;
        height: 148px;
        object-fit: cover;
        display: block;
      }
      .figure-site figcaption {
        padding: 7px 9px;
        font-size: 9.5px;
        color: var(--muted);
        background: #fff;
        border-top: 1px solid var(--line);
      }

      .img-fallback {
        border: 1px dashed var(--line-strong);
        border-radius: 4px;
        min-height: 148px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        color: var(--muted);
        background: #fbfdff;
        font-size: 10px;
      }

      .schema-block {
        border: 1px solid var(--line);
        border-radius: 4px;
        overflow: hidden;
        background: #fff;
      }
      .schema-block img {
        width: 100%;
        max-height: 200px;
        object-fit: contain;
        display: block;
      }
      .schema-block figcaption {
        padding: 8px 10px;
        font-size: 9.5px;
        color: var(--muted);
        border-top: 1px solid var(--line);
      }

      .hyp-list {
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .hyp-list li {
        position: relative;
        padding-left: 14px;
        margin-bottom: 6px;
        font-size: 11px;
        color: var(--ink-soft);
      }
      .hyp-list li::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0.55em;
        width: 5px;
        height: 5px;
        background: var(--p);
        border-radius: 1px;
      }

      .econ-hero {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
      }
      .econ-hero__big {
        grid-column: span 1;
        text-align: center;
        padding: 18px 14px;
        border: none;
        border-top: 3px solid var(--line);
        border-radius: 6px;
        background: var(--fill);
      }
      .econ-hero__big .lbl {
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--muted);
      }
      .econ-hero__big .val {
        font-size: 30px;
        font-weight: 700;
        color: var(--p);
        margin-top: 8px;
      }
      .econ-subgrid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .stat-tile {
        border: none;
        border-left: 2px solid var(--line);
        border-radius: 0;
        padding: 10px 12px;
        background: transparent;
      }
      .stat-tile .lbl { font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
      .stat-tile .val { font-size: 15px; font-weight: 700; color: var(--ink); margin-top: 4px; }

      .comparables-intro { font-size: 10.5px; color: var(--muted); margin: 0 0 12px; line-height: 1.5; }
      .comparables-stack { display: flex; flex-direction: column; gap: 14px; }
      .comparable {
        border: none;
        border-left: 4px solid var(--line);
        border-radius: 0 4px 4px 0;
        padding: 12px 14px 12px 16px;
        position: relative;
        break-inside: avoid;
      }
      .comparable--a { border-left-color: var(--p); background: #fafdff; }
      .comparable--b { border-left-color: var(--accent); background: #fffcf5; }
      .comparable__title { font-family: Georgia, serif; font-size: 12.5px; color: var(--p-deep); }
      .comparable__meta { font-size: 10px; color: var(--muted); margin: 4px 0 8px; }
      .comparable__outcome { font-size: 11px; margin: 0 0 10px; line-height: 1.45; color: var(--ink-soft); }
      .comparable__metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin: 0;
        font-size: 10px;
      }
      .comparable__metrics dt { color: var(--muted); font-weight: 600; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.04em; }
      .comparable__metrics dd { margin: 2px 0 0; font-weight: 700; color: var(--ink); font-size: 12px; }
      .comparable__tag {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 9px;
        color: var(--p-deep);
        background: rgba(17, 107, 173, 0.08);
        border: 1px solid rgba(17, 107, 173, 0.25);
        padding: 2px 7px;
        border-radius: 2px;
      }

      .financing-hero {
        border: none;
        border-radius: 6px;
        padding: 16px 20px;
        background: #f7fafd;
        margin-bottom: 12px;
      }
      .financing-hero h2 { font-family: Georgia, serif; font-size: 15px; color: var(--p); margin-bottom: 8px; }
      .financing-hero p { margin: 0; font-size: 11.2px; line-height: 1.5; color: var(--ink-soft); }

      .steps-bar {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
      }
      .step-pill {
        border: none;
        border-top: 2px solid var(--p);
        border-radius: 6px;
        padding: 12px 10px 10px;
        text-align: center;
        background: #fff;
      }
      .step-pill__n {
        display: inline-block;
        width: 22px;
        height: 22px;
        line-height: 22px;
        border-radius: 50%;
        background: var(--p);
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 6px;
      }
      .step-pill__t { font-weight: 700; font-size: 10.5px; color: var(--ink); }
      .step-pill__d { font-size: 9.5px; color: var(--muted); margin-top: 4px; line-height: 1.35; }

      .reg-box {
        border: none;
        border-left: 3px solid var(--p);
        background: #f5f8fb;
        border-radius: 0 4px 4px 0;
        padding: 12px 16px;
        font-size: 10.5px;
        line-height: 1.48;
        color: var(--ink-soft);
      }
      .reg-box strong { color: var(--ink); }
      .reg-box p { margin: 0; }

      .timeline {
        margin: 0;
        padding: 0;
        list-style: none;
        counter-reset: step;
      }
      .timeline li {
        position: relative;
        padding: 0 0 12px 28px;
        border-left: 2px solid var(--line);
        margin-left: 8px;
        font-size: 11px;
        line-height: 1.45;
        color: var(--ink-soft);
      }
      .timeline li:last-child { border-left-color: transparent; padding-bottom: 0; }
      .timeline li::before {
        counter-increment: step;
        content: counter(step);
        position: absolute;
        left: -11px;
        top: 0;
        width: 20px;
        height: 20px;
        background: var(--p);
        color: #fff;
        border-radius: 50%;
        font-size: 10px;
        font-weight: 700;
        text-align: center;
        line-height: 20px;
      }
      .timeline strong { color: var(--ink); }

      .conclusion-block {
        border: none;
        border-radius: 0;
        padding: 0;
        background: transparent;
      }
      .conclusion-block p { margin: 0 0 10px; font-size: 11.3px; line-height: 1.52; color: var(--ink-soft); }
      .conclusion-block p:last-child { margin-bottom: 0; }

      .muted { color: var(--muted); }

      .product-layout { width: 100%; }
      .product-layout--one .product-card {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 16px;
        align-items: start;
      }
      .product-layout--two {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .product-layout--two .product-card {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .product-layout--many {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
      .product-layout--many .product-card {
        display: flex;
        flex-direction: column;
        gap: 8px;
        break-inside: avoid;
      }

      .product-card {
        border: none;
        border-left: 3px solid var(--p);
        padding: 0 0 0 14px;
        background: transparent;
      }
      .product-card__media {
        border-radius: 6px;
        overflow: hidden;
        background: #f1f5f9;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .product-card__media img {
        width: 100%;
        height: 120px;
        object-fit: contain;
        display: block;
        background: #fff;
      }
      .product-card__media--empty {
        border: 1px dashed var(--line-strong);
        background: #fbfdff;
      }
      .product-img-fallback-inner {
        text-align: center;
        padding: 14px 10px;
        font-size: 10px;
        color: var(--muted);
        line-height: 1.4;
      }
      .product-img-fallback-inner strong {
        display: block;
        font-size: 11px;
        color: var(--ink-soft);
        margin-bottom: 6px;
      }
      .product-card__title {
        font-family: Georgia, serif;
        font-size: 14px;
        color: var(--p-deep);
        margin: 0 0 8px;
      }
      .product-card__desc {
        margin: 0 0 12px;
        font-size: 11px;
        line-height: 1.5;
        color: var(--ink-soft);
      }
      .product-card__section-title {
        margin: 0 0 6px;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
        font-weight: 700;
      }
      .product-card__specs {
        margin: 0 0 12px;
        font-size: 10.5px;
      }
      .product-spec-row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 4px 0;
        border-bottom: 1px solid var(--line);
      }
      .product-spec-row:last-child { border-bottom: none; }
      .product-spec-row__l { color: var(--muted); flex: 1; }
      .product-spec-row__v { color: var(--ink); font-weight: 600; text-align: right; }
      .product-key-list {
        margin: 0 0 12px;
        padding-left: 16px;
        font-size: 10.5px;
        line-height: 1.45;
        color: var(--ink-soft);
      }
      .product-key-list li { margin-bottom: 3px; }
      .product-card__rationale {
        margin: 0;
        font-size: 10.5px;
        line-height: 1.45;
        font-style: italic;
        color: var(--muted);
        padding-top: 4px;
        border-top: 1px solid var(--line);
      }

      .sheet-foot {
        margin-top: auto;
        padding-top: 8px;
        border-top: 1px solid var(--line);
        font-size: 8.5px;
        color: var(--muted);
        letter-spacing: 0.02em;
      }

      /* Page accord */
      .accord-kpi {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin: 10px 0 12px;
      }
      .accord-kpi div {
        border: 1px solid var(--line);
        padding: 9px 10px;
        border-radius: 4px;
        font-size: 10px;
      }
      .accord-kpi dt { margin: 0; color: var(--muted); font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.05em; }
      .accord-kpi dd { margin: 4px 0 0; font-weight: 700; font-size: 13px; color: var(--p); }

      .legal-notice {
        border: 1px solid #c9a227;
        background: var(--fill-warm);
        padding: 10px 12px;
        border-radius: 4px;
        font-size: 10.5px;
        line-height: 1.45;
        color: var(--ink-soft);
      }
      .legal-notice strong { color: #92400e; }

      .sign-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 20px;
        margin-top: 14px;
        font-size: 10.5px;
      }
      .sign-field {
        border-bottom: 1px solid var(--line-strong);
        min-height: 36px;
        padding-bottom: 4px;
      }
      .sign-field span { display: block; font-size: 8.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
      .sign-stamp { grid-column: span 2; min-height: 52px; border: 1px dashed var(--line-strong); border-radius: 4px; padding: 8px; color: var(--muted); font-size: 9.5px; }
    </style>
  </head>
  <body>
    ${sheet(`
      <div class="cover">
        <div class="cover-hero">
          <div class="cover-title-block">
            <p class="cover-kicker">Effinor — Bureau d'études</p>
            <h1>Étude d'opportunité<br/>Déstratification d'air</h1>
            <p class="cover-tagline">Analyse technique et économique préliminaire — hypothèses explicitées, chiffres indicatifs.</p>
            <ul class="check-list">
              <li>Étude technique basée sur les caractéristiques réelles du site</li>
              <li>Simulation économique cohérente avec votre mode de chauffage</li>
              <li>Mobilisation possible du dispositif CEE via partenaire obligé</li>
            </ul>
          </div>
          ${ceePartnerBlock()}
        </div>

        <div class="meta-panel">
          <dl>
            <dt>Client</dt><dd>${esc(vm.client.companyName)}</dd>
            <dt>Interlocuteur</dt><dd>${esc(vm.client.contactName)} — ${esc(vm.client.contactRole)}</dd>
            <dt>Site</dt><dd>${esc(vm.site.addressLine)}</dd>
            <dt>Établissement</dt><dd>${esc(vm.site.label)}</dd>
            <dt>Date du document</dt><dd>${esc(dateFr(vm.generatedAtIso))}</dd>
            <dt>Rédaction</dt><dd>${esc(vm.generatedByLabel)}</dd>
          </dl>
        </div>

        <div class="kpi-hero">
          <div class="kpi-hero__cell">
            <div class="kpi-hero__label">Économie annuelle estimée</div>
            <div class="kpi-hero__value">${euro(vm.simulation.annualSavingEuro)}</div>
            <p class="kpi-hero__hint">Gain estimé basé sur vos données et un scénario de référence sectoriel</p>
          </div>
          <div class="kpi-hero__cell kpi-hero__cell--accent">
            <div class="kpi-hero__label">Prime CEE estimée</div>
            <div class="kpi-hero__value">${euro(vm.simulation.ceePrimeEuro)}</div>
            <p class="kpi-hero__hint">Montant indicatif mobilisable sous réserve de validation du dossier</p>
          </div>
          <div class="kpi-hero__cell">
            <div class="kpi-hero__label">Reste à charge estimé</div>
            <div class="kpi-hero__value">${restCharge}</div>
            <p class="kpi-hero__hint">Après prise en compte de la prime CEE estimée</p>
            <p class="kpi-hero__hint-extra">Dans de nombreux cas comparables : reste à charge nul</p>
          </div>
        </div>

        <p class="impact-line">Dans la majorité des configurations similaires, l'investissement peut être intégralement pris en charge dans le cadre du dispositif CEE.</p>

        <div class="facts-row">
          <span>Type de site <strong>${esc(vm.site.type)}</strong></span>
          <span>·</span>
          <span>Chauffage <strong>${esc(vm.site.heatingMode)}</strong></span>
          <span>·</span>
          <span>Surface / hauteur <strong>${num(vm.site.surfaceM2)} m² — ${num(vm.site.heightM, 1)} m</strong></span>
          <span>·</span>
          <span>Volume <strong>${num(vm.site.volumeM3)} m³</strong></span>
          <span>·</span>
          <span>Solution <strong>${esc(vm.simulation.model)}</strong> · <strong>${num(vm.simulation.neededDestrat)}</strong> appareil(s)</span>
        </div>

        <div class="exec-summary">
          <h2>Synthèse de décision</h2>
          <p>Les caractéristiques du site et le mode de chauffage observé permettent d'envisager une action pertinente sur la stratification thermique.</p>
          <p>La solution proposée vise à :</p>
          <ul>
            <li>homogénéiser la température en zone occupée</li>
            <li>réduire les pertes énergétiques liées aux écarts verticaux</li>
            <li>améliorer le confort thermique sans modification du système de chauffage</li>
          </ul>
          <p>Les ordres de grandeur présentés encadrent une décision de principe.<br/>La validation définitive interviendra après confirmation technique sur site.</p>
        </div>

        <figure class="schema-block">
          <img src="${esc(beforeAfterSchemaUrl)}" alt="Schéma avant après déstratification" />
          <figcaption>Schéma de principe — avant : stratification thermique ; après : homogénéisation par brassage contrôlé de l'air.</figcaption>
        </figure>
      </div>
    `)}

    ${sheet(`
      <header class="sheet-head">
        <div>
          <div class="sheet-head__label">Section 1</div>
          <h2 class="sheet-head__title">Vue d'ensemble du dossier</h2>
          <p class="sheet-head__sub">Synthèse exécutive, problématique énergétique et lecture des données site.</p>
        </div>
      </header>

      <div class="exec-summary">
        <h2>Synthèse exécutive</h2>
        <p>Le site présente un volume significatif et un mode de chauffage compatible avec une action sur la stratification de l'air. Le pré-dimensionnement proposé vise à rétablir une température plus homogène en zone utile, à réduire les surconsommations liées aux compensations thermiques et à sécuriser un montage CEE cohérent avec la réglementation. Les indicateurs ci-dessous sont indicatifs et seront affinés lors de la phase de validation technique.</p>
      </div>

      <blockquote class="pull-quote">
        <p class="lead">Le problème : vous payez pour chauffer l'air qui ne sert pas au sol</p>
        <p>Dans les bâtiments à grande hauteur, l'air chaud se stratifie naturellement en partie haute.<br/>La chaleur produite reste au plafond tandis que la zone occupée reste plus froide.</p>
        <p><strong>Ce phénomène entraîne :</strong></p>
        <ul>
          <li>une surconsommation énergétique structurelle</li>
          <li>un inconfort thermique pour les occupants</li>
          <li>une sollicitation excessive du système de chauffage</li>
        </ul>
        <p>Le thermostat au sol ne perçoit pas correctement l'énergie accumulée en hauteur, ce qui accentue les cycles de chauffe.</p>
      </blockquote>

      <div class="econ-hero">
        <div class="econ-hero__big">
          <div class="lbl">Économie annuelle estimée</div>
          <div class="val">${euro(vm.simulation.annualSavingEuro)}</div>
        </div>
        <div class="econ-hero__big">
          <div class="lbl">Prime CEE estimée</div>
          <div class="val">${euro(vm.simulation.ceePrimeEuro)}</div>
        </div>
        <div class="econ-hero__big">
          <div class="lbl">Reste à charge estimé</div>
          <div class="val">${restCharge}</div>
        </div>
      </div>

      <p class="muted" style="margin:0;font-size:10px;">Les trois indicateurs ci-dessus constituent le socle de lecture économique rapide du dossier.</p>

      <header class="sheet-head" style="border-bottom-width:1px;margin-top:6px;">
        <div>
          <div class="sheet-head__label">Données site</div>
          <h2 class="sheet-head__title" style="font-size:15px;">Caractéristiques et repérage</h2>
        </div>
      </header>

      <div class="facts-row">
        <span>Réf. site <strong>${esc(vm.site.label)}</strong></span>
        <span>·</span>
        <span>Bâtiment <strong>${esc(vm.site.type)}</strong></span>
        <span>·</span>
        <span>Volume traité <strong>${num(vm.site.volumeM3)} m³</strong></span>
        <span>·</span>
        <span>Analyse au <strong>${esc(dateFr(vm.generatedAtIso))}</strong></span>
      </div>

      <div class="two-col-editorial">
        ${imageOrFallback(vm.media.aerialPhotoUrl, "Vue aérienne — contexte du site")}
        ${imageOrFallback(vm.media.cadastralPhotoUrl, "Parcelle cadastrale — repérage foncier")}
      </div>
      <p class="muted" style="margin:0;font-size:9.5px;">Les visuels sont fournis à titre d'illustration du contexte ; leur absence ne remet pas en cause l'analyse dimensionnelle.</p>
    `)}

    ${sheet(`
      <header class="sheet-head">
        <div>
          <div class="sheet-head__label">Section 2</div>
          <h2 class="sheet-head__title">Principe technique & pré-dimensionnement</h2>
          <p class="sheet-head__sub">Rappel physiques et paramètres retenus pour le dimensionnement indicatif.</p>
        </div>
      </header>

      <div class="exec-summary" style="margin-bottom:4px;">
        <h2>La solution : utiliser la chaleur déjà produite</h2>
        <p>La déstratification consiste à remettre en circulation l'air chaud accumulé en hauteur afin de le redistribuer en zone utile.</p>
        <p>L'objectif n'est pas de produire plus de chaleur, mais de mieux exploiter celle déjà générée.</p>
        <p><strong>Résultats attendus :</strong></p>
        <ul>
          <li>homogénéisation des températures</li>
          <li>réduction des besoins de chauffage</li>
          <li>amélioration du confort thermique</li>
          <li>baisse des cycles de relance du système</li>
        </ul>
      </div>

      <p style="margin:0 0 10px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Paramètres de pré-dimensionnement</p>
      <div class="econ-subgrid">
        <div class="stat-tile"><div class="lbl">Modèle retenu</div><div class="val" style="font-size:13px;">${esc(vm.simulation.model)}</div></div>
        <div class="stat-tile"><div class="lbl">Débit unitaire</div><div class="val">${num(vm.simulation.modelCapacityM3h)} m³/h</div></div>
        <div class="stat-tile"><div class="lbl">Nombre d'unités</div><div class="val">${num(vm.simulation.neededDestrat)}</div></div>
        <div class="stat-tile"><div class="lbl">Taux de renouvellement d'air</div><div class="val">${num(vm.simulation.airChangeRate, 2)} h⁻¹</div></div>
      </div>

      <div class="financing-hero" style="margin-top:4px;">
        <h2 style="font-size:15px;font-family:Georgia,serif;color:var(--p);">Hypothèses de calcul</h2>
        <ul class="hyp-list">
          <li>Volume calculé à partir des données déclarées</li>
          <li>Modélisation thermique basée sur le mode de chauffage</li>
          <li>Taux d'économie indicatif : 30&nbsp;%</li>
          <li>Les valeurs définitives seront ajustées après relevé technique</li>
        </ul>
      </div>
    `)}

    ${renderEquipmentSheet(vm.products)}

    ${sheet(`
      <header class="sheet-head">
        <div>
          <div class="sheet-head__label">Section 4</div>
          <h2 class="sheet-head__title">Projection économique et environnementale</h2>
          <p class="sheet-head__sub">Ordres de grandeur — non substituables à une offre commerciale.</p>
        </div>
      </header>

      <div class="econ-hero">
        <div class="econ-hero__big" style="background:#f0f7fc;border-top:3px solid var(--p);">
          <div class="lbl">Économie annuelle estimée</div>
          <div class="val">${euro(vm.simulation.annualSavingEuro)}</div>
        </div>
        <div class="econ-hero__big" style="background:#fffbeb;border-top:3px solid var(--accent);">
          <div class="lbl">Prime CEE estimée</div>
          <div class="val">${euro(vm.simulation.ceePrimeEuro)}</div>
        </div>
        <div class="econ-hero__big" style="background:#f8fafc;border-top:3px solid var(--line-strong);">
          <div class="lbl">Reste à charge estimé</div>
          <div class="val">${restCharge}</div>
        </div>
      </div>

      <div class="econ-subgrid" style="margin-top:4px;">
        <div class="stat-tile"><div class="lbl">Dépense énergétique annuelle de référence</div><div class="val">${euro(vm.simulation.annualCostEuro)}</div></div>
        <div class="stat-tile"><div class="lbl">Émissions évitées (ordre de grandeur)</div><div class="val">${num(vm.simulation.co2SavedTons, 2)} t CO₂e / an</div></div>
      </div>

      <div class="reg-box" style="margin-top:10px;">
        <strong>Lecture décision</strong>
        <p style="margin:8px 0 0;font-size:11px;line-height:1.5;">Les montants présentés traduisent une cohérence technique et économique du projet.</p>
        <p style="margin:8px 0 0;font-size:11px;line-height:1.5;">Dans de nombreux cas comparables, le financement via les CEE permet de couvrir l'intégralité de l'investissement.</p>
        <p style="margin:8px 0 0;font-size:11px;line-height:1.5;">Le devis définitif pourra ajuster ces ordres de grandeur après validation terrain.</p>
      </div>
    `)}

    ${sheet(`
      <header class="sheet-head">
        <div>
          <div class="sheet-head__label">Références</div>
          <h2 class="sheet-head__title">Installations comparables</h2>
          <p class="sheet-head__sub">Retours d'expérience types — contextes approchants, résultats non transposables mécaniquement.</p>
        </div>
      </header>
      <p class="comparables-intro">Les exemples ci-dessous illustrent des configurations proches du site analysé.<br/>Ils ne constituent pas un engagement contractuel mais permettent de situer les ordres de grandeur observés.</p>
      <div class="comparables-stack">${comparablesHtml}</div>
    `, { breakBefore: true })}

    ${sheet(`
      <header class="sheet-head">
        <div>
          <div class="sheet-head__label">Section 5</div>
          <h2 class="sheet-head__title">Comment votre installation est financée — et pourquoi c'est légal</h2>
          <p class="sheet-head__sub">Mécanisme encadré — distinction nette avec une simple remise commerciale.</p>
        </div>
      </header>

      <div class="financing-hero">
        <p style="margin:0;font-size:11.2px;line-height:1.5;color:var(--ink-soft);">Le dispositif des CEE permet de financer des travaux d'efficacité énergétique dans un cadre défini par la réglementation nationale.</p>
      </div>

      <div class="steps-bar">
        <div class="step-pill">
          <div class="step-pill__n">1</div>
          <div class="step-pill__t">Étape 1</div>
          <div class="step-pill__d">Les fournisseurs d'énergie ont une obligation réglementaire d'économies d'énergie</div>
        </div>
        <div class="step-pill">
          <div class="step-pill__n">2</div>
          <div class="step-pill__t">Étape 2</div>
          <div class="step-pill__d">Ils financent des opérations comme la déstratification via le dispositif CEE</div>
        </div>
        <div class="step-pill">
          <div class="step-pill__n">3</div>
          <div class="step-pill__t">Étape 3</div>
          <div class="step-pill__d">Vous bénéficiez d'un financement pouvant couvrir une part significative, voire totale de l'investissement</div>
        </div>
      </div>

      <div class="reg-box" style="margin-top:12px;">
        Ce dispositif est défini par le Code de l'Énergie.<br/>Il ne s'agit pas d'une remise commerciale mais d'un mécanisme réglementé.
      </div>
    `)}

    ${sheet(`
      <header class="sheet-head">
        <div>
          <div class="sheet-head__label">Section 6</div>
          <h2 class="sheet-head__title">Calendrier indicatif & périmètre documentaire</h2>
        </div>
      </header>

      <ul class="timeline">
        <li><strong>Accord de principe</strong> sur la solution et le dimensionnement indicatif.</li>
        <li><strong>Visite technique</strong> si nécessaire pour lever les incertitudes résiduelles (implantation, réseaux, contraintes d'exploitation).</li>
        <li><strong>Constitution du dossier</strong> CEE et pièces justificatives attendues.</li>
        <li><strong>Proposition commerciale</strong> et planning d'intervention.</li>
        <li><strong>Réalisation</strong> et mise en service ; suivi des attestations.</li>
      </ul>

      <div class="financing-hero" style="margin-top:6px;">
        <h2 style="font-size:13px;">Pièces et points à confirmer</h2>
        <ul style="margin:0;padding-left:18px;font-size:11px;line-height:1.45;color:var(--ink-soft);">${notesList}</ul>
      </div>

      <header class="sheet-head" style="margin-top:10px;">
        <div>
          <div class="sheet-head__label">Synthèse finale</div>
          <h2 class="sheet-head__title" style="font-size:15px;">Conclusion de l'étude</h2>
        </div>
      </header>
      <div class="conclusion-block">
        <p>Au regard des données analysées, le projet présente une cohérence technique et économique forte.</p>
        <p>La solution proposée permet de réduire significativement les pertes énergétiques tout en s'inscrivant dans un cadre de financement structuré.</p>
        <p>Les éléments réunis à ce stade permettent d'envisager une mise en œuvre rapide, sous réserve de validation technique finale et des conditions d'éligibilité.</p>
      </div>
    `)}

    ${sheet(`
      <header class="sheet-head">
        <div>
          <div class="sheet-head__label">Document de gouvernance</div>
          <h2 class="sheet-head__title">Validation du projet — Accord de principe</h2>
          <p class="sheet-head__sub">Sans valeur de devis ni d'ordre de service — suite logique après lecture de l'étude.</p>
        </div>
      </header>

      <p style="margin:0;font-size:11.2px;line-height:1.55;color:var(--ink-soft);">Suite à l'étude réalisée, nous validons le principe de mise en place d'une solution de déstratification sur le site concerné.</p>
      <p style="margin:12px 0 0;font-size:11.2px;line-height:1.5;color:var(--ink-soft);"><strong>Cet accord permet :</strong></p>
      <ul style="margin:8px 0 0;padding-left:18px;font-size:11.2px;line-height:1.5;color:var(--ink-soft);">
        <li>d'engager la validation technique finale</li>
        <li>de préparer le dossier CEE</li>
        <li>de planifier la suite opérationnelle</li>
      </ul>
      <p style="margin:12px 0 0;font-size:11.2px;line-height:1.5;color:var(--ink-soft);"><strong>Important :</strong> Cet accord permet d'engager la suite du projet sans engagement financier immédiat.</p>

      <dl class="accord-kpi">
        <div><dt>Site concerné</dt><dd>${esc(vm.site.addressLine)}</dd></div>
        <div><dt>Solution retenue (indicatif)</dt><dd>${esc(vm.simulation.model)}</dd></div>
        <div><dt>Nombre d'appareils</dt><dd>${num(vm.simulation.neededDestrat)}</dd></div>
        <div><dt>Économie annuelle estimée</dt><dd>${euro(vm.simulation.annualSavingEuro)}</dd></div>
        <div><dt>Prime CEE estimée</dt><dd>${euro(vm.simulation.ceePrimeEuro)}</dd></div>
        <div><dt>Reste à charge estimé</dt><dd>${restCharge}</dd></div>
      </dl>

      <div class="legal-notice">
        <strong>Clause.</strong> Cet accord ne constitue ni un devis définitif ni un ordre de service.<br/>Le devis final sera établi après validation technique complète.
      </div>

      <p style="margin:12px 0 0;font-size:10.8px;line-height:1.45;color:var(--ink-soft);">Fait pour servir et valoir ce que de droit.</p>

      <div class="sign-grid">
        <div class="sign-field"><span>Nom :</span></div>
        <div class="sign-field"><span>Fonction :</span></div>
        <div class="sign-field"><span>Société :</span></div>
        <div class="sign-field"><span>Date :</span></div>
        <div class="sign-field" style="grid-column:span 2;"><span>Signature + cachet :</span></div>
      </div>
    `)}
  </body>
</html>`;
}
