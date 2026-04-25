import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/sections/legal-page-layout'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description:
    "Politique de confidentialité du site effinor.fr — traitement des données personnelles, droits RGPD.",
}

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPageLayout
      title="Politique de confidentialité"
      lastUpdated="25 avril 2026"
    >
      <section>
        <h2>1. Responsable de traitement</h2>
        <p>
          Le responsable du traitement des données personnelles collectées sur ce site est{' '}
          <strong>{siteConfig.legal.companyName}</strong>, dont les coordonnées figurent sur la{' '}
          <a href="/mentions-legales">page mentions légales</a>.
        </p>
      </section>

      <section>
        <h2>2. Données collectées</h2>
        <p>Nous collectons les données suivantes lorsque vous remplissez le formulaire de contact :</p>
        <ul>
          <li>Identité : prénom, nom</li>
          <li>Coordonnées : email, téléphone (optionnel)</li>
          <li>Contenu de votre demande : sujet, message</li>
          <li>
            Données techniques : adresse IP (anonymisée), user-agent, page d&apos;origine, date et
            heure d&apos;envoi
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Finalités</h2>
        <p>Vos données sont collectées et traitées exclusivement pour :</p>
        <ul>
          <li>Répondre à votre demande de contact ou de devis</li>
          <li>Vous adresser une proposition commerciale liée à votre projet</li>
          <li>
            Améliorer nos services et notre expérience utilisateur (sur la base de données agrégées et
            anonymisées)
          </li>
          <li>
            Respecter nos obligations légales et réglementaires (notamment dans le cadre des dossiers
            d&apos;aides publiques)
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Base légale</h2>
        <p>
          Le traitement de vos données est fondé sur votre <strong>consentement</strong> (case à
          cocher du formulaire) et, le cas échéant, sur l&apos;exécution de mesures précontractuelles
          prises à votre demande.
        </p>
      </section>

      <section>
        <h2>5. Destinataires</h2>
        <p>
          Vos données sont accessibles uniquement aux personnes habilitées au sein de{' '}
          {siteConfig.legal.companyName} (équipe administrative et commerciale). Elles ne sont{' '}
          <strong>jamais vendues ni partagées</strong> à des fins commerciales avec des tiers.
        </p>
        <p>
          Nos sous-traitants techniques (hébergeur Supabase, hébergeur applicatif Dokploy) peuvent
          accéder à ces données dans le cadre strict de leurs prestations, sous accord de
          confidentialité.
        </p>
      </section>

      <section>
        <h2>6. Durée de conservation</h2>
        <ul>
          <li>
            <strong>Demandes de contact non converties</strong> : 3 ans à compter du dernier
            échange (recommandation CNIL pour la prospection commerciale).
          </li>
          <li>
            <strong>Dossiers clients</strong> : durée de la relation commerciale, puis archivage
            conformément aux obligations légales (10 ans pour la comptabilité).
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Vos droits (RGPD)</h2>
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
          Informatique et Libertés, vous disposez des droits suivants :
        </p>
        <ul>
          <li>Droit d&apos;accès à vos données</li>
          <li>Droit de rectification</li>
          <li>Droit à l&apos;effacement (« droit à l&apos;oubli »)</li>
          <li>Droit à la limitation du traitement</li>
          <li>Droit à la portabilité</li>
          <li>Droit d&apos;opposition</li>
          <li>Droit de retirer votre consentement à tout moment</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à l&apos;adresse{' '}
          <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>.
          Nous répondrons sous un délai d&apos;un mois.
        </p>
        <p>
          En cas de désaccord persistant, vous avez le droit d&apos;introduire une réclamation auprès
          de la <a href="https://www.cnil.fr" rel="noopener noreferrer" target="_blank">CNIL</a>.
        </p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>
          Le site n&apos;utilise <strong>aucun cookie de tracking ni de publicité</strong>. Seuls
          des cookies techniques strictement nécessaires au fonctionnement du site peuvent être
          déposés (préférences d&apos;affichage notamment). Aucun consentement n&apos;est requis
          pour ces cookies.
        </p>
      </section>

      <section>
        <h2>9. Sécurité</h2>
        <p>
          Nous mettons en œuvre les mesures techniques et organisationnelles appropriées pour
          protéger vos données contre l&apos;accès non autorisé, la perte, la destruction ou
          l&apos;altération : chiffrement TLS, contrôles d&apos;accès stricts (Row Level Security
          Supabase), hébergement en Union Européenne.
        </p>
      </section>
    </LegalPageLayout>
  )
}
