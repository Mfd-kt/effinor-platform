import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';

export default function PolitiqueConfidentialite() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <Helmet>
        <title>Politique de Confidentialité | EFFINOR</title>
        <meta name="description" content="Politique de confidentialité et protection des données personnelles de EFFINOR" />
      </Helmet>

      <div className="container mx-auto py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Politique de Confidentialité</h1>
        <p className="text-gray-600 mb-8">Mise à jour: {formattedDate}</p>

        {/* Introduction */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">1. Introduction</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              ECPS, opérant sous le nom commercial <strong>EFFINOR Air-Energie-Lighting</strong>, 
              est engagée à protéger votre vie privée et à assurer la transparence concernant 
              le traitement de vos données personnelles.
            </p>
            <p>
              Cette politique de confidentialité explique comment nous collectons, utilisons, 
              partageons et protégeons vos informations personnelles conformément au Règlement 
              Général sur la Protection des Données (RGPD) et à la loi française relative à 
              la protection des données personnelles.
            </p>
            <div className="bg-secondary-50 border-l-4 border-secondary-500 p-4 mt-4">
              <p className="font-semibold">Responsable du traitement des données:</p>
              <p>ECPS - EFFINOR Air-Energie-Lighting</p>
              <p>1 Avenue de l'Europe 94320 Thiais Tour europa</p>
              <p>RCS: 907 547 665 R.C.S. Créteil</p>
            </div>
          </div>
        </section>

        {/* Data Collection */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">2. Données Collectées</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold">2.1 Données Collectées Directement</h3>
            <p>Nous collectons les données suivantes lorsque vous interagissez avec notre site:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Informations d'identification:</strong> Nom, prénom, adresse email, numéro de téléphone</li>
              <li><strong>Informations de contact:</strong> Adresse postale, ville, code postal, pays</li>
              <li><strong>Informations professionnelles:</strong> Entreprise, fonction, secteur d'activité</li>
              <li><strong>Informations de paiement:</strong> Données bancaires (traitées de manière sécurisée)</li>
              <li><strong>Informations de commande:</strong> Produits commandés, quantités, dates</li>
              <li><strong>Communications:</strong> Contenu des messages, demandes de devis, questions</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">2.2 Données Collectées Automatiquement</h3>
            <p>Lors de votre visite sur notre site, nous collectons automatiquement:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Données de navigation:</strong> Pages visitées, durée de visite, liens cliqués</li>
              <li><strong>Données techniques:</strong> Adresse IP, type de navigateur, système d'exploitation</li>
              <li><strong>Données de localisation:</strong> Localisation approximative basée sur l'IP</li>
              <li><strong>Cookies et technologies similaires:</strong> Identifiants de session, préférences</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">2.3 Données de Tiers</h3>
            <p>Nous pouvons recevoir vos données de la part de:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Partenaires commerciaux</li>
              <li>Prestataires de services</li>
              <li>Réseaux sociaux (si vous connectez votre compte)</li>
              <li>Fournisseurs de données publiques</li>
            </ul>
          </div>
        </section>

        {/* Data Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">3. Utilisation des Données</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>Nous utilisons vos données personnelles pour:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Exécution des contrats:</strong> Traitement des commandes, livraison, facturation</li>
              <li><strong>Communication:</strong> Répondre à vos demandes, envoyer des confirmations</li>
              <li><strong>Marketing:</strong> Envoyer des newsletters et offres promotionnelles (avec consentement)</li>
              <li><strong>Amélioration des services:</strong> Analyser l'utilisation du site, améliorer l'expérience utilisateur</li>
              <li><strong>Conformité légale:</strong> Respecter les obligations légales et réglementaires</li>
              <li><strong>Sécurité:</strong> Prévenir la fraude, protéger nos systèmes</li>
              <li><strong>Études de marché:</strong> Comprendre vos besoins et préférences</li>
              <li><strong>Assistance client:</strong> Fournir un support technique et commercial</li>
            </ul>
          </div>
        </section>

        {/* Legal Basis */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">4. Base Légale du Traitement</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>Nous traitons vos données sur les bases légales suivantes:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Exécution d'un contrat:</strong> Pour traiter vos commandes et livraisons</li>
              <li><strong>Consentement:</strong> Pour les communications marketing et les cookies non essentiels</li>
              <li><strong>Intérêt légitime:</strong> Pour améliorer nos services et prévenir la fraude</li>
              <li><strong>Obligation légale:</strong> Pour respecter les lois fiscales et comptables</li>
            </ul>
          </div>
        </section>

        {/* Data Sharing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">5. Partage des Données</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>Nous partageons vos données avec:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Prestataires de services:</strong> Transporteurs, hébergeurs, processeurs de paiement</li>
              <li><strong>Partenaires commerciaux:</strong> Fournisseurs, distributeurs</li>
              <li><strong>Autorités légales:</strong> Si requis par la loi</li>
              <li><strong>Acquéreurs potentiels:</strong> En cas de fusion ou acquisition</li>
            </ul>
            <p className="mt-4">
              <strong>Nous ne vendons jamais vos données personnelles à des tiers.</strong>
            </p>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">6. Durée de Conservation des Données</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2 text-left">Type de Données</th>
                  <th className="border p-2 text-left">Durée de Conservation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-2">Données de compte client</td>
                  <td className="border p-2">Durée de la relation commerciale + 3 ans</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="border p-2">Données de commande</td>
                  <td className="border p-2">10 ans (obligation légale)</td>
                </tr>
                <tr>
                  <td className="border p-2">Données de paiement</td>
                  <td className="border p-2">Selon les normes PCI-DSS</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="border p-2">Données de navigation</td>
                  <td className="border p-2">13 mois maximum</td>
                </tr>
                <tr>
                  <td className="border p-2">Données marketing</td>
                  <td className="border p-2">Jusqu'à désinscription</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="border p-2">Logs de sécurité</td>
                  <td className="border p-2">1 an</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Data Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">7. Sécurité des Données</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>Nous mettons en place des mesures de sécurité robustes pour protéger vos données:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Chiffrement SSL/TLS:</strong> Toutes les données en transit sont chiffrées</li>
              <li><strong>Chiffrement des données:</strong> Les données sensibles sont chiffrées au repos</li>
              <li><strong>Contrôle d'accès:</strong> Accès limité aux données selon les rôles</li>
              <li><strong>Authentification forte:</strong> Mots de passe sécurisés et authentification multi-facteurs</li>
              <li><strong>Audits de sécurité:</strong> Vérifications régulières de nos systèmes</li>
              <li><strong>Sauvegarde régulière:</strong> Sauvegardes automatiques et redondance</li>
              <li><strong>Plan de continuité:</strong> Procédures de récupération en cas d'incident</li>
            </ul>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-4">
              <p className="font-semibold">Important:</p>
              <p>Bien que nous mettions en place des mesures de sécurité appropriées, aucun système n'est 100% sécurisé. Nous vous recommandons de protéger vos identifiants de connexion.</p>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">8. Vos Droits</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>Conformément au RGPD, vous disposez des droits suivants:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Droit d'accès:</strong> Obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification:</strong> Corriger les données inexactes</li>
              <li><strong>Droit à l'oubli:</strong> Demander la suppression de vos données</li>
              <li><strong>Droit à la limitation:</strong> Limiter le traitement de vos données</li>
              <li><strong>Droit à la portabilité:</strong> Recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition:</strong> Vous opposer au traitement de vos données</li>
              <li><strong>Droit de ne pas être soumis à une décision automatisée:</strong> Demander une intervention humaine</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à: <strong>contact@effinor.fr</strong>
            </p>
            <p>
              Nous répondrons à votre demande dans un délai de 30 jours.
            </p>
          </div>
        </section>

        {/* Cookies */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">9. Cookies et Technologies de Suivi</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold">9.1 Types de Cookies</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Cookies essentiels:</strong> Nécessaires au fonctionnement du site</li>
              <li><strong>Cookies de performance:</strong> Analysent l'utilisation du site</li>
              <li><strong>Cookies de marketing:</strong> Utilisés pour les publicités ciblées</li>
              <li><strong>Cookies de tiers:</strong> Définis par nos partenaires</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">9.2 Gestion des Cookies</h3>
            <p>
              Vous pouvez contrôler les cookies via les paramètres de votre navigateur. 
              Vous pouvez refuser les cookies non essentiels, mais cela peut affecter votre expérience.
            </p>
          </div>
        </section>

        {/* Third Party Links */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">10. Liens Externes</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              Notre site peut contenir des liens vers des sites externes. Nous ne sommes pas responsables 
              de leurs politiques de confidentialité. Nous vous recommandons de consulter leur politique 
              avant de partager vos données personnelles.
            </p>
          </div>
        </section>

        {/* Children Privacy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">11. Protection des Enfants</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              Notre site n'est pas destiné aux enfants de moins de 16 ans. Nous ne collectons pas 
              intentionnellement des données personnelles d'enfants. Si nous découvrons que nous avons 
              collecté des données d'un enfant, nous les supprimerons immédiatement.
            </p>
          </div>
        </section>

        {/* International Transfers */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">12. Transferts Internationaux</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              Vos données peuvent être transférées vers des pays en dehors de l'Union Européenne. 
              Nous assurons que ces transferts sont protégés par des mécanismes appropriés, 
              notamment les clauses contractuelles types approuvées par la Commission Européenne.
            </p>
          </div>
        </section>

        {/* Changes to Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">13. Modifications de cette Politique</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              Nous pouvons mettre à jour cette politique de confidentialité à tout moment. 
              Les modifications seront publiées sur cette page avec une date de mise à jour. 
              Votre utilisation continue du site après les modifications constitue votre acceptation 
              de la politique mise à jour.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">14. Nous Contacter</h2>
          <div className="bg-secondary-50 p-6 rounded-lg space-y-4 border-l-4 border-secondary-500">
            <p className="font-semibold">Pour toute question concernant cette politique:</p>
            <div className="space-y-2">
              <p><strong>Email:</strong> contact@effinor.fr</p>
              <p><strong>Adresse:</strong> 1 Avenue de l'Europe 94320 Thiais Tour europa</p>
              <p><strong>Téléphone:</strong> À ajouter</p>
              <p><strong>Responsable de la Protection des Données (DPO):</strong> dpo@effinor.fr</p>
            </div>
            <p className="mt-4 text-sm">
              Vous avez également le droit de déposer une plainte auprès de l'autorité de contrôle 
              compétente (CNIL en France).
            </p>
          </div>
        </section>

        {/* Company Info */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">15. Informations sur l'Entreprise</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p><strong>Entreprise:</strong> ECPS</p>
            <p><strong>Nom commercial:</strong> EFFINOR Air-Energie-Lighting</p>
            <p><strong>RCS:</strong> 907 547 665 R.C.S. Créteil</p>
            <p><strong>EUID:</strong> FR9401.907547665</p>
            <p><strong>Capital social:</strong> 115 900,00 Euros</p>
            <p><strong>Adresse:</strong> 1 Avenue de l'Europe 94320 Thiais Tour europa</p>
            <p><strong>Code APE:</strong> 7112 B</p>
          </div>
        </section>
      </div>
    </>
  );
}