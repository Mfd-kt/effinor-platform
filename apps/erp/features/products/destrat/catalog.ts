import type { DestratProduct, DestratProductId } from "./types";

/**
 * Catalogue local des déstratificateurs — source de vérité actuelle (code).
 *
 * Maintenance :
 * - Images : renseigner `imageUrl` / `fallbackImageUrl` avec des URLs HTTPS publiques stables.
 * - Descriptions / specs : ajuster ici ; le PDF et le simulateur lisent les clés via le repository.
 * - Ordre d’affichage multi-produits : champ `sortOrder` (croissant).
 */
export const DESTRAT_CATALOG: Record<DestratProductId, DestratProduct> = {
  teddington_ds3: {
    id: "teddington_ds3",
    brand: "Teddington",
    name: "Teddington ONSEN DS3",
    shortLabel: "ONSEN DS3",
    slug: "teddington-onsen-ds3",
    category: "destratificateur",
    description:
      "Modèle compact adapté aux bâtiments de hauteur intermédiaire nécessitant une remise en circulation efficace de l’air chaud accumulé en partie haute.",
    imageUrl: null,
    fallbackImageUrl: null,
    specs: [
      { label: "Débit d’air", value: "2 330 m³/h" },
      { label: "Portée verticale", value: "7 m" },
      { label: "Consommation max", value: "68 W" },
      { label: "Alimentation", value: "230 V" },
      { label: "Niveau sonore", value: "39 dB(A)" },
      { label: "Indice de protection", value: "IP54" },
    ],
    keyMetrics: [
      { label: "Repère", value: "Format compact" },
      { label: "Repère", value: "Bâtiments intermédiaires" },
      { label: "Repère", value: "Faible consommation" },
    ],
    sortOrder: 10,
    isActive: true,
  },
  teddington_ds7: {
    id: "teddington_ds7",
    brand: "Teddington",
    name: "Teddington ONSEN DS7",
    shortLabel: "ONSEN DS7",
    slug: "teddington-onsen-ds7",
    category: "destratificateur",
    description:
      "Modèle haute capacité destiné aux bâtiments de grand volume, permettant une homogénéisation thermique cohérente dans les configurations industrielles et logistiques.",
    imageUrl: null,
    fallbackImageUrl: null,
    specs: [
      { label: "Débit d’air", value: "6 500 m³/h" },
      { label: "Portée verticale", value: "10 m" },
      { label: "Consommation max", value: "120 W" },
      { label: "Alimentation", value: "230 V" },
      { label: "Niveau sonore", value: "45 dB(A)" },
      { label: "Indice de protection", value: "IP54" },
    ],
    keyMetrics: [
      { label: "Repère", value: "Grand volume" },
      { label: "Repère", value: "Portée renforcée" },
      { label: "Repère", value: "Usage industriel" },
    ],
    sortOrder: 20,
    isActive: true,
  },
  /** Fiche PAC des PDF d’étude. Pour afficher photo / galerie depuis l’ERP : créer (ou garder) un produit dont le `product_code` en base est exactement `bosch_pac_air_eau`, puis ajouter la couverture dans Paramètres → Produits. */
  bosch_pac_air_eau: {
    id: "bosch_pac_air_eau",
    brand: "Bosch",
    name: "Pompe à chaleur air / eau Bosch (étude CEE)",
    shortLabel: "PAC Bosch air/eau",
    slug: "bosch-pac-air-eau",
    category: "pac",
    description:
      "Pompe à chaleur air / eau pour le chauffage et l’eau chaude sanitaire — bâtiments tertiaires et résidentiel collectif. Rendement saisonnier élevé, compatible opérations CEE (référence indicative, modèle définitif après dimensionnement).",
    imageUrl: null,
    fallbackImageUrl: null,
    specs: [
      { label: "Type", value: "Pompe à chaleur air / eau" },
      { label: "Marque", value: "Bosch" },
      { label: "Usage", value: "Tertiaire, résidentiel collectif, chauffage et ECS" },
      { label: "Fluide", value: "R32 (indicatif — selon gamme retenue)" },
      { label: "Régulation", value: "Sonde extérieure / courbe d’eau (principe)" },
      { label: "Garantie", value: "Selon conditions fabricant / poseur" },
    ],
    keyMetrics: [
      { label: "Économies", value: "Potentiel indicatif (simulation)" },
      { label: "CEE", value: "Éligibilité sous réserve dossier" },
      { label: "Devis", value: "Chiffrage à confirmer" },
    ],
    sortOrder: 5,
    isActive: true,
  },
  generfeu: {
    id: "generfeu",
    brand: "Generfeu",
    name: "Generfeu Haute Performance",
    shortLabel: "Generfeu HP",
    slug: "generfeu-haute-performance",
    category: "destratificateur",
    description:
      "Modèle adapté aux grands volumes avec besoin de brassage élevé, retenu lorsque les contraintes de hauteur et de volume imposent un niveau de performance supérieur.",
    imageUrl: null,
    fallbackImageUrl: null,
    specs: [
      { label: "Débit d’air", value: "10 000 m³/h" },
      { label: "Portée verticale", value: "12 m" },
      { label: "Consommation max", value: "150 W" },
      { label: "Alimentation", value: "230 V" },
      { label: "Niveau sonore", value: "48 dB(A)" },
      { label: "Indice de protection", value: "IP55" },
    ],
    keyMetrics: [
      { label: "Repère", value: "Très grand volume" },
      { label: "Repère", value: "Hautes portées" },
      { label: "Repère", value: "Forte capacité" },
    ],
    sortOrder: 30,
    isActive: true,
  },
};
