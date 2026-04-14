import React from 'react';
import { Helmet } from 'react-helmet-async';
import { absoluteUrl } from '@/lib/site';

const Rgpd = () => {
  const canonical = absoluteUrl('/rgpd');

  return (
    <div className="container mx-auto px-4 max-w-4xl py-12">
      <Helmet>
        <title>RGPD | Effinor</title>
        <meta name="description" content="Informations RGPD et exercice de vos droits." />
        {canonical ? <link rel="canonical" href={canonical} /> : null}
      </Helmet>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-6">RGPD</h1>

      <div className="text-gray-700 leading-relaxed space-y-4">
        <p>
          Vous disposez de droits sur vos données (accès, rectification, opposition, effacement, limitation, portabilité).
        </p>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Exercice des droits</h2>
          <p>
            Pour exercer vos droits, contactez-nous à <strong>contact@effinor.fr</strong> en précisant votre demande.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Réclamation</h2>
          <p>
            Vous pouvez également saisir l’autorité de contrôle compétente (CNIL).
          </p>
        </div>
      </div>
    </div>
  );
};

export default Rgpd;

