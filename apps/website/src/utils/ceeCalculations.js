/**
 * Estimation indicative du potentiel CEE (sans volet luminaire — périmètre PAC & déstratification).
 * Les montants restent des ordres de grandeur pour affichage prospect ; l’audit définitif reste commercial.
 */

const PAC_SURFACE_FACTOR = 18; // € / m² — chauffage / performantiel
const DESTRAT_SURFACE_FACTOR = 12; // € / m² — homogénéisation / chauffage
const HEIGHT_BOOST_THRESHOLD_M = 8;
const HEIGHT_BOOST_MULTIPLIER = 1.15;

export const calculateCEEPotential = (formData) => {
  let equipmentPotential = 0;
  let heatingPotential = 0;

  const projectType = formData?.projectType;
  let surface = parseFloat(
    formData?.pacDetails?.surfaceM2 ??
      formData?.destratDetails?.surfaceM2 ??
      formData?.buildings?.[0]?.surface ??
      formData?.surface_m2 ??
      0,
    10
  );

  /** Appels depuis le CRM avec seulement surface_m2 + type_projet (sans buildings) */
  if (!formData?.buildings?.length && surface >= 50 && !projectType && formData?.surface_m2) {
    const t = `${formData.type_projet || ''}`.toLowerCase();
    const isDestrat = t.includes('déstrat') || t.includes('destrat');
    heatingPotential = Math.round(surface * (isDestrat ? DESTRAT_SURFACE_FACTOR : PAC_SURFACE_FACTOR));
    const totalPotential = heatingPotential;
    let classification = 'low';
    if (totalPotential > 50000) classification = 'high';
    else if (totalPotential > 10000) classification = 'medium';
    return {
      equipmentPotential: 0,
      heatingPotential,
      ledPotential: 0,
      totalPotential,
      classification,
    };
  }

  if (!surface || surface < 50) {
    return {
      equipmentPotential: 0,
      heatingPotential: 0,
      ledPotential: 0,
      totalPotential: 0,
      classification: 'low',
    };
  }

  if (projectType === 'pac') {
    heatingPotential = Math.round(surface * PAC_SURFACE_FACTOR);
  } else if (projectType === 'destrat') {
    const height = parseFloat(formData?.destratDetails?.ceilingHeightM || formData?.buildings?.[0]?.ceilingHeight || 0);
    let factor = DESTRAT_SURFACE_FACTOR;
    if (height >= HEIGHT_BOOST_THRESHOLD_M) {
      factor *= HEIGHT_BOOST_MULTIPLIER;
    }
    heatingPotential = Math.round(surface * factor);
  } else {
    // Ancien schéma multi-bâtiments (sans type explicite) : conserver une base chauffage surface
    if (formData.buildings && Array.isArray(formData.buildings)) {
      formData.buildings.forEach((building) => {
        if (building.heating && building.surface) {
          const h = parseFloat(building.ceilingHeight) || 0;
          const iso = h > 6 ? 1.2 : 1.0;
          heatingPotential += parseFloat(building.surface) * iso * 15;
        }
      });
    }
    heatingPotential = Math.round(heatingPotential);
  }

  const totalPotential = equipmentPotential + heatingPotential;

  let classification = 'low';
  if (totalPotential > 50000) {
    classification = 'high';
  } else if (totalPotential > 10000) {
    classification = 'medium';
  }

  return {
    equipmentPotential: Math.round(equipmentPotential),
    heatingPotential: Math.round(heatingPotential),
    ledPotential: 0,
    totalPotential: Math.round(totalPotential),
    classification,
  };
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
