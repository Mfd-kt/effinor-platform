import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, UserPlus } from 'lucide-react';

const HomeB2BCTA = ({ title, subtitle }) => {
  return (
    <section className="py-6 md:py-8 bg-secondary-600 text-white">
      <div className="container mx-auto max-w-7xl px-3 md:px-4">
        <div className="max-w-[95%] sm:max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[2fr,1.5fr] gap-4 md:gap-6 items-center">
            <div>
              <h2 className="text-base md:text-lg lg:text-xl font-semibold">
                {title || 'Devenir client Effinor Lighting'}
              </h2>
              <p className="mt-1.5 text-[11px] md:text-xs lg:text-sm text-secondary-50">
                {subtitle ||
                  "Rejoignez nos clients professionnels et bénéficiez de tarifs dégressifs, d'un suivi de projet personnalisé et d'une logistique optimisée pour vos chantiers. Accès prioritaire aux nouveautés et support technique dédié."}
              </p>
              <ul className="mt-3 md:mt-4 space-y-1.5 text-[11px] md:text-xs lg:text-sm text-secondary-50">
                <li>• Tarifs B2B dégressifs selon votre volume d'achat</li>
                <li>• Devis personnalisés sous 24h pour vos appels d'offres</li>
                <li>• Espace client avec historique des commandes et factures</li>
                <li>• Support technique et conseil projet gratuit</li>
              </ul>
            </div>
            <div className="flex flex-col gap-2 md:gap-3">
              <Link
                to="/espace-client"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white text-secondary-700 font-semibold text-sm md:text-base px-4 py-2.5 md:py-3 hover:bg-secondary-50 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                Accéder à l’espace client
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/espace-client/inscription"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/60 text-white font-medium text-xs md:text-sm px-4 py-2.5 hover:bg-secondary-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Créer un compte entreprise
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeB2BCTA;


