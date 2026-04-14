/** Cookie httpOnly : session d’impersonation (payload signé). */
export const IMPERSONATION_COOKIE_NAME = "effinor_imp";

/** Durée max d’une session d’impersonation (secondes). */
export const IMPERSONATION_MAX_AGE_SEC = 8 * 60 * 60;

export const IMPERSONATION_COOKIE_PAYLOAD_VERSION = 1 as const;
