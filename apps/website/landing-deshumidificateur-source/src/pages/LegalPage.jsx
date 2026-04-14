import React from 'react';
    import Header from '@/components/Header';
    import Footer from '@/components/Footer';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet-async';

    const LegalPage = () => {
      const navItems = [
        { label: 'Accueil', sectionId: 'hero', isExternal: true },
      ];

      const scrollToSection = (sectionId) => {
        if (sectionId === 'hero') {
          window.location.href = '/';
        }
      };

      return (
        <>
          <Helmet>
            <title>Mentions Légales - Déshumidificateur pour Serres Maraîchères</title>
            <meta name="description" content="Consultez les mentions légales de notre site dédié au déshumidificateur thermodynamique pour serres maraîchères et l'opération AGRI-TH-117." />
            <meta property="og:title" content="Mentions Légales - Déshumidificateur pour Serres Maraîchères" />
            <meta property="og:description" content="Consultez les mentions légales de notre site dédié au déshumidificateur thermodynamique pour serres maraîchères et l'opération AGRI-TH-117." />
          </Helmet>
          <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
            <Header navItems={navItems} scrollToSection={scrollToSection} />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-slate-900 shadow-xl rounded-lg p-6 md:p-10"
              >
                <h1 className="text-3xl font-bold mb-8 text-center gradient-text">Mentions Légales</h1>

                <section className="mb-6">
                  <h2 className="text-2xl font-semibold mb-3 text-primary dark:text-emerald-400">Informations légales</h2>
                  <p><strong>Groupe Effinor</strong>, via son entreprise sous-jacente :</p>
                  <p><strong>ECPS</strong></p>
                  <p>SIREN : 907 547 665</p>
                  <p>SIRET (siège) : 907 547 665 00014</p>
                  <p>Forme juridique : SASU, société par actions simplifiée unipersonnelle</p>
                  <p>Numéro de TVA : FR59907547665</p>
                  <p>Inscription au RCS : INSCRIT (au greffe d'EVRY, le 25/11/2021)</p>
                  <p>Inscription au RNE : INSCRIT (le 25/11/2021)</p>
                  <p>Capital social : 4 000,00 €</p>
                  <p>Date de création : 29/11/2021</p>
                  <p>Dirigeant : MILADI Nazih</p>
                </section>

                <section className="mb-6">
                  <h2 className="text-2xl font-semibold mb-3 text-primary dark:text-emerald-400">Siège social</h2>
                  <p>Avenue de l'Europe - Tour Europa</p>
                  <p>Thiais 94320</p>
                  <p>France</p>
                </section>

                <section className="mb-6">
                  <h2 className="text-2xl font-semibold mb-3 text-primary dark:text-emerald-400">Contact</h2>
                  <p>Email : <a href="mailto:contact@effinor.fr" className="text-primary hover:underline dark:text-emerald-400">contact@effinor.fr</a></p>
                  <p>Téléphone : <a href="tel:+33978455063" className="text-primary hover:underline dark:text-emerald-400">09 78 45 50 63</a></p>
                  <p>Horaires : Lun-Ven: 8h-18h</p>
                  <p>(Ces coordonnées sont celles du Groupe Effinor, pour toute demande liée à l'opération AGRI-TH-117)</p>
                </section>

                <section className="mb-6">
                  <h2 className="text-2xl font-semibold mb-3 text-primary dark:text-emerald-400">Activité</h2>
                  <p>Activité principale déclarée (ECPS) : Chauffage, Climatisation, Plomberie et Electricité</p>
                  <p>Code NAF ou APE : 43.22B (Travaux d'installation d'équipements thermiques et de climatisation)</p>
                  <p>Domaine d’activité : Travaux de construction spécialisés</p>
                  <p>Formes d'exercice : Commerciale, Artisanale réglementée</p>
                  <p>Convention collective supposée : Ouvriers des entreprises du bâtiment de plus de 10 salariés - IDCC 1597</p>
                  <p>Ce site est dédié à la promotion de l'opération AGRI-TH-117 et aux solutions de déshumidification pour serres maraîchères.</p>
                </section>

                <section className="mb-6">
                  <h2 className="text-2xl font-semibold mb-3 text-primary dark:text-emerald-400">Hébergement du site</h2>
                  <p>Ce site est hébergé par :</p>
                  <p><strong>Hostinger International Ltd.</strong></p>
                  <p>61 Lordou Vironos Street</p>
                  <p>6023 Larnaca</p>
                  <p>Chypre</p>
                  <p>Hébergeur certifié ISO 27001, garantissant une infrastructure écologique et des serveurs situés en France.</p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold mb-3 text-primary dark:text-emerald-400">Propriété intellectuelle</h2>
                  <p>L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.</p>
                </section>
              </motion.div>
            </main>
            <Footer navItems={navItems} scrollToSection={scrollToSection} />
          </div>
        </>
      );
    };

    export default LegalPage;