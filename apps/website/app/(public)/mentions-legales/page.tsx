import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/sections/legal-page-layout'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: "Mentions légales du site effinor.fr — éditeur, hébergeur, propriété intellectuelle.",
  robots: { index: true, follow: true },
}

export default function MentionsLegalesPage() {
  return (
    <LegalPageLayout title="Mentions légales" lastUpdated="25 avril 2026">
      <section>
        <h2>1. Éditeur du site</h2>
        <p>
          Le présent site <strong>{siteConfig.url}</strong> est édité par :
        </p>
        <ul>
          <li>
            <strong>Raison sociale</strong> : {siteConfig.legal.companyName}
          </li>
          <li>
            <strong>Adresse</strong> : {siteConfig.contact.address.full}
          </li>
          <li>
            <strong>Téléphone</strong> : {siteConfig.contact.phone}
          </li>
          <li>
            <strong>Email</strong> :{' '}
            <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
          </li>
          <li>
            <strong>SIRET</strong> :{' '}
            {siteConfig.legal.siret || (
              <span className="italic text-destructive">[à compléter]</span>
            )}
          </li>
        </ul>
      </section>

      <section>
        <h2>2. Directeur de la publication</h2>
        <p>
          Le directeur de la publication du site est le représentant légal de{' '}
          {siteConfig.legal.companyName}.
        </p>
      </section>

      <section>
        <h2>3. Hébergement</h2>
        <p>
          Le site est hébergé sur une infrastructure auto-administrée via{' '}
          <a href="https://dokploy.com" rel="noopener noreferrer" target="_blank">
            Dokploy
          </a>
          .
        </p>
        <p>
          Les données stockées (table contacts notamment) sont hébergées par{' '}
          <strong>Supabase</strong> sur des serveurs situés dans l&apos;Union Européenne.
        </p>
      </section>

      <section>
        <h2>4. Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus présents sur ce site (textes, images, logos, vidéos,
          graphismes, code source) est la propriété exclusive de {siteConfig.legal.companyName}{' '}
          ou de ses partenaires, et est protégé par le droit français et international de la
          propriété intellectuelle.
        </p>
        <p>
          Toute reproduction, distribution, modification ou utilisation de ces contenus, sans
          autorisation écrite préalable, est strictement interdite et constituerait une
          contrefaçon.
        </p>
      </section>

      <section>
        <h2>5. Liens hypertextes</h2>
        <p>
          Le site peut contenir des liens vers d&apos;autres sites internet.{' '}
          {siteConfig.legal.companyName} ne saurait être tenue responsable du contenu ou du
          fonctionnement de ces sites tiers.
        </p>
      </section>

      <section>
        <h2>6. Limitation de responsabilité</h2>
        <p>
          {siteConfig.legal.companyName} met tout en œuvre pour fournir des informations exactes
          et à jour. Toutefois, elle ne saurait garantir l&apos;exactitude, la complétude ou
          l&apos;actualité des informations diffusées sur le site, notamment concernant les
          montants d&apos;aides publiques qui évoluent régulièrement.
        </p>
      </section>

      <section>
        <h2>7. Droit applicable et juridiction compétente</h2>
        <p>
          Les présentes mentions légales sont régies par le droit français. En cas de litige, et
          à défaut d&apos;accord amiable, les tribunaux français seront seuls compétents.
        </p>
      </section>
    </LegalPageLayout>
  )
}
