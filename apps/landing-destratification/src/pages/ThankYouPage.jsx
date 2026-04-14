import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { absoluteUrl } from '@/lib/site';
import { CheckCircle2, Flame, TrendingDown, Zap, Phone, Mail, Building2 } from 'lucide-react';
import CalendarCta from '@/components/common/CalendarCta';
import { CALENDAR_URL } from '@/lib/calendarTracking';

const ThankYouPage = () => {
  const canonical = absoluteUrl('/merci');
  const conversionSendTo =
    import.meta.env.VITE_GOOGLE_ADS_CONVERSION_SEND_TO ||
    'AW-17517661824/HQycCJKRlpAbEICdiaFB';

  // Récupérer les données du formulaire depuis sessionStorage
  const [formData, setFormData] = useState({
    nom: '',
    societe: '',
    surface: '',
    departement: '',
  });
  const [hasValidData, setHasValidData] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarIframeError, setCalendarIframeError] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('thankYouData');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFormData(parsed);
        setHasValidData(true);
        // Nettoyer sessionStorage après lecture
        sessionStorage.removeItem('thankYouData');
      }
    } catch (error) {
      console.error('Erreur lecture sessionStorage:', error);
    }
  }, []);

  // Extraire le prénom
  const prenom = formData.nom ? formData.nom.split(' ')[0] : '';

  // Calculer les économies estimées basées sur la surface
  const economiesEstimees = useMemo(() => {
    const surfaceRanges = {
      '800-2000 m²': { min: 1500, max: 3500, surface: 1400 },
      '2000-5000 m²': { min: 3500, max: 12000, surface: 3500 },
      '5000+ m²': { min: 10000, max: 25000, surface: 7500 },
    };

    // Chercher la correspondance
    let range = null;
    for (const [key, value] of Object.entries(surfaceRanges)) {
      if (formData.surface.includes(key) || formData.surface.toLowerCase().includes(key.toLowerCase())) {
        range = value;
        break;
      }
    }

    // Valeurs par défaut si pas de correspondance
    if (!range) {
      // Essayer d'extraire des chiffres
      const numbers = formData.surface.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        const avgSurface = numbers.reduce((a, b) => parseInt(a) + parseInt(b), 0) / numbers.length;
        if (avgSurface < 2000) range = surfaceRanges['800-2000 m²'];
        else if (avgSurface < 5000) range = surfaceRanges['2000-5000 m²'];
        else range = surfaceRanges['5000+ m²'];
      } else {
        range = { min: 2000, max: 8000, surface: 1500 };
      }
    }

    return {
      economieMin: Math.round(range.min),
      economieMax: Math.round(range.max),
      reductionPourcent: 30,
      surface: range.surface,
    };
  }, [formData]);

  // NE PAS déclencher la conversion si l'utilisateur arrive directement sur /merci
  // La conversion est déjà déclenchée dans le formulaire après succès confirmé
  // Cette page sert uniquement à afficher le message de remerciement

  const hasFormData = hasValidData && (formData.nom || formData.surface);

  return (
    <>
      <Helmet>
        <title>Merci pour votre demande | Éligibilité CEE Déstratificateur</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Nous avons bien reçu votre demande d'audit gratuit pour l'éligibilité CEE de votre déstratificateur d'air. Un conseiller vous contactera sous 24h." />
        {canonical ? <link rel="canonical" href={canonical} /> : null}
      </Helmet>

      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-emerald-50 via-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          
          {/* Header avec confetti */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full shadow-xl mb-6"
            >
              <CheckCircle2 className="w-14 h-14 text-white" />
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3"
            >
              {prenom ? (
                <>Merci <span className="text-emerald-600">{prenom}</span> ! 🎉</>
              ) : (
                <>Merci pour votre demande ! 🎉</>
              )}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-gray-600 max-w-xl mx-auto"
            >
              Votre demande d'audit énergétique a bien été enregistrée.
              {formData.societe && (
                <span className="block mt-1 font-medium text-gray-700">
                  Entreprise : {formData.societe}
                </span>
              )}
            </motion.p>
          </motion.div>

          {/* Carte résumé des économies */}
          {hasFormData && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8"
            >
              {/* Header de la carte */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 text-white">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingDown className="w-6 h-6" />
                  Vos économies potentielles
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Estimation basée sur vos informations de bâtiment
                </p>
              </div>

              {/* Contenu */}
              <div className="p-6">
                {/* Économies annuelles */}
                <div className="text-center mb-8">
                  <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Économies annuelles estimées</p>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                    className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent"
                  >
                    {economiesEstimees.economieMin.toLocaleString('fr-FR')}€ - {economiesEstimees.economieMax.toLocaleString('fr-FR')}€
                  </motion.div>
                  <p className="text-gray-500 mt-2">par an sur votre facture de chauffage</p>
                </div>

                {/* Stats en grille */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Flame className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-600">-{economiesEstimees.reductionPourcent}%</p>
                        <p className="text-xs text-gray-600">Réduction chauffage</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Zap className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">100%</p>
                        <p className="text-xs text-gray-600">Financé par les CEE</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.1 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{formData.surface || 'N/A'}</p>
                        <p className="text-xs text-gray-600">Surface chauffée</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Détails du bâtiment */}
                {(formData.surface || formData.departement) && (
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                    <p className="font-medium text-gray-700 mb-2">Récapitulatif de votre bâtiment :</p>
                    <ul className="space-y-1">
                      {formData.surface && (
                        <li>📐 Surface : <span className="font-medium text-gray-800">{formData.surface}</span></li>
                      )}
                      {formData.departement && (
                        <li>📍 Département : <span className="font-medium text-gray-800">{formData.departement}</span></li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Prochaines étapes */}
        <motion.div
            initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hasFormData ? 1.2 : 0.6, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Prochaines étapes</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                <div>
                  <p className="font-medium text-gray-900">Analyse de votre dossier</p>
                  <p className="text-sm text-gray-600">Notre équipe technique étudie votre configuration bâtiment</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">2</div>
                <div>
                  <p className="font-medium text-gray-900">Contact sous 24h</p>
                  <p className="text-sm text-gray-600">Un conseiller spécialisé vous appelle pour valider votre éligibilité CEE</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">3</div>
                <div>
                  <p className="font-medium text-gray-900">Devis gratuit personnalisé</p>
                  <p className="text-sm text-gray-600">Recevez votre devis détaillé avec le montant exact des primes CEE</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Réserver un créneau */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: hasFormData ? 1.3 : 0.7, duration: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">Réservez un créneau avec un expert</h2>
            <p className="text-sm text-gray-600 mb-5">
              Planifiez un rappel quand ça vous arrange (cela ouvre Google Calendar dans un nouvel onglet).
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <CalendarCta
                position="post_submit"
                variant="button"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
                label="Planifier un rappel"
              />
              <button
                type="button"
                onClick={() => {
                  setCalendarIframeError(false);
                  setIsCalendarModalOpen(true);
                }}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
              >
                Voir le calendrier
              </button>
            </div>
          </motion.div>

          {/* Contact rapide */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: hasFormData ? 1.4 : 0.8 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white text-center"
          >
            <p className="text-lg font-medium mb-4">Une question ? Contactez-nous directement</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="tel:+33978455063" 
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold py-3 px-6 rounded-full hover:bg-blue-50 transition"
              >
                <Phone className="w-5 h-5" />
                09 78 45 50 63
              </a>
              <a 
                href="mailto:contact@effinor.fr" 
                className="inline-flex items-center justify-center gap-2 bg-white/20 text-white font-bold py-3 px-6 rounded-full hover:bg-white/30 transition"
              >
                <Mail className="w-5 h-5" />
                contact@effinor.fr
              </a>
            </div>
          </motion.div>

          {/* Retour accueil */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: hasFormData ? 1.6 : 1.0 }}
            className="text-center mt-8"
          >
            <Link
              to="/"
              className="text-gray-600 hover:text-blue-600 transition underline underline-offset-4"
            >
              ← Retour à l'accueil
            </Link>
          </motion.div>

          {/* Modal calendrier (embed) */}
          {isCalendarModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="font-semibold text-gray-900">Calendrier de rappel</p>
                    <p className="text-xs text-gray-500">Si l’intégration ne s’affiche pas, ouvrez dans un nouvel onglet.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCalendarModalOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                </div>

                <div className="p-5">
                  {calendarIframeError ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="font-semibold text-amber-900 mb-1">Impossible d’afficher le calendrier ici.</p>
                      <p className="text-sm text-amber-800 mb-3">
                        Votre navigateur ou Google bloque parfois l’embed. Ouvrez le calendrier dans un nouvel onglet.
                      </p>
                      <CalendarCta
                        position="post_submit"
                        variant="link"
                        className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
                        label="Ouvrir le calendrier"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[16/10] rounded-xl overflow-hidden border border-gray-200">
                      <iframe
                        title="Calendrier de prise de rendez-vous"
                        src={CALENDAR_URL}
                        className="w-full h-full"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => setCalendarIframeError(true)}
                      />
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <a
                      href={CALENDAR_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Ouvrir dans un nouvel onglet
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsCalendarModalOpen(false)}
                      className="text-sm font-semibold text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default ThankYouPage;
