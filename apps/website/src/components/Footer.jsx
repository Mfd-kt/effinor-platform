import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { inferEffinorSourceFromPath, trackCtaStudy, trackPhoneClick, trackEmailClick } from '@/lib/effinorAnalytics';
import { buildLeadFormHrefForPage } from '@/lib/leadFormDestination';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import Logo from '@/components/Logo';

const Footer = () => {
  const location = useLocation();
  const src = inferEffinorSourceFromPath(location.pathname);

  return (
    <footer className="bg-gray-900 bg-dark-section mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Logo size="lg" showText text="EFFINOR" />
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Spécialiste pompe à chaleur (résidentiel et tertiaire) et déstratification d&apos;air (tertiaire et industriel). Étude gratuite et accompagnement CEE selon éligibilité.
            </p>
          </div>

          <div>
            <span className="font-semibold text-[var(--secondary-400)] block mb-4">Menu</span>
            <div className="space-y-3">
              <Link to="/" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Accueil
              </Link>
              <Link to="/pompe-a-chaleur" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Pompe à chaleur
              </Link>
              <Link to="/destratification" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Déstratification
              </Link>
              <Link to="/equilibrage-hydraulique" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Équilibrage hydraulique
              </Link>
              <Link to="/blog" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Blog
              </Link>
              <Link to="/a-propos" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                À propos
              </Link>
              <Link
                to={buildLeadFormHrefForPage(location.pathname, { cta: 'footer_nav' })}
                className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>

          <div>
            <span className="font-semibold text-[var(--secondary-400)] block mb-4">Liens utiles</span>
            <div className="space-y-3">
              <Link to="/cee" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Certificats CEE
              </Link>
              <Link
                to={buildLeadFormHrefForPage(location.pathname, { cta: 'footer' })}
                onClick={() => trackCtaStudy({ effinor_source: src, effinor_cta_location: 'footer' })}
                className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors"
              >
                Demander une étude
              </Link>
              <Link to="/secteurs-activite" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Secteurs d&apos;activité
              </Link>
              <Link to="/services-accompagnement" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Accompagnement
              </Link>
              <Link to="/realisations" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Réalisations
              </Link>
              <Link to="/ressources" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Ressources
              </Link>
            </div>
          </div>

          <div>
            <span className="font-semibold text-[var(--secondary-400)] block mb-4">Contact & légal</span>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a
                  href="mailto:contact@effinor.fr"
                  onClick={() =>
                    trackEmailClick({
                      effinor_source: src,
                      effinor_cta_location: 'footer',
                      effinor_email_target: 'contact',
                    })
                  }
                  className="hover:text-[var(--secondary-400)] transition-colors"
                >
                  contact@effinor.fr
                </a>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <a
                  href="tel:+33978455063"
                  onClick={() =>
                    trackPhoneClick({ effinor_source: src, effinor_cta_location: 'footer' })
                  }
                  className="hover:text-[var(--secondary-400)] transition-colors"
                >
                  09 78 45 50 63
                </a>
              </div>
              <div className="flex items-start space-x-2 text-sm text-gray-300">
                <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Tour Europa, Av. de l&apos;Europe, 94320 Thiais</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>Lun-Ven : 8h-18h</span>
              </div>
              <Link to="/espace-client/login" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors pt-1">
                Espace client
              </Link>
              <Link to="/mentions-legales" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Mentions légales
              </Link>
              <Link to="/cgv" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                CGV
              </Link>
              <Link to="/politique-confidentialite" className="block text-sm text-gray-300 hover:text-[var(--secondary-400)] transition-colors">
                Politique de confidentialité
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center space-y-2">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} EFFINOR. Tous droits réservés.
          </p>
          <p className="text-gray-500 text-xs max-w-xl mx-auto leading-relaxed">
            Données personnelles : traitement pour répondre à votre demande et assurer le suivi commercial ;
            droits d&apos;accès et de rectification — voir notre{' '}
            <Link to="/politique-confidentialite" className="text-secondary-400/90 hover:underline">
              politique de confidentialité
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
