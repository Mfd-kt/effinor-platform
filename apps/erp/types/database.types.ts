/**
 * Schéma Supabase (types générés).
 *
 * **En local :** démarrez Supabase (`docker`) puis :
 * `npm run generate:types -w @effinor/erp`
 *
 * **Projet hébergé :** `npx supabase gen types typescript --project-id <ref> > types/database.types.ts`
 *
 * Ce fichier minimal évite un build cassé lorsque le générateur n’a pas encore été exécuté ;
 * les alias ci-dessous correspondent aux enums les plus importés côté app.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Indexation `Database["public"]["Tables"][…]` utilisée dans le code : `any` jusqu’à régénération.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export type BeneficiaryStatus = string;
export type TechnicalVisitStatus = string;
export type SiteKind = string;
export type DocumentStatus = string;
export type DocumentType = string;
export type StudyType = string;
export type TechnicalStudyStatus = string;
export type LeadSource = string;
export type LeadStatus = string;
export type ProductFamily = string;
export type OperationStatus = string;
export type AdminStatus = string;
export type SalesStatus = string;
export type TechnicalStatus = string;
