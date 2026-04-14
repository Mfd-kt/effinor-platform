import {
  EFFINOR_BRAND_AMBER_BORDER,
  EFFINOR_BRAND_AMBER_DARK,
  EFFINOR_BRAND_AMBER_LIGHT,
  EFFINOR_BRAND_BG_SOFT,
  EFFINOR_BRAND_GRADIENT_90,
  EFFINOR_BRAND_GREEN,
  EFFINOR_BRAND_GREEN_DEEP,
  EFFINOR_BRAND_INK,
  EFFINOR_BRAND_INK_SOFT,
  EFFINOR_BRAND_LINE,
  EFFINOR_BRAND_MUTED,
  EFFINOR_BRAND_MUTED_LIGHT,
  EFFINOR_BRAND_NAVY,
  EFFINOR_BRAND_NAVY_MID,
  EFFINOR_BRAND_NOTICE_BORDER,
  EFFINOR_BRAND_PARTNER_TEXT,
  EFFINOR_BRAND_PRIMARY_MUTED,
  EFFINOR_BRAND_WHITE,
} from "@/lib/effinor-brand";

/**
 * Thème PDF : mêmes hex que `lib/effinor-brand.ts` + polices ERP (`app/layout.tsx`).
 * Les PDF Playwright n’utilisent pas oklch : variables hex + Google Fonts en tête HTML.
 */
export type StudyPdfTheme = {
  navy: string;
  navy2: string;
  primary: string;
  primaryMuted: string;
  teal: string;
  ink: string;
  ink2: string;
  muted: string;
  muted2: string;
  line: string;
  bg2: string;
  white: string;
  amberLight: string;
  amberDark: string;
  amberBorder: string;
  /** Bordure encadrés type « notice » (aligné charte ambre ERP). */
  noticeBorder: string;
  partnerText: string;
  gradient: string;
  coverTagline: string;
  logoGradientId: string;
};

/** Balises `<link>` pour reproduire les polices Next.js (Playwright charge le réseau avec `networkidle`). */
export const STUDY_PDF_FONT_LINKS = `<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet"/>`;

/** Même pile que `app/layout.tsx` (Inter + Poppins). */
export const STUDY_PDF_FONT_SANS = '"Inter","Helvetica Neue",Helvetica,Arial,sans-serif';
export const STUDY_PDF_FONT_HEADING = '"Poppins","Inter","Helvetica Neue",Helvetica,Arial,sans-serif';
/** Sans guillemets pour attributs SVG / XML. */
export const STUDY_PDF_FONT_HEADING_SVG =
  "Poppins,Inter,Helvetica Neue,Helvetica,Arial,sans-serif";

export const STUDY_PDF_THEME: StudyPdfTheme = {
  navy: EFFINOR_BRAND_NAVY,
  navy2: EFFINOR_BRAND_NAVY_MID,
  primary: EFFINOR_BRAND_GREEN,
  primaryMuted: EFFINOR_BRAND_PRIMARY_MUTED,
  teal: EFFINOR_BRAND_GREEN_DEEP,
  ink: EFFINOR_BRAND_INK,
  ink2: EFFINOR_BRAND_INK_SOFT,
  muted: EFFINOR_BRAND_MUTED,
  muted2: EFFINOR_BRAND_MUTED_LIGHT,
  line: EFFINOR_BRAND_LINE,
  bg2: EFFINOR_BRAND_BG_SOFT,
  white: EFFINOR_BRAND_WHITE,
  amberLight: EFFINOR_BRAND_AMBER_LIGHT,
  amberDark: EFFINOR_BRAND_AMBER_DARK,
  amberBorder: EFFINOR_BRAND_AMBER_BORDER,
  noticeBorder: EFFINOR_BRAND_NOTICE_BORDER,
  partnerText: EFFINOR_BRAND_PARTNER_TEXT,
  gradient: EFFINOR_BRAND_GRADIENT_90,
  coverTagline: EFFINOR_BRAND_GREEN,
  logoGradientId: "efG",
};

/** Variables CSS `:root` pour présentation et accord (Playwright). */
export function studyPdfRootCssVars(t: StudyPdfTheme = STUDY_PDF_THEME): string {
  return `:root{
  --navy:${t.navy};--navy2:${t.navy2};--green:${t.primary};--teal:${t.teal};
  --brand-gradient-90:linear-gradient(90deg,${t.primary},${t.teal});
  --brand-gradient-135:linear-gradient(135deg,${t.primary},${t.teal});
  --ink:${t.ink};--ink2:${t.ink2};--muted:${t.muted};--muted2:${t.muted2};
  --line:${t.line};--bg2:${t.bg2};--white:${t.white};
  --amber-l:${t.amberLight};
  --green-soft:${t.primaryMuted};
  --green-border-soft:rgba(16, 185, 129, 0.25);
  --green-tint-6:rgba(16, 185, 129, 0.06);
  --green-tint-8:rgba(16, 185, 129, 0.08);
  --green-tint-12:rgba(16, 185, 129, 0.12);
  --font-sans:${STUDY_PDF_FONT_SANS};
  --font-heading:${STUDY_PDF_FONT_HEADING};
}`;
}

/** Logo couverture (SVG inline) — dégradé aligné sur le thème. */
export function studyPdfLogoCoverSvg(t: StudyPdfTheme = STUDY_PDF_THEME): string {
  const gid = t.logoGradientId;
  return `<svg width="280" height="70" viewBox="0 0 720 180" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${t.primary}"/><stop offset="100%" stop-color="${t.teal}"/></linearGradient></defs><g transform="translate(20,20)"><rect width="120" height="120" rx="28" fill="${t.navy}"/><rect x="2" y="2" width="116" height="116" rx="26" stroke="rgba(255,255,255,0.08)" stroke-width="2"/><path d="M34 32C34 27.58 37.58 24 42 24H82C86.42 24 90 27.58 90 32C90 36.42 86.42 40 82 40H50V56H76C80.42 56 84 59.58 84 64C84 68.42 80.42 72 76 72H50V88H82C86.42 88 90 91.58 90 96C90 100.42 86.42 104 82 104H42C37.58 104 34 100.42 34 96V32Z" fill="url(#${gid})"/><path d="M77 26L61 53H74L58 86" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.96"/></g><g transform="translate(170,38)"><text x="0" y="52" fill="#FFFFFF" font-family="${STUDY_PDF_FONT_HEADING_SVG}" font-size="54" font-weight="700" letter-spacing="2">EFFINOR</text><text x="2" y="90" fill="${t.coverTagline}" font-family="${STUDY_PDF_FONT_HEADING_SVG}" font-size="18" font-weight="600" letter-spacing="4">PERFORMANCE ÉNERGÉTIQUE</text></g></svg>`;
}

export function studyPdfLogoIconSvg(t: StudyPdfTheme = STUDY_PDF_THEME): string {
  const gid = `${t.logoGradientId}-icon`;
  return `<svg width="32" height="32" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${t.primary}"/><stop offset="100%" stop-color="${t.teal}"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="${t.navy}"/><path d="M34 32C34 27.58 37.58 24 42 24H82C86.42 24 90 27.58 90 32C90 36.42 86.42 40 82 40H50V56H76C80.42 56 84 59.58 84 64C84 68.42 80.42 72 76 72H50V88H82C86.42 88 90 91.58 90 96C90 100.42 86.42 104 82 104H42C37.58 104 34 100.42 34 96V32Z" fill="url(#${gid})"/></svg>`;
}

/** Icône accord (légèrement plus grande que pagination). */
export function studyPdfLogoIconSvgAccord(t: StudyPdfTheme = STUDY_PDF_THEME): string {
  const gid = `${t.logoGradientId}-acc`;
  return `<svg width="44" height="44" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${t.primary}"/><stop offset="100%" stop-color="${t.teal}"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="${t.navy}"/><path d="M34 32C34 27.58 37.58 24 42 24H82C86.42 24 90 27.58 90 32C90 36.42 86.42 40 82 40H50V56H76C80.42 56 84 59.58 84 64C84 68.42 80.42 72 76 72H50V88H82C86.42 88 90 91.58 90 96C90 100.42 86.42 104 82 104H42C37.58 104 34 100.42 34 96V32Z" fill="url(#${gid})"/></svg>`;
}
