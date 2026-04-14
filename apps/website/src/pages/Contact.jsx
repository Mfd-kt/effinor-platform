import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { IMAGES } from '@/config/images';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Loader2,
  User,
  Building,
  MessageSquare,
  Send,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { logger } from '@/utils/logger';
import { useToast } from '@/components/ui/use-toast';
import { trackEmailClick, trackPhoneClick } from '@/lib/effinorAnalytics';
import { sanitizeFormData } from '@/utils/sanitize';
import {
  isMiniFormSupabaseInsertEnabled,
  insertContactPageLeadFromSanitized,
} from '@/lib/miniFormLeadSupabase';
import {
  PageContainer,
  EffinorButton,
  FormField,
  effinorInputClass,
  effinorTextareaClass,
} from '@/components/ds';
import { ServiceProcessSteps } from '@/components/ds/ServiceProcessSteps';
import { CeeDisclaimer } from '@/components/ds/CeeDisclaimer';
import { cn } from '@/lib/utils';
import { parseLeadFormQuery, resolveSujetFromQuery } from '@/lib/leadFormDestination';

export default function Contact() {
  const { toast } = useToast();
  const location = useLocation();
  const attributionRef = useRef(parseLeadFormQuery(location.search));

  const [formData, setFormData] = useState(() => {
    const q =
      typeof window !== 'undefined' ? parseLeadFormQuery(window.location.search) : parseLeadFormQuery('');
    const sujet = resolveSujetFromQuery({ project: q.project, cta: q.cta }) || '';
    return {
      nom: '',
      societe: '',
      email: '',
      telephone: '',
      sujet,
      message: '',
    };
  });

  useEffect(() => {
    const q = parseLeadFormQuery(location.search);
    attributionRef.current = q;
    const sujetResolved = resolveSujetFromQuery({ project: q.project, cta: q.cta });
    if (sujetResolved) {
      setFormData((prev) => ({ ...prev, sujet: sujetResolved }));
    }
  }, [location.search]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [location.pathname, location.search]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.nom.trim()) e.nom = 'Le nom est requis';
    if (!formData.email.trim()) {
      e.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = "Format d'email invalide";
    }
    if (!formData.sujet) e.sujet = 'Le sujet est requis';
    if (!formData.message.trim()) e.message = 'Le message est requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, sujet: value }));
    if (errors.sujet) setErrors((prev) => ({ ...prev, sujet: null }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) {
      toast({
        title: 'Veuillez corriger les erreurs',
        description: 'Certains champs requis sont manquants ou invalides.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const attr = attributionRef.current || {};

      if (!isMiniFormSupabaseInsertEnabled()) {
        toast({
          title: 'Configuration manquante',
          description:
            'Supabase n’est pas configuré (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY dans .env).',
          variant: 'destructive',
        });
        return;
      }

      const payload = sanitizeFormData({
        nom: formData.nom,
        societe: formData.societe,
        email: formData.email,
        telephone: formData.telephone,
        sujet: formData.sujet,
        message: formData.message,
        attribution: {
          source: attr.source || '',
          project: attr.project || '',
          cta: attr.cta || '',
          page: attr.page || '',
          slug: attr.slug || '',
          category: attr.category || '',
        },
      });

      const result = await insertContactPageLeadFromSanitized(payload);
      if (!result.success || !result.id) {
        throw new Error(result.error || 'Insertion refusée');
      }

      navigate('/merci', {
        state: { nom: formData.nom, source: attr.source || 'contact', project: attr.project || '' },
      });
    } catch (error) {
      logger.error('Error submitting contact form:', error);
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de l'envoi. Veuillez réessayer.",
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contact & étude gratuite | Évaluer votre bâtiment — Effinor</title>
        <meta
          name="description"
          content="Échangez avec Effinor sur votre bâtiment : PAC, déstratification, équilibrage hydraulique, CEE. Sans engagement, réponse rapide, lecture technique par un expert."
        />
      </Helmet>

      {/* ── HERO ── */}
      <div
        className="w-full relative bg-dark-section py-8 md:py-12 pt-24 overflow-hidden"
        style={{ backgroundImage: `url(${IMAGES.hero.contact})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/78 via-primary-900/68 to-slate-900/72" />
        <PageContainer maxWidth="none" className="max-w-5xl relative z-10">
          <h1 className="heading-page mb-3">
            Évaluons votre bâtiment ensemble
          </h1>
          <p className="text-body text-base md:text-lg max-w-2xl mb-4">
            Si votre sujet touche au chauffage, au confort d’air, au réseau hydraulique ou au financement CEE, décrivez
            votre contexte : nous revenons vers vous avec une lecture honnête — faisabilité, risques, prochaines étapes.
          </p>
          <p className="mb-5 max-w-2xl text-sm italic text-white/75">
            Ok, ça me concerne : bâtiment professionnel, arbitrage à préparer, et besoin d’un avis qui tient la route en
            comité.
          </p>
          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--secondary-400)]" />
              Sans obligation : vous décidez après lecture de notre retour
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--secondary-400)]" />
              Réponse rapide (souvent sous 24 h ouvrées)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[var(--secondary-400)]" />
              Relu par un interlocuteur technique — pas un bot
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="tel:+33978455063"
              onClick={() => trackPhoneClick({ effinor_source: 'contact', effinor_cta_location: 'contact_hero' })}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-secondary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900"
            >
              <Phone className="h-4 w-4" />
              09 78 45 50 63 — appel direct
            </a>
            <p className="text-xs text-white/70 sm:max-w-xs">
              Coût énergie en hausse, fenêtres projet qui se referment : un échange tôt évite de rater des leviers (
              <Link to="/cee" className="font-medium text-white underline hover:text-[var(--secondary-300)]">
                CEE
              </Link>
              , dimensionnement, ordre des travaux).
            </p>
          </div>
        </PageContainer>
      </div>

      {/* ── CONTENU ── */}
      <PageContainer maxWidth="none" className="max-w-5xl py-6 md:py-10">
        <div className="mb-8 grid gap-6 md:grid-cols-2 md:mb-10">
          <section
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
            aria-labelledby="contact-qui-heading"
          >
            <h2 id="contact-qui-heading" className="heading-section mb-3 text-gray-900">
              Qui nous contacte le plus souvent
            </h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Bailleurs, syndics, directions immobilier / facility</li>
              <li>• Industriel, logistique, entrepôts — confort, image, charges</li>
              <li>• Tertiaire & retail — multi-sites, délais, coordination occupant</li>
              <li>• Responsables énergie / QHSE — besoin de cohérence technique et dossier</li>
            </ul>
          </section>
          <section
            className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 md:p-6"
            aria-labelledby="contact-urgence-heading"
          >
            <h2 id="contact-urgence-heading" className="text-lg font-bold text-amber-950">
              Pourquoi ne pas attendre
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-950/90">
              Les arbitrages énergie se durcissent ; un mauvais ordre de travaux ou un dossier CEE fragile coûte plus cher
              une fois le chantier engagé. Un premier cadrage limite les « surprises » en comité.
            </p>
          </section>
        </div>
        <div className="mb-8 md:mb-10 space-y-4">
          <ServiceProcessSteps
            title="Ce qui se passe ensuite"
            subtitle="Appel ou échange ciblé, analyse de cohérence, proposition ou suite de dossier — sans engagement sur la base d’informations sincères."
          />
          <CeeDisclaimer variant="boxed" className="max-w-4xl mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

          {/* ── COLONNE GAUCHE : COORDONNÉES ── */}
          <div className="md:col-span-2 space-y-4">

            {/* Email */}
            <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="bg-secondary-500 text-white p-2 rounded-lg flex-shrink-0">
                  <Mail className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5 text-sm md:text-base">Écrivez-nous</h3>
                  <p className="text-gray-500 text-xs mb-2">Pour une demande détaillée ou l'envoi de documents.</p>
                  <a
                    href="mailto:contact@effinor.fr"
                    onClick={() =>
                      trackEmailClick({
                        effinor_source: 'contact',
                        effinor_cta_location: 'contact_card',
                        effinor_email_target: 'contact',
                      })
                    }
                    className="block text-secondary-600 hover:text-secondary-700 font-semibold text-sm"
                  >
                    contact@effinor.fr
                  </a>
                  <a
                    href="mailto:devis@effinor.fr"
                    onClick={() =>
                      trackEmailClick({
                        effinor_source: 'contact',
                        effinor_cta_location: 'contact_card',
                        effinor_email_target: 'devis',
                      })
                    }
                    className="block text-secondary-600 hover:text-secondary-700 font-semibold text-sm"
                  >
                    devis@effinor.fr
                  </a>
                </div>
              </div>
            </div>

            {/* Téléphone */}
            <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="bg-secondary-500 text-white p-2 rounded-lg flex-shrink-0">
                  <Phone className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5 text-sm md:text-base">Parler à un conseiller</h3>
                  <p className="text-gray-500 text-xs mb-2">Échange direct pour qualifier votre besoin rapidement.</p>
                  <a
                    href="tel:+33978455063"
                    onClick={() =>
                      trackPhoneClick({ effinor_source: 'contact', effinor_cta_location: 'contact_card' })
                    }
                    className="block text-secondary-600 hover:text-secondary-700 font-semibold text-sm"
                  >
                    09 78 45 50 63
                  </a>
                  <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> Lun–Ven : 8h–18h
                  </p>
                  <p className="text-gray-500 text-xs mt-2 italic">Appel conseillé si votre projet est urgent.</p>
                </div>
              </div>
            </div>

            {/* Zone d'intervention */}
            <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="bg-secondary-500 text-white p-2 rounded-lg flex-shrink-0">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-0.5 text-sm md:text-base">Zone d&apos;intervention</h3>
                  <p className="text-gray-500 text-xs mb-1">Interventions partout en France selon les projets.</p>
                  <p className="text-gray-600 text-sm font-medium">France</p>
                </div>
              </div>
            </div>

            {/* Réassurance */}
            <div className="bg-secondary-50 border-l-4 border-secondary-500 rounded-xl p-4">
              <p className="font-bold text-secondary-900 mb-1 text-sm">Une réponse claire, rapidement</p>
              <p className="text-secondary-800 text-xs leading-relaxed">
                Chaque demande est analysée par un interlocuteur technique. Vous recevez un retour structuré,
                pas une réponse automatique.
              </p>
            </div>

          </div>

          {/* ── COLONNE DROITE : FORMULAIRE ── */}
          <div className="md:col-span-3" id="lead-form">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-8">
              {/* En-tête formulaire */}
              <div className="mb-5">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-secondary-500/10 rounded-full mb-3">
                  <MessageSquare className="w-5 h-5 text-secondary-500" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Décrivez votre projet</h2>
                <p className="text-gray-500 text-sm">Plus vous êtes précis, plus notre réponse sera pertinente.</p>
              </div>

              {/* Succès */}
              {submitted && (
                <div className="bg-secondary-50 border-2 border-secondary-200 text-secondary-800 p-4 rounded-lg mb-5 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-secondary-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Demande envoyée !</p>
                    <p className="text-xs">Notre équipe vous recontacte avec une analyse adaptée.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Nom + Société */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="nom"
                    required
                    label={
                      <>
                        <User className="h-4 w-4 shrink-0 text-secondary-500" />
                        Nom complet
                      </>
                    }
                    error={errors.nom}
                  >
                    <input
                      id="nom"
                      name="nom"
                      type="text"
                      placeholder="Jean Dupont"
                      value={formData.nom}
                      onChange={handleInputChange}
                      required
                      className={effinorInputClass(!!errors.nom)}
                    />
                  </FormField>
                  <FormField
                    id="societe"
                    label={
                      <>
                        <Building className="h-4 w-4 shrink-0 text-secondary-500" />
                        Société
                      </>
                    }
                  >
                    <input
                      id="societe"
                      name="societe"
                      type="text"
                      placeholder="Nom de votre société"
                      value={formData.societe}
                      onChange={handleInputChange}
                      className={effinorInputClass(false)}
                    />
                  </FormField>
                </div>

                {/* Email + Téléphone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="email"
                    required
                    label={
                      <>
                        <Mail className="h-4 w-4 shrink-0 text-secondary-500" />
                        Email
                      </>
                    }
                    error={errors.email}
                  >
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="jean.dupont@exemple.fr"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={effinorInputClass(!!errors.email)}
                    />
                  </FormField>
                  <FormField
                    id="telephone"
                    label={
                      <>
                        <Phone className="h-4 w-4 shrink-0 text-secondary-500" />
                        Téléphone
                      </>
                    }
                  >
                    <input
                      id="telephone"
                      name="telephone"
                      type="tel"
                      placeholder="06 XX XX XX XX"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      className={effinorInputClass(false)}
                    />
                  </FormField>
                </div>

                {/* Sujet */}
                <FormField
                  id="sujet"
                  required
                  label={
                    <>
                      <MessageSquare className="h-4 w-4 shrink-0 text-secondary-500" />
                      Sujet
                    </>
                  }
                  error={errors.sujet}
                >
                  <Select value={formData.sujet} onValueChange={handleSelectChange} required>
                    <SelectTrigger
                      className={cn(
                        effinorInputClass(!!errors.sujet),
                        'h-auto min-h-[44px] items-center justify-between text-left sm:min-h-[40px]',
                        'focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2',
                      )}
                    >
                      <SelectValue placeholder="Sélectionnez un sujet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="etude_pac">Étude pompe à chaleur</SelectItem>
                      <SelectItem value="etude_destrat">Étude déstratification</SelectItem>
                      <SelectItem value="etude_equilibrage">Étude équilibrage hydraulique</SelectItem>
                      <SelectItem value="etude_accompagnement">Accompagnement projet / multi-leviers</SelectItem>
                      <SelectItem value="cee">Optimisation / financement CEE</SelectItem>
                      <SelectItem value="devis">Demande de devis</SelectItem>
                      <SelectItem value="rappel">Être rappelé</SelectItem>
                      <SelectItem value="partenariat">Partenariat</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                {/* Message */}
                <FormField
                  id="message"
                  required
                  label={
                    <>
                      <MessageSquare className="h-4 w-4 shrink-0 text-secondary-500" />
                      Votre situation
                    </>
                  }
                  error={errors.message}
                >
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Exemple : entrepôt de 2 000 m² chauffé au gaz, problème de chaleur au plafond et facture élevée"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className={effinorTextareaClass(!!errors.message)}
                  />
                </FormField>

                {/* Bouton principal */}
                <EffinorButton type="submit" variant="primary" fullWidth size="lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Recevoir mon analyse
                    </>
                  )}
                </EffinorButton>

                <ul className="mt-4 grid gap-2 sm:grid-cols-2 text-left text-xs text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--secondary-500)]" aria-hidden />
                    <span>Étude technique réelle — pas une réponse automatique</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--secondary-500)]" aria-hidden />
                    <span>Réponse rapide (souvent sous 24 h ouvrées)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--secondary-500)]" aria-hidden />
                    <span>Sans engagement : vous décidez après notre retour</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--secondary-500)]" aria-hidden />
                    <span>
                      Données utilisées uniquement pour traiter votre demande — voir la{' '}
                      <Link to="/politique-confidentialite" className="font-medium text-secondary-600 hover:underline">
                        confidentialité
                      </Link>
                    </span>
                  </li>
                </ul>

                {/* Microcopy sous bouton */}
                <p className="text-xs text-gray-500 text-center mt-3">Aucune démarche engagée sans votre accord</p>

                {/* Confidentialité */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center leading-relaxed flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-center gap-1 sm:gap-x-1">
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3 shrink-0" aria-hidden />
                      Finalité : réponse à votre demande et suivi commercial.
                    </span>
                    <span className="hidden sm:inline text-gray-300">·</span>
                    <span>
                      Base légale : intérêt légitime et/ou consentement — voir notre{' '}
                      <Link to="/politique-confidentialite" className="text-secondary-600 hover:underline font-medium">
                        politique de confidentialité
                      </Link>
                      .
                    </span>
                  </p>
                </div>

              </form>

              {/* CTA alternatif */}

            </div>
          </div>

        </div>
      </PageContainer>

      {/* ── STICKY MOBILE : bouton appel ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg px-4 py-3 flex gap-2 sm:gap-3">
        <a
          href="tel:+33978455063"
          onClick={() => trackPhoneClick({ effinor_source: 'contact', effinor_cta_location: 'sticky_mobile' })}
          className="flex-1 flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-secondary-500 text-white text-sm font-semibold hover:bg-secondary-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2"
        >
          <Phone className="w-4 h-4" />
          Appeler
        </a>
        <a
          href="#lead-form"
          className="flex-1 flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-secondary-500 text-secondary-600 text-sm font-semibold hover:bg-secondary-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2"
        >
          <ArrowRight className="w-4 h-4" />
          Étude gratuite
        </a>
      </div>

      {/* Espace bas page pour ne pas masquer le contenu avec la barre sticky */}
      <div className="md:hidden h-20" />
    </>
  );
}
