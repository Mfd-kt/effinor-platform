import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Home, Mail, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ThankYou = () => {
  const { state } = useLocation();
  const nom      = state?.nom      || '';
  const source   = state?.source   || 'formulaire'; // 'mini_form' | 'contact'

  return (
    <>
      <Helmet>
        <title>Merci pour votre demande | Effinor</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4">
        <div className="max-w-2xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center"
          >
            {/* Icône */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex items-center justify-center bg-green-100 rounded-full p-5 mb-6"
            >
              <CheckCircle className="h-14 w-14 text-green-600" />
            </motion.div>

            {/* Titre */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Merci{nom ? `, ${nom}` : ''}&nbsp;!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {source === 'contact'
                ? 'Votre message a bien été reçu. Un expert vous répondra sous 24 h ouvrées.'
                : 'Votre demande a bien été enregistrée. Un expert analyse votre projet et vous contacte sous 24 h ouvrées.'}
            </p>

            {/* Prochaines étapes */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
              <h2 className="font-semibold text-blue-900 mb-4">Prochaines étapes</h2>
              <ul className="space-y-3 text-blue-800 text-sm">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Notre équipe analyse votre demande et vous prépare une réponse personnalisée</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Un expert vous recontacte par téléphone ou email sous 24 h ouvrées</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 text-green-500 flex-shrink-0" />
                  <span>Nous vous accompagnons de l'étude à la mise en œuvre, sans engagement</span>
                </li>
              </ul>
            </div>

            {/* Contact rapide */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-gray-600 text-sm mb-8">
              <a href="mailto:contact@effinor.fr" className="flex items-center gap-2 hover:text-blue-700 transition-colors">
                <Mail className="h-4 w-4" /> contact@effinor.fr
              </a>
              <a href="tel:+33978455063" className="flex items-center gap-2 hover:text-blue-700 transition-colors">
                <Phone className="h-4 w-4" /> 09 78 45 50 63
              </a>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Lun–Ven 8h–18h
              </span>
            </div>

            {/* CTA */}
            <Link to="/">
              <Button size="lg" variant="outline" className="gap-2">
                <Home className="h-5 w-5" />
                Retour à l'accueil
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ThankYou;
