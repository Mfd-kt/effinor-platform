import { z } from "zod";

const addressSchema = z.object({
  adresse: z.string().min(1, "Adresse requise"),
  codePostal: z.string().regex(/^\d{5}$/, "Code postal invalide"),
  ville: z.string().min(1, "Ville requise"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const contactSchema = z.object({
  civilite: z.string().min(1),
  prenom: z.string().min(1),
  nom: z.string().min(1),
  email: z.string().email(),
  telephone: z.string().min(6),
});

const rappelSchema = z.object({
  date: z.string().min(1),
  heure: z.string().min(1),
});

export const submitSimulationSchema = z
  .object({
    profil: z.enum(["bailleur", "sci", "locataire", "proprietaire_occupant"]),
    raisonSociale: z.string().optional(),

    // Patrimoine SCI / bailleur
    patrimoineType: z.enum(["appartements", "maisons", "mixte"]).optional(),
    nbLogements: z.number().int().min(1).max(10_000).optional(),
    surfaceTotaleM2: z.number().min(1).max(1_000_000).optional(),

    // Logement (proprio)
    typeLogement: z.enum(["maison", "appartement"]).optional(),
    periodeConstruction: z.enum(["avant_2000", "apres_2000"]).optional(),

    // Questions techniques (proprio)
    iteItiRecente: z.boolean().optional(),
    fenetres: z.enum(["double_vitrage", "simple_vitrage_bois"]).optional(),
    sousSol: z.boolean().optional(),
    btdInstalle: z.boolean().optional(),
    vmcInstallee: z.boolean().optional(),

    // Communes
    chauffage: z.enum([
      "gaz",
      "gaz_cond",
      "fioul",
      "elec",
      "bois",
      "granules",
      "pac_air_eau",
      "pac_air_air",
    ]),
    chauffage24Mois: z.boolean().optional(),
    dpe: z.enum(["A", "B", "C", "D", "E", "F", "G", "inconnu"]),
    ageLogement: z.enum(["moins_15_ans", "plus_15_ans"]).optional(),
    travauxCeeRecus: z.enum(["oui", "non", "jsp"]).optional(),

    // Foyer
    nbPersonnes: z.number().int().min(1).max(12),
    trancheRevenu: z.enum(["tres_modeste", "modeste", "intermediaire", "superieur"]),

    // Coordonnées
    adresse: addressSchema,
    contact: contactSchema.optional(),
    rappel: rappelSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.profil === "locataire") {
      return;
    }
    if (!data.contact) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Contact requis", path: ["contact"] });
    }
    if (!data.rappel) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Créneau de rappel requis", path: ["rappel"] });
    }
    if (data.profil === "sci" || data.profil === "bailleur") {
      if (!(data.raisonSociale ?? "").trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Raison sociale requise",
          path: ["raisonSociale"],
        });
      }
      if (!data.patrimoineType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Type de patrimoine requis",
          path: ["patrimoineType"],
        });
      }
      if (!data.nbLogements) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Nombre de logements requis",
          path: ["nbLogements"],
        });
      }
      if (!data.surfaceTotaleM2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Surface totale requise",
          path: ["surfaceTotaleM2"],
        });
      }
    }
    if (data.profil === "proprietaire_occupant") {
      if (!data.typeLogement) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Type de logement requis",
          path: ["typeLogement"],
        });
      }
      if (!data.periodeConstruction) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Période de construction requise",
          path: ["periodeConstruction"],
        });
      }
    }
  });

export type SubmitSimulationInput = z.infer<typeof submitSimulationSchema>;
