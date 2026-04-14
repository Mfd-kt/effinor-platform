/**
 * Charte couleur Effinor (hex stables) — alignée sur :
 * - `apps/website/src/styles/global-design-system.css` (secondary-500 / 600)
 * - `apps/erp/app/globals.css` (primaire émeraude)
 *
 * À utiliser pour e-mails HTML, PDF Playwright, et tout hors variables Tailwind/oklch.
 */
export const EFFINOR_BRAND_NAVY = "#0F172A";
export const EFFINOR_BRAND_NAVY_MID = "#1E293B";
/** Vert énergie — CTA, liens, accents (équivalent secondary-500). */
export const EFFINOR_BRAND_GREEN = "#10B981";
/** Vert plus soutenu — fin de dégradé, texte « succès » (secondary-600). */
export const EFFINOR_BRAND_GREEN_DEEP = "#059669";
export const EFFINOR_BRAND_INK = "#111827";
export const EFFINOR_BRAND_INK_SOFT = "#374151";
export const EFFINOR_BRAND_MUTED = "#64748B";
export const EFFINOR_BRAND_MUTED_LIGHT = "#94A3B8";
export const EFFINOR_BRAND_LINE = "#E2E8F0";
export const EFFINOR_BRAND_BG_SOFT = "#F1F5F9";
export const EFFINOR_BRAND_WHITE = "#ffffff";

/** Fonds type « succès » léger (secondary-50 / 200 du design system). */
export const EFFINOR_BRAND_GREEN_TINT_BG = "#ECFDF5";
export const EFFINOR_BRAND_GREEN_TINT_BORDER = "#A7F3D0";

/** Dégradés marque (PDF bandeau horizontal =90°, e-mails / badges = 135°). */
export const EFFINOR_BRAND_GRADIENT_90 = `linear-gradient(90deg, ${EFFINOR_BRAND_GREEN}, ${EFFINOR_BRAND_GREEN_DEEP})`;
export const EFFINOR_BRAND_GRADIENT_135 = `linear-gradient(135deg, ${EFFINOR_BRAND_GREEN}, ${EFFINOR_BRAND_GREEN_DEEP})`;

/** Ombre bouton primaire (rgba du vert #10B981). */
export const EFFINOR_BRAND_GREEN_SHADOW = "rgba(16, 185, 129, 0.3)";

/** Fond primaire léger (shadcn accent / emerald tint). */
export const EFFINOR_BRAND_PRIMARY_MUTED = "rgba(16, 185, 129, 0.12)";

/** Ambre — alertes / encadrés (accent-500…800 du design system vitrine). */
export const EFFINOR_BRAND_AMBER_LIGHT = "#FEF3C7";
export const EFFINOR_BRAND_AMBER_DARK = "#92400E";
export const EFFINOR_BRAND_AMBER_BORDER = "#FDE68A";
export const EFFINOR_BRAND_NOTICE_BORDER = "#F59E0B";

/** Texte secondaire sur fond marine (footer partenaire PDF). */
export const EFFINOR_BRAND_PARTNER_TEXT = "#CBD5E1";
