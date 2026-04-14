import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

export default function CGV() {
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
        <title>Conditions Générales de Vente | EFFINOR</title>
        <meta name="description" content="Conditions générales de vente de EFFINOR" />
      </Helmet>

      <div className="container mx-auto py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-2">Conditions Générales de Vente</h1>
        <p className="text-gray-600 mb-8">Mise à jour: {formattedDate}</p>

        {/* Company Info */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Informations sur l'Entreprise</h2>
          <div className="bg-secondary-50 p-6 rounded-lg border-l-4 border-secondary-500 space-y-2">
            <p><strong>Entreprise:</strong> ECPS</p>
            <p><strong>Nom commercial:</strong> EFFINOR Air-Energie-Lighting</p>
            <p><strong>RCS:</strong> 907 547 665 R.C.S. Créteil</p>
            <p><strong>EUID:</strong> FR9401.907547665</p>
            <p><strong>Capital social:</strong> 115 900,00 Euros</p>
            <p><strong>Adresse du siège:</strong> 1 Avenue de l'Europe 94320 Thiais Tour europa</p>
            <p><strong>Code APE:</strong> 7112 B</p>
            <p><strong>Email:</strong> contact@effinor.fr</p>
          </div>
        </section>

        {/* Article 1 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">1. Objet et Champ d'Application</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent les relations commerciales 
              entre EFFINOR et ses clients. Elles s'appliquent à toute commande passée sur notre site 
              ou par tout autre moyen de communication.
            </p>
            <p>
              En passant une commande, vous acceptez sans réserve l'intégralité de ces conditions.
            </p>
          </div>
        </section>

        {/* Article 2 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">2. Produits et Services</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold">2.1 Description des Produits</h3>
            <p>
              Les produits proposés sont décrits avec le plus de précision possible. 
              Cependant, les photographies et descriptions ne sont pas contractuelles.
            </p>

            <h3 className="text-xl font-semibold mt-4">2.2 Disponibilité</h3>
            <p>
              Les produits sont proposés dans la limite des stocks disponibles. 
              En cas d'indisponibilité, nous vous en informerons dans les meilleurs délais.
            </p>

            <h3 className="text-xl font-semibold mt-4">2.3 Services Additionnels</h3>
            <p>
              Nous proposons des services de conseil, audit énergétique et devis personnalisés. 
              Ces services sont fournis selon les conditions spécifiques convenues.
            </p>
          </div>
        </section>

        {/* Article 3 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">3. Tarifs et Conditions de Paiement</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold">3.1 Tarifs</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Les tarifs sont affichés en euros TTC</li>
              <li>Les tarifs sont valables pour la période indiquée</li>
              <li>EFFINOR se réserve le droit de modifier les tarifs à tout moment</li>
              <li>Les modifications ne s'appliquent qu'aux commandes futures</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">3.2 Conditions de Paiement</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Le paiement doit être effectué avant la livraison</li>
              <li>Modes de paiement acceptés: Carte bancaire, virement, chèque</li>
              <li>Les données bancaires sont traitées de manière sécurisée</li>
              <li>En cas de non-paiement, la commande sera annulée</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">3.3 Factures</h3>
            <p>
              Une facture sera envoyée après confirmation du paiement. 
              Les factures sont conservées selon les obligations légales (10 ans).
            </p>
          </div>
        </section>

        {/* Article 4 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">4. Livraison</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold">4.1 Délais de Livraison</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Les délais de livraison sont donnés à titre indicatif</li>
              <li>Délai standard: 5 à 10 jours ouvrables</li>
              <li>Les délais commencent après confirmation du paiement</li>
              <li>Les délais peuvent être prolongés en cas de force majeure</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">4.2 Frais de Livraison</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Les frais de livraison sont calculés selon le poids et la destination</li>
              <li>Livraison gratuite à partir d'un certain montant (à définir)</li>
              <li>Les frais de livraison sont affichés avant la confirmation</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">4.3 Responsabilité</h3>
            <p>
              Une fois le colis remis au transporteur, EFFINOR n'est plus responsable des dommages. 
              Vous devez vérifier l'état du colis à la réception et signaler tout dommage immédiatement.
            </p>

            <h3 className="text-xl font-semibold mt-4">4.4 Adresse de Livraison</h3>
            <p>
              La livraison s'effectue à l'adresse indiquée lors de la commande. 
              Vous êtes responsable de l'exactitude de cette adresse.
            </p>
          </div>
        </section>

        {/* Article 5 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">5. Droit de Rétractation</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold">5.1 Délai de Rétractation</h3>
            <p>
              Conformément à la loi, vous disposez d'un délai de <strong>14 jours</strong> à compter 
              de la réception du produit pour exercer votre droit de rétractation, sans justification.
            </p>

            <h3 className="text-xl font-semibold mt-4">5.2 Conditions de Rétractation</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Le produit doit être retourné dans son état d'origine</li>
              <li>L'emballage doit être intact</li>
              <li>Les accessoires et documentation doivent être inclus</li>
              <li>Les produits personnalisés ne peuvent pas être retournés</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">5.3 Procédure de Rétractation</h3>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Contactez-nous à contact@effinor.fr</li>
              <li>Indiquez votre numéro de commande</li>
              <li>Retournez le produit aux frais du client</li>
              <li>Nous vérifierons l'état du produit</li>
              <li>Le remboursement sera effectué sous 14 jours</li>
            </ol>

            <h3 className="text-xl font-semibold mt-4">5.4 Frais de Retour</h3>
            <p>
              Les frais de retour sont à la charge du client, sauf en cas de défaut ou d'erreur de notre part.
            </p>
          </div>
        </section>

        {/* Article 6 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">6. Garantie et Responsabilité</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <h3 className="text-xl font-semibold">6.1 Garantie Légale</h3>
            <p>
              Tous les produits bénéficient de la garantie légale de conformité de 2 ans 
              et de la garantie contre les vices cachés.
            </p>

            <h3 className="text-xl font-semibold mt-4">6.2 Garantie Commerciale</h3>
            <p>
              Certains produits peuvent bénéficier d'une garantie commerciale supplémentaire. 
              Les conditions seront précisées lors de la commande.
            </p>

            <h3 className="text-xl font-semibold mt-4">6.3 Exclusions de Garantie</h3>
            <p>La garantie ne couvre pas:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>L'usure normale</li>
              <li>Les dommages causés par une mauvaise utilisation</li>
              <li>Les modifications non autorisées</li>
              <li>Les dommages causés par un tiers</li>
              <li>Les dommages liés à l'installation</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">6.4 Responsabilité</h3>
            <p>
              EFFINOR ne peut être tenue responsable des dommages indirects, 
              pertes de profits ou interruptions d'activité.
            </p>
          </div>
        </section>

        {/* Article 7 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">7. Propriété Intellectuelle</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              Tous les contenus du site (textes, images, logos, vidéos) sont la propriété exclusive 
              d'EFFINOR ou de ses partenaires. Toute reproduction, distribution ou utilisation 
              sans autorisation est interdite.
            </p>
          </div>
        </section>

        {/* Article 8 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">8. Données Personnelles</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              Le traitement de vos données personnelles est régi par notre 
              <Link to="/politique-confidentialite" className="text-secondary-600 hover:underline"> Politique de Confidentialité</Link>.
            </p>
            <p>
              Nous vous recommandons de la consulter pour comprendre comment nous collectons, 
              utilisons et protégeons vos données.
            </p>
          </div>
        </section>

        {/* Article 9 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">9. Responsabilité du Client</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>Le client s'engage à:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Fournir des informations exactes et complètes</li>
              <li>Respecter les lois et réglementations applicables</li>
              <li>Ne pas utiliser les produits à des fins illégales</li>
              <li>Respecter les droits de propriété intellectuelle</li>
              <li>Ne pas transmettre de contenu offensant ou illégal</li>
            </ul>
          </div>
        </section>

        {/* Article 10 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">10. Limitation de Responsabilité</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              La responsabilité totale d'EFFINOR ne peut pas dépasser le montant de la commande. 
              EFFINOR ne peut pas être tenue responsable des dommages indirects ou consécutifs.
            </p>
          </div>
        </section>

        {/* Article 11 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">11. Modification des CGV</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              EFFINOR se réserve le droit de modifier ces CGV à tout moment. 
              Les modifications seront publiées sur cette page. Votre utilisation continue 
              du site constitue votre acceptation des modifications.
            </p>
          </div>
        </section>

        {/* Article 12 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">12. Droit Applicable et Juridiction</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              Ces CGV sont régies par la loi française. Tout litige sera soumis aux tribunaux 
              compétents de Créteil (94).
            </p>
            <p>
              En cas de litige, nous vous proposons d'abord une résolution amiable. 
              Vous pouvez également recourir à la médiation ou à l'arbitrage.
            </p>
          </div>
        </section>

        {/* Article 13 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">13. Contact et Support</h2>
          <div className="bg-secondary-50 p-6 rounded-lg border-l-4 border-secondary-500 space-y-4">
            <p className="font-semibold">Pour toute question ou réclamation:</p>
            <div className="space-y-2">
              <p><strong>Email:</strong> contact@effinor.fr</p>
              <p><strong>Adresse:</strong> 1 Avenue de l'Europe 94320 Thiais Tour europa</p>
              <p><strong>RCS:</strong> 907 547 665 R.C.S. Créteil</p>
            </div>
            <p className="mt-4 text-sm">
              Nous nous engageons à répondre à vos demandes dans les meilleurs délais.
            </p>
          </div>
        </section>

        {/* Article 14 */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">14. Dispositions Finales</h2>
          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <p>
              Si une disposition de ces CGV est jugée invalide, les autres dispositions 
              restent en vigueur.
            </p>
            <p>
              L'absence d'application d'une disposition ne constitue pas une renonciation à celle-ci.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}