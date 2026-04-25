/**
 * L'acteur Apify renvoie le même schéma pour les ventes et les locations.
 * On réexporte le schéma défini dans la source `pap` pour éviter la dérive.
 */
export {
  papItemSchema as papLocationItemSchema,
  type PapItem as PapLocationItem,
} from "@/features/lead-generation/apify/sources/pap/actor-output";
