import React from 'react';
import { Helmet } from 'react-helmet';

const LegalNotice = () => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <Helmet>
        <title>Mentions Légales | EFFINOR</title>
        <meta name="description" content="Mentions légales et informations légales de EFFINOR" />
      </Helmet>

      <div className="bg-white">
        <div className="container mx-auto py-12 md:py-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">Mentions Légales</h1>
            <p className="text-gray-500 mb-8">Mise à jour : {formattedDate}</p>
            
            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold mb-6 border-b pb-3">Identification de la Personne Morale</h2>
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Immatriculation au RCS</h3>
                    <p><strong>Numéro:</strong> 907 547 665 R.C.S. Créteil</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Informations Générales</h3>
                    <div className="space-y-2">
                      <p><strong>Dénomination sociale:</strong> ECPS</p>
                      <p><strong>Nom commercial:</strong> EFFINOR Air-Energie-Lighting</p>
                      <p><strong>Forme juridique:</strong> Société par actions simplifiée (SAS)</p>
                      <p><strong>Capital social:</strong> 115 900,00 Euros</p>
                      <p><strong>Numéro d'identification Européen (EUID):</strong> FR9401.907547665</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Adresse du Siège</h3>
                    <p>1 Avenue de l'Europe 94320 Thiais Tour europa</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Activités Principales</h3>
                    <div className="space-y-2">
                      <p><strong>Code APE:</strong> 7112 B</p>
                      <p><strong>Activité:</strong> Bureau d'étude, performance énergétique</p>
                      <p><strong>Services:</strong> Audit thermique Chauffage, Climatisation, Plomberie et Électricité</p>
                      <p><strong>Date de commencement d'activité:</strong> 29/11/2021</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">Durée de la Personne Morale</h3>
                    <div className="space-y-2">
                      <p><strong>Durée:</strong> Jusqu'au 25/11/2120</p>
                      <p><strong>Date de clôture de l'exercice social:</strong> 31 décembre</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6 border-b pb-3">Contact</h2>
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                  <p className="mb-2"><strong>Adresse:</strong> 1 Avenue de l'Europe 94320 Thiais Tour europa</p>
                  <p><strong>Email:</strong> contact@effinor.fr</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6 border-b pb-3">Hébergement</h2>
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                  <p className="mb-2"><strong>Hébergeur:</strong> Hostinger International Ltd.</p>
                  <p><strong>Adresse:</strong> 61 Lordou Vironos Street, 6023 Larnaca, Chypre</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6 border-b pb-3">Propriété Intellectuelle</h2>
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                  <p>Tous les contenus de ce site (textes, images, logos, etc.) sont la propriété exclusive de EFFINOR ou de ses partenaires. Toute reproduction, distribution ou utilisation sans autorisation est interdite.</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-6 border-b pb-3">Responsabilité</h2>
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                  <p>EFFINOR s'efforce de fournir des informations exactes et à jour. Cependant, nous ne pouvons pas garantir l'exactitude, l'exhaustivité ou l'actualité des informations fournies sur ce site.</p>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-bold mb-6 border-b pb-3">Protection des Données Personnelles</h2>
                <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                  <p>
                    Conformément à la loi « Informatique et Libertés » du 6 janvier 1978 modifiée et au Règlement 
                    Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification 
                    et de suppression des données vous concernant. Pour exercer ces droits, vous pouvez nous contacter à l'adresse : contact@effinor.fr
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LegalNotice;