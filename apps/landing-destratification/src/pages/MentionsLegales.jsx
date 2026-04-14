import React from 'react';
import { Helmet } from 'react-helmet-async';
import { absoluteUrl } from '@/lib/site';

const MentionsLegales = () => {
  const canonical = absoluteUrl('/mentions-legales');

  return (
    <div className="container mx-auto px-4 max-w-4xl py-12">
      <Helmet>
        <title>Mentions légales | Effinor</title>
        <meta name="description" content="Mentions légales du site Effinor." />
        {canonical ? <link rel="canonical" href={canonical} /> : null}
      </Helmet>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Mentions légales</h1>

      <div className="text-gray-700 leading-relaxed space-y-4">
        <p className="text-sm text-gray-600">
          Ce document est fourni à titre de modèle. Remplissez/validez les informations légales (raison sociale,
          SIREN/SIRET, RCS, TVA, directeur de publication, hébergeur, etc.) avant mise en ligne.
        </p>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Éditeur du site</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Effinor / ECPS</li>
            <li>Adresse : Avenue de l'Europe - Tour Europa - Thiais 94320</li>
            <li>Téléphone : 09 78 45 50 63</li>
            <li>Email : contact@effinor.fr</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Hébergement</h2>
          <p>À compléter (nom de l’hébergeur, adresse, téléphone).</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Propriété intellectuelle</h2>
          <p>
            L’ensemble des contenus (textes, images, éléments graphiques) est protégé. Toute reproduction non autorisée
            est interdite.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MentionsLegales;

