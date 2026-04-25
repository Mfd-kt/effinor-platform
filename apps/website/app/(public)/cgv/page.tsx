import type { Metadata } from 'next'
import { LegalPageLayout } from '@/components/sections/legal-page-layout'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente',
  description:
    "Conditions Générales de Vente (CGV) applicables aux prestations de rénovation énergétique d'Effinor.",
}

export default function CgvPage() {
  return (
    <LegalPageLayout title="Conditions Générales de Vente" lastUpdated="25 avril 2026">
      <section>
        <p className="!text-foreground">
          Les présentes Conditions Générales de Vente (CGV) s&apos;appliquent à toute prestation de
          travaux de rénovation énergétique réalisée par {siteConfig.legal.companyName} pour le
          compte d&apos;un client particulier ou professionnel.
        </p>
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 !text-amber-900">
          <strong>Note :</strong> ce document est un cadre général. Les conditions précises
          (prix, délais, obligations spécifiques) figurent dans le devis signé entre {siteConfig.legal.companyName}{' '}
          et le client, qui prévaut sur le présent texte en cas de divergence. Les présentes CGV
          seront complétées par notre service juridique.
        </p>
      </section>

      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes CGV ont pour objet de définir les droits et obligations des parties dans
          le cadre des prestations proposées par {siteConfig.legal.companyName} : audit énergétique,
          études thermiques, fourniture et installation d&apos;équipements de chauffage / ECS,
          travaux de rénovation énergétique, accompagnement administratif aux aides publiques.
        </p>
      </section>

      <section>
        <h2>2. Devis et acceptation</h2>
        <p>
          Toute prestation fait l&apos;objet d&apos;un devis détaillé, gratuit et sans engagement,
          remis au client préalablement à toute exécution. Le devis précise notamment la nature
          des travaux, le matériel fourni, le prix HT et TTC, les délais d&apos;intervention et les
          conditions de paiement.
        </p>
        <p>
          Le devis est valable pendant la durée mentionnée sur le document (généralement{' '}
          <strong>30 jours</strong>). Il devient ferme et définitif à compter de sa signature
          par le client, qui vaut acceptation pleine et entière des présentes CGV.
        </p>
      </section>

      <section>
        <h2>3. Prix et conditions de paiement</h2>
        <p>
          Les prix sont indiqués en euros, taxes comprises (TTC), avec mention du taux de TVA
          applicable (généralement 5,5% pour les travaux de rénovation énergétique éligibles).
        </p>
        <p>Sauf stipulation contraire dans le devis, les modalités de paiement sont les suivantes :</p>
        <ul>
          <li>Acompte à la signature : 30% du montant TTC</li>
          <li>Solde à la réception des travaux, après procès-verbal de réception</li>
        </ul>
        <p>
          En cas de retard de paiement, des pénalités de retard sont applicables au taux légal en
          vigueur, ainsi qu&apos;une indemnité forfaitaire de recouvrement de <strong>40 €</strong>{' '}
          (article L.441-10 du Code de commerce).
        </p>
      </section>

      <section>
        <h2>4. Délais d&apos;exécution</h2>
        <p>
          Les délais d&apos;exécution sont précisés dans le devis. Ils sont donnés à titre indicatif
          et peuvent être ajustés en fonction des contraintes de chantier (intempéries, livraison
          fournisseurs, accès au logement). {siteConfig.legal.companyName} s&apos;engage à informer
          le client de tout retard significatif.
        </p>
      </section>

      <section>
        <h2>5. Aides publiques</h2>
        <p>
          {siteConfig.legal.companyName} propose un accompagnement complet pour la mobilisation des
          aides (MaPrimeRénov&apos;, CEE, éco-PTZ). Cet accompagnement est inclus dans la prestation
          et fait l&apos;objet d&apos;un mandat séparé signé entre les parties.
        </p>
        <p>
          Les montants d&apos;aides indiqués lors du devis sont des estimations basées sur les
          informations fournies par le client (revenus, situation du logement). Le montant
          définitif dépend de l&apos;instruction des dossiers par les organismes compétents et ne
          peut être garanti par {siteConfig.legal.companyName}.
        </p>
      </section>

      <section>
        <h2>6. Garanties</h2>
        <ul>
          <li>
            <strong>Garantie de parfait achèvement</strong> (1 an) : couvre l&apos;ensemble des
            désordres signalés à la réception des travaux.
          </li>
          <li>
            <strong>Garantie biennale</strong> (2 ans) : couvre les éléments d&apos;équipement
            dissociables.
          </li>
          <li>
            <strong>Garantie décennale</strong> (10 ans) : couvre les dommages compromettant la
            solidité de l&apos;ouvrage ou le rendant impropre à sa destination.
          </li>
          <li>
            <strong>Garanties constructeurs</strong> : applicables sur les équipements installés
            (durée variable selon le fabricant, généralement 5 à 10 ans pour les PAC).
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Droit de rétractation</h2>
        <p>
          Conformément aux articles L.221-18 et suivants du Code de la consommation, le client
          particulier dispose d&apos;un délai de <strong>14 jours</strong> à compter de la signature
          du devis (lorsque celui-ci est signé hors établissement, par exemple à domicile) pour
          se rétracter, sans avoir à motiver sa décision.
        </p>
      </section>

      <section>
        <h2>8. Réclamations et médiation</h2>
        <p>
          Toute réclamation doit être adressée par écrit à{' '}
          <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>.{' '}
          {siteConfig.legal.companyName} s&apos;engage à apporter une réponse sous 15 jours
          ouvrés.
        </p>
        <p>
          En cas de litige persistant et conformément à l&apos;article L.612-1 du Code de la
          consommation, le client consommateur peut recourir gratuitement au médiateur de la
          consommation compétent (références à venir).
        </p>
      </section>

      <section>
        <h2>9. Droit applicable</h2>
        <p>
          Les présentes CGV sont régies par le droit français. Tout litige relatif à leur
          interprétation ou à leur exécution relève des tribunaux français compétents.
        </p>
      </section>
    </LegalPageLayout>
  )
}
