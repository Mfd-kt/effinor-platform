import React from 'react';
import { Helmet } from 'react-helmet-async';
import { absoluteUrl } from '@/lib/site';

const PolitiqueConfidentialite = () => {
  const canonical = absoluteUrl('/politique-de-confidentialite');

  return (
    <div className="container mx-auto px-4 max-w-4xl py-12">
      <Helmet>
        <title>Politique de confidentialité | Effinor</title>
        <meta name="description" content="Politique de confidentialité et information sur le traitement des données." />
        {canonical ? <link rel="canonical" href={canonical} /> : null}
      </Helmet>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Politique de confidentialité</h1>

      <div className="text-gray-700 leading-relaxed space-y-4">
        <p className="text-sm text-gray-600">
          Cette page décrit comment vos données sont traitées dans le cadre de la demande d’audit / devis. Ce contenu
          doit être relu et validé juridiquement avant publication.
        </p>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Données collectées</h2>
          <p>Nom, société (optionnel), email, téléphone, département, informations bâtiment (hauteur, surface, chauffé).</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Finalités</h2>
          <p>Traitement de votre demande, prise de contact, qualification d’éligibilité CEE, suivi commercial.</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Base légale</h2>
          <p>Intérêt légitime et/ou exécution de mesures précontractuelles (à préciser selon votre cas).</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Durée de conservation</h2>
          <p>À préciser (ex: durée nécessaire au traitement + obligations légales).</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Destinataires</h2>
          <p>Équipes Effinor/ECPS et prestataires techniques nécessaires au traitement (ex: outils d’automatisation).</p>
        </div>
      </div>
    </div>
  );
};

export default PolitiqueConfidentialite;

