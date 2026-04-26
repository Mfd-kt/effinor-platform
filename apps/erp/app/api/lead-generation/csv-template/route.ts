import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Template CSV téléchargeable depuis la modale d'import manuel.
 * 14 colonnes standards + 2 lignes d'exemple (BtoB et BtoC).
 *
 * Contenu volontairement figé : pas d'auth (un CSV vide n'a aucune valeur
 * confidentielle) — le lien est pointé directement depuis la modale.
 */
const TEMPLATE = `entreprise,contact,civilite,prenom,nom,telephone,email,site_web,adresse,code_postal,ville,siret,categorie,notes
"SARL DURAND RÉNOVATION","Jean DURAND",M.,Jean,DURAND,0612345678,jean.durand@exemple.fr,https://durand-renovation.fr,"12 rue des Lilas",75011,Paris,12345678900012,"Maison individuelle","Propriétaire maison 1960 — intéressé PAC"
"Particulier","Sophie LEFEBVRE",Mme,Sophie,LEFEBVRE,0798765432,sophie.lefebvre@exemple.fr,,"45 avenue Jean Jaurès",69003,Lyon,,"Pavillon","Rénovation globale — fenêtres + chauffage"
`;

export function GET() {
  return new NextResponse(TEMPLATE, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="effinor-import-template.csv"',
      "cache-control": "public, max-age=86400",
    },
  });
}
