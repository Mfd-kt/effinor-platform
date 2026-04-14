import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Flame,
  Wind,
  Droplets,
  Building,
  Square,
  Mail,
  Loader2,
  User,
  Phone,
  Lock,
  Zap,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { handleFormSubmission, validateEmail, validateFrenchPhone } from '@/utils/formUtils';
import { saveFormData } from '@/utils/formStorage';
import {
  trackMiniFormSubmit,
  trackMiniFormView,
  trackProductCardClick,
  trackFormStepAbandoned,
  trackFormStepComplete,
} from '@/lib/effinorAnalytics';
import { EffinorButton, FormField, effinorInputClass, effinorSelectClass } from '@/components/ds';
import { miniProductFromProjectParam, parseLeadFormQuery } from '@/lib/leadFormDestination';
/* ─── Données ──────────────────────────────────────────────────── */

export const BESOIN_PRINCIPAL_OPTIONS = [
  { value: 'pac_residentiel', label: 'Pompe à chaleur — résidentiel / collectif' },
  { value: 'pac_tertiaire', label: 'Pompe à chaleur — tertiaire / ERP' },
  { value: 'destrat_tertiaire', label: 'Déstratification — tertiaire' },
  { value: 'destrat_industriel', label: 'Déstratification — industriel / entrepôt' },
  { value: 'equilibrage_hydraulique', label: 'Équilibrage hydraulique' },
  { value: 'mixte', label: 'PAC et déstratification / à qualifier' },
];

const PRODUCTS = [
  {
    id: 'pac',
    icon: Flame,
    color: 'orange',
    label: 'Pompe à chaleur',
    desc: 'Remplacez votre système et réduisez vos coûts',
    bg: 'bg-orange-50',
    border: 'border-orange-400',
    icon_bg: 'bg-orange-100 text-orange-600',
    ring: 'ring-orange-300',
  },
  {
    id: 'destrat',
    icon: Wind,
    color: 'teal',
    label: 'Déstratification',
    desc: 'Récupérez la chaleur perdue en hauteur',
    bg: 'bg-teal-50',
    border: 'border-teal-400',
    icon_bg: 'bg-teal-100 text-teal-600',
    ring: 'ring-teal-300',
  },
  {
    id: 'equil',
    icon: Droplets,
    color: 'blue',
    label: 'Équilibrage hydraulique',
    desc: 'Répartissez correctement la chaleur dans tout le bâtiment',
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    icon_bg: 'bg-blue-100 text-blue-600',
    ring: 'ring-blue-300',
  },
];

const BUILDING_TYPES = [
  'Copropriété / Résidentiel collectif',
  'Bureaux / Tertiaire',
  'Entrepôt / Logistique',
  'Industrie / Atelier',
  'Commerce / Retail',
  'Établissement public (ERP)',
  'Autre',
];

const PAC_CONTEXTS = [
  { value: 'remplacement_gaz_fioul', label: 'Remplacement chaudière gaz / fioul' },
  { value: 'remplacement_electrique', label: 'Remplacement chauffage électrique' },
  { value: 'nouveau_projet', label: 'Nouveau projet / construction' },
  { value: 'a_definir', label: 'À définir avec un expert' },
];

const DESTRAT_CONTEXTS = [
  { value: 'tertiaire', label: 'Bâtiment tertiaire (halls, retail, sport)' },
  { value: 'industriel', label: 'Entrepôt / zone industrielle' },
  { value: 'a_definir', label: 'À définir avec un expert' },
];

const EQUIL_CONTEXTS = [
  { value: 'zones_froides', label: 'Zones froides ou inégalité de chaleur' },
  { value: 'surchauffe', label: 'Logements / zones surchauffés' },
  { value: 'plaintes', label: 'Plaintes récurrentes des occupants' },
  { value: 'surconsommation', label: 'Surconsommation sans confort amélioré' },
];

function typeProjetFromProduct(product) {
  if (product === 'destrat') return "Déstratificateur d'air";
  if (product === 'equil') return 'Équilibrage hydraulique';
  return 'Pompe à chaleur';
}

function besoinFromData(product, context) {
  if (product === 'pac') {
    const isResidentiel =
      context.contexte_pac === 'remplacement_gaz_fioul' ||
      context.contexte_pac === 'remplacement_electrique';
    return isResidentiel ? 'pac_residentiel' : 'pac_tertiaire';
  }
  if (product === 'destrat') {
    return context.contexte_destrat === 'industriel' ? 'destrat_industriel' : 'destrat_tertiaire';
  }
  return 'equilibrage_hydraulique';
}

/* ─── Barre de progression ────────────────────────────────────── */
const ProgressBar = ({ step, total = 3 }) => (
  <div className="mb-5">
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Étape {step} sur {total}
      </span>
      <span className="text-xs font-bold text-[var(--secondary-600)]">
        {Math.round((step / total) * 100)}%
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <motion.div
        className="bg-[var(--secondary-500)] h-1.5 rounded-full"
        initial={false}
        animate={{ width: `${(step / total) * 100}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
    <div className="flex justify-between mt-2">
      {['Votre projet', 'Votre bâtiment', 'Vos coordonnées'].map((label, i) => (
        <span
          key={label}
          className={`text-[10px] font-medium ${
            i + 1 <= step ? 'text-[var(--secondary-600)]' : 'text-gray-400'
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  </div>
);

/* ─── Carte produit ───────────────────────────────────────────── */
const ProductCard = ({ product, selected, onSelect }) => {
  const Icon = product.icon;
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(product.id)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full min-h-[44px] text-left p-3 sm:min-h-0 rounded-xl border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2 ${
        selected
          ? `${product.bg} ${product.border} ring-2 ${product.ring} shadow-md`
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-2.5">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            selected ? product.icon_bg : 'bg-gray-100 text-gray-500'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold leading-tight ${selected ? 'text-gray-900' : 'text-gray-700'}`}>
            {product.label}
          </p>
          <p className="text-[10px] text-gray-500 leading-snug mt-0.5">{product.desc}</p>
        </div>
        {selected && (
          <CheckCircle2 className="w-4 h-4 text-[var(--secondary-500)] flex-shrink-0 mt-0.5" />
        )}
      </div>
    </motion.button>
  );
};

/* ─── Composant principal ─────────────────────────────────────── */
const MiniEstimationForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  /** Évite de re-forcer l’étape 2 si l’utilisateur revient en arrière depuis l’étape 1 avec le même `?project=` */
  const projectSkipAppliedForSearch = useRef('');

  const initialFromProject = () => {
    if (typeof window === 'undefined') return { step: 1, product: '' };
    const p = miniProductFromProjectParam(new URLSearchParams(window.location.search).get('project') || '');
    return p ? { step: 2, product: p } : { step: 1, product: '' };
  };
  const init = initialFromProject();
  const [step, setStep] = useState(init.step);
  const [selectedProduct, setSelectedProduct] = useState(init.product);
   const [formData, setFormData] = useState({
    nom: '',
    societe: '',
    worksite_postal_code: '',
    worksite_city: '',
    telephone: '',
    type_batiment: '',
    surface: '',
    email: '',
    contexte_pac: '',
    contexte_destrat: '',
    contexte_equil: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    trackMiniFormView();
    // Track abandon on unmount if form started
    return () => {
      if (step > 1 && !isSubmitting) {
        trackFormStepAbandoned({ effinor_form_step: step, effinor_product: selectedProduct });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Sauter l’étape « projet » si `?project=` correspond à PAC / déstrat / équilibrage (une fois par valeur d’URL) */
  useEffect(() => {
    if (step !== 1) return;
    const params = new URLSearchParams(location.search);
    const productId = miniProductFromProjectParam(params.get('project') || '');
    if (!productId) return;
    if (projectSkipAppliedForSearch.current === location.search) return;
    projectSkipAppliedForSearch.current = location.search;
    setSelectedProduct(productId);
    setStep(2);
    setErrors((prev) => ({ ...prev, product: null }));
  }, [location.search, step]);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleProductSelect = (productId) => {
    setSelectedProduct(productId);
    setErrors((prev) => ({ ...prev, product: null }));
    trackProductCardClick({ effinor_product: productId });
  };

  /* ── Validation par étape ── */
  const validateStep = (s) => {
    const newErrors = {};
    if (s === 1) {
      if (!selectedProduct) newErrors.product = 'Sélectionnez votre projet';
    }
    if (s === 2) {
      if (!formData.type_batiment) newErrors.type_batiment = 'Sélectionnez le type de bâtiment';
      if (!formData.surface || Number(formData.surface) < 50)
        newErrors.surface = 'Surface minimum 50 m²';
      if (selectedProduct === 'pac' && !formData.contexte_pac)
        newErrors.contexte_pac = 'Précisez votre situation';
      if (selectedProduct === 'destrat' && !formData.contexte_destrat)
        newErrors.contexte_destrat = 'Précisez le type de bâtiment';
      if (selectedProduct === 'equil' && !formData.contexte_equil)
        newErrors.contexte_equil = 'Précisez le problème rencontré';
    }
    if (s === 3) {
      if (!formData.nom.trim()) newErrors.nom = 'Nom requis';
      const cp = formData.worksite_postal_code.trim();
      if (!/^\d{5}$/.test(cp)) newErrors.worksite_postal_code = 'Code postal à 5 chiffres requis';
      if (!validateFrenchPhone(formData.telephone)) newErrors.telephone = 'Format invalide (ex : 06 12 34 56 78)';
      if (!validateEmail(formData.email)) newErrors.email = 'Email invalide';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    trackFormStepComplete(step, `mini_form_step_${step}`, { effinor_product: selectedProduct });
    setStep((s) => s + 1);
  };

  const goBack = () => setStep((s) => s - 1);

  /* ── Soumission ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) {
      toast({ title: 'Veuillez corriger les champs en rouge.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    const besoin_principal = besoinFromData(selectedProduct, formData);
    const besoinLabel =
      BESOIN_PRINCIPAL_OPTIONS.find((o) => o.value === besoin_principal)?.label || '';
    const type_projet = typeProjetFromProduct(selectedProduct);

    let heating_type = '';
    if (selectedProduct === 'pac') {
      heating_type =
        PAC_CONTEXTS.find((c) => c.value === formData.contexte_pac)?.label || formData.contexte_pac || '';
    } else if (selectedProduct === 'destrat') {
      heating_type =
        DESTRAT_CONTEXTS.find((c) => c.value === formData.contexte_destrat)?.label ||
        formData.contexte_destrat ||
        '';
    } else {
      heating_type =
        EQUIL_CONTEXTS.find((c) => c.value === formData.contexte_equil)?.label ||
        formData.contexte_equil ||
        '';
    }

    const attribution = parseLeadFormQuery(location.search);

    const submissionData = {
      nom: formData.nom,
      societe: formData.societe,
      worksite_postal_code: formData.worksite_postal_code.trim(),
      worksite_city: formData.worksite_city,
      telephone: formData.telephone,
      type_batiment: formData.type_batiment,
      surface_m2: Number(formData.surface),
      email: formData.email,
      heating_type,
      type_projet,
      source: 'hero_formulaire_accueil',
      statut: 'nouveau',
      priorite: 'normale',
      type: 'estimation',
      etape_formulaire: 'mini_form_completed',
      formulaire_complet: false,
      attribution,
      formulaire_data: {
        besoin_principal,
        besoin_principal_label: besoinLabel,
        contexte_pac: formData.contexte_pac || null,
        contexte_destrat: formData.contexte_destrat || null,
        contexte_equil: formData.contexte_equil || null,
        effinor_product: selectedProduct,
        mini_form: true,
      },
    };

    const result = await handleFormSubmission(submissionData);

    if (result.success) {
      toast({
        title: 'Demande envoyée !',
        description: 'Nous revenons vers vous sous 24h avec une première analyse.',
        className: 'bg-green-100 border-green-400 text-green-800',
        duration: 4000,
      });

      localStorage.setItem('current_lead_id', result.data.id);
      saveFormData({
        lead_id: result.data.id,
        nom: formData.nom,
        societe: formData.societe,
        worksite_postal_code: formData.worksite_postal_code,
        worksite_city: formData.worksite_city,
        telephone: formData.telephone,
        type_batiment: formData.type_batiment,
        surface_m2: formData.surface,
        email: formData.email,
        besoin_principal,
        besoin_principal_label: besoinLabel,
        type_projet,
      });

      trackMiniFormSubmit({
        effinor_type_projet: selectedProduct,
        effinor_besoin_principal: besoin_principal,
      });

      navigate('/merci', { state: { nom: formData.nom, source: 'mini_form' } });
    } else {
      toast({
        title: 'Erreur lors de l\'envoi.',
        description: 'Veuillez réessayer ou nous appeler directement.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
  };

  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="card hero-form-card w-full max-w-lg mx-auto"
      id="mini-form"
    >
      {/* En-tête */}
      <div className="card-header">
        <div className="icon">
          <Zap className="w-8 h-8 md:w-10 md:h-10" />
        </div>
        <h3 className="text-lg md:text-xl text-primary-900">Analysez votre bâtiment gratuitement</h3>
        <p className="text-xs md:text-sm text-gray-600">
          30 secondes pour décrire votre situation — nous revenons avec une analyse concrète et les
          options de financement CEE selon votre éligibilité.
        </p>
      </div>

      <ProgressBar step={step} />

      <form onSubmit={handleSubmit} noValidate>
        <AnimatePresence mode="wait">

          {/* ── ÉTAPE 1 : Choix du produit ──────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22 }}
            >
              <p className="text-sm font-semibold text-gray-800 mb-3">
                Quel est votre projet ? <span className="text-red-500">*</span>
              </p>
              <div className="space-y-2">
                {PRODUCTS.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    selected={selectedProduct === p.id}
                    onSelect={handleProductSelect}
                  />
                ))}
              </div>
              {errors.product && (
                <p className="text-red-500 text-xs mt-2">{errors.product}</p>
              )}
              <EffinorButton
                type="button"
                variant="primary"
                fullWidth
                className="mt-5"
                onClick={goNext}
              >
                Continuer
                <ChevronRight className="h-4 w-4" />
              </EffinorButton>
            </motion.div>
          )}

          {/* ── ÉTAPE 2 : Bâtiment + contexte produit ───────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22 }}
              className="space-y-4"
            >
              {/* Type de bâtiment */}
              <FormField
                id="type_batiment"
                required
                label={
                  <>
                    <Building className="h-4 w-4 shrink-0" />
                    Type de bâtiment
                  </>
                }
                error={errors.type_batiment}
                labelClassName="font-semibold text-gray-700"
              >
                <select
                  id="type_batiment"
                  value={formData.type_batiment}
                  onChange={(e) => handleChange('type_batiment', e.target.value)}
                  className={effinorSelectClass(!!errors.type_batiment)}
                >
                  <option value="" disabled>Sélectionner...</option>
                  {BUILDING_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </FormField>

              {/* Surface */}
              <FormField
                id="surface"
                required
                label={
                  <>
                    <Square className="h-4 w-4 shrink-0" />
                    Surface (m²)
                  </>
                }
                error={errors.surface}
                labelClassName="font-semibold text-gray-700"
              >
                <input
                  id="surface"
                  type="number"
                  min="50"
                  value={formData.surface}
                  onChange={(e) => handleChange('surface', e.target.value)}
                  placeholder="Ex : 800"
                  className={effinorInputClass(!!errors.surface)}
                />
              </FormField>

              {/* Smart question : PAC */}
              {selectedProduct === 'pac' && (
                <FormField
                  id="contexte_pac"
                  required
                  label={
                    <>
                      <Flame className="h-4 w-4 shrink-0" />
                      Votre situation actuelle
                    </>
                  }
                  error={errors.contexte_pac}
                  labelClassName="font-semibold text-gray-700"
                >
                  <select
                    id="contexte_pac"
                    value={formData.contexte_pac}
                    onChange={(e) => handleChange('contexte_pac', e.target.value)}
                    className={effinorSelectClass(!!errors.contexte_pac)}
                  >
                    <option value="" disabled>Sélectionner...</option>
                    {PAC_CONTEXTS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </FormField>
              )}

              {/* Smart question : Déstrat */}
              {selectedProduct === 'destrat' && (
                <FormField
                  id="contexte_destrat"
                  required
                  label={
                    <>
                      <Wind className="h-4 w-4 shrink-0" />
                      Type d&apos;environnement
                    </>
                  }
                  error={errors.contexte_destrat}
                  labelClassName="font-semibold text-gray-700"
                >
                  <select
                    id="contexte_destrat"
                    value={formData.contexte_destrat}
                    onChange={(e) => handleChange('contexte_destrat', e.target.value)}
                    className={effinorSelectClass(!!errors.contexte_destrat)}
                  >
                    <option value="" disabled>Sélectionner...</option>
                    {DESTRAT_CONTEXTS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </FormField>
              )}

              {/* Smart question : Équilibrage */}
              {selectedProduct === 'equil' && (
                <FormField
                  id="contexte_equil"
                  required
                  label={
                    <>
                      <Droplets className="h-4 w-4 shrink-0" />
                      Problème principal
                    </>
                  }
                  error={errors.contexte_equil}
                  labelClassName="font-semibold text-gray-700"
                >
                  <select
                    id="contexte_equil"
                    value={formData.contexte_equil}
                    onChange={(e) => handleChange('contexte_equil', e.target.value)}
                    className={effinorSelectClass(!!errors.contexte_equil)}
                  >
                    <option value="" disabled>Sélectionner...</option>
                    {EQUIL_CONTEXTS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </FormField>
              )}

              <div className="flex gap-3 pt-1">
                <EffinorButton type="button" variant="secondary" size="sm" className="flex-none px-4" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4" />
                </EffinorButton>
                <EffinorButton type="button" variant="primary" className="flex-1" onClick={goNext}>
                  Continuer
                  <ChevronRight className="h-4 w-4" />
                </EffinorButton>
              </div>
            </motion.div>
          )}

          {/* ── ÉTAPE 3 : Coordonnées ────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22 }}
              className="space-y-3"
            >
              <FormField
                id="nom"
                required
                label={
                  <>
                    <User className="h-4 w-4 shrink-0" />
                    Nom complet
                  </>
                }
                error={errors.nom}
                labelClassName="font-semibold text-gray-700"
              >
                <input
                  id="nom"
                  type="text"
                  autoFocus
                  value={formData.nom}
                  onChange={(e) => handleChange('nom', e.target.value)}
                  placeholder="Jean Dupont"
                  className={effinorInputClass(!!errors.nom)}
                />
              </FormField>

              <FormField
                id="societe"
                label={
                  <>
                    <Building className="h-4 w-4 shrink-0" />
                    Société <span className="font-normal text-gray-500">(optionnel)</span>
                  </>
                }
                error={errors.societe}
                labelClassName="font-semibold text-gray-700"
              >
                <input
                  id="societe"
                  type="text"
                  value={formData.societe}
                  onChange={(e) => handleChange('societe', e.target.value)}
                  placeholder="Raison sociale"
                  className={effinorInputClass(!!errors.societe)}
                />
              </FormField>

              <FormField
                id="worksite_postal_code"
                required
                label={
                  <>
                    <MapPin className="h-4 w-4 shrink-0" />
                    Code postal du site
                  </>
                }
                error={errors.worksite_postal_code}
                labelClassName="font-semibold text-gray-700"
              >
                <input
                  id="worksite_postal_code"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={formData.worksite_postal_code}
                  onChange={(e) => handleChange('worksite_postal_code', e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="75001"
                  className={effinorInputClass(!!errors.worksite_postal_code)}
                />
              </FormField>

              <FormField
                id="worksite_city"
                label={
                  <>
                    <MapPin className="h-4 w-4 shrink-0" />
                    Ville du site <span className="font-normal text-gray-500">(optionnel)</span>
                  </>
                }
                error={errors.worksite_city}
                labelClassName="font-semibold text-gray-700"
              >
                <input
                  id="worksite_city"
                  type="text"
                  value={formData.worksite_city}
                  onChange={(e) => handleChange('worksite_city', e.target.value)}
                  placeholder="Paris"
                  className={effinorInputClass(!!errors.worksite_city)}
                />
              </FormField>

              <FormField
                id="telephone"
                required
                label={
                  <>
                    <Phone className="h-4 w-4 shrink-0" />
                    Téléphone
                  </>
                }
                error={errors.telephone}
                labelClassName="font-semibold text-gray-700"
              >
                <input
                  id="telephone"
                  ref={phoneRef}
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => handleChange('telephone', e.target.value)}
                  placeholder="06 12 34 56 78"
                  className={effinorInputClass(!!errors.telephone)}
                />
              </FormField>

              <FormField
                id="email"
                required
                label={
                  <>
                    <Mail className="h-4 w-4 shrink-0" />
                    Email professionnel
                  </>
                }
                error={errors.email}
                labelClassName="font-semibold text-gray-700"
              >
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="vous@entreprise.fr"
                  className={effinorInputClass(!!errors.email)}
                />
              </FormField>

              <div className="flex gap-3 pt-1">
                <EffinorButton type="button" variant="secondary" size="sm" className="flex-none px-4" onClick={goBack}>
                  <ArrowLeft className="h-4 w-4" />
                </EffinorButton>
                <EffinorButton
                  id="submit-button"
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Obtenir mon analyse gratuite
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </EffinorButton>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </form>

      {/* Micro-réassurances */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] md:text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-[var(--secondary-500)]" /> Réponse sous 24h
        </span>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-[var(--secondary-500)]" /> Étude technique réelle
        </span>
        <span className="flex items-center gap-1">
          <Lock className="h-3 w-3 text-[var(--secondary-500)]" /> Sans engagement
        </span>
      </div>
    </motion.div>
  );
};

export default MiniEstimationForm;
