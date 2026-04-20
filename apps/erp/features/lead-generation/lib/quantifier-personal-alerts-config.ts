/** Taux de retour 7 j : au-delà → vigilance. */
export const ALERT_RETURN_RATE_WARNING_7D_PERCENT = 26;
/** Taux de retour 7 j : au-delà → alerte forte. */
export const ALERT_RETURN_RATE_DANGER_7D_PERCENT = 38;

/** Écart (points de %) entre semaine et mois : « le retour monte ». */
export const ALERT_RETURN_TREND_WEEK_OVER_MONTH_PERCENT = 8;

/** Hors cible : seuils simples. */
export const ALERT_OOT_TODAY_WARNING = 7;
export const ALERT_OOT_WEEK_WARNING = 22;

/** Rythme du jour : fraction de l’objectif « traités » en dessous de laquelle on signale un rythme lent. */
export const ALERT_RHYTHM_LOW_FRACTION_OF_TARGET = 0.35;
/** Rythme du jour : au-dessus de cette fraction de l’objectif → « très bon rythme » possible. */
export const ALERT_GOOD_RHYTHM_FRACTION_OF_TARGET = 0.85;
export const ALERT_GOOD_QUALIFIED_FRACTION_OF_TARGET = 0.9;

/** Qualité « bonne » sur 7 j. */
export const ALERT_GOOD_QUALIFY_RATE_7D_PERCENT = 68;
export const ALERT_LOW_RETURN_FOR_QUALITY_7D_PERCENT = 15;

/** Volume « bon » aujourd’hui pour croiser avec retour (qualité qui baisse). */
export const ALERT_BUSY_DAY_TREATED = 8;
export const ALERT_BUSY_DAY_RETURN_WEEK_PERCENT = 22;

/** Écart de score vs moyenne équipe pour message « en dessous ». */
export const ALERT_SCORE_GAP_BELOW_TEAM_AVERAGE = 12;
