import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { departements } from '@/lib/departements';
import { toast } from '@/components/ui/use-toast';
import Section from '@/components/layout/Section';

const DRAFT_STORAGE_KEY = 'destrat_simulator_draft';
const THANKYOU_DATA_KEY = 'thankYouData';

// Téléphone FR (10 chiffres après normalisation : 0 + 9 chiffres)
function normalizePhone(value) {
  const digits = (value || '').replace(/\s/g, '').replace(/^\+33/, '0');
  return digits;
}
function isValidFRPhone(value) {
  const n = normalizePhone(value);
  return /^0[1-9]\d{8}$/.test(n);
}

function emitTracking(eventName, params = {}) {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params);
    }
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({ event: eventName, ...params });
    }
  } catch (_) {}
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Besoin de chauffage (style Airchaud) : P = V × B × ΔT × 0.34 / 1000 (kW)
const DELTA_T_DEFAULT = 25; // °C (ex. 15°C int / -10°C ext)
const HEURES_CHAUFFAGE_AN = 2200; // h/an typique bâtiment industriel
const HEAT_CAPACITY = 0.34; // Wh/(m³·K)
const EMISSION_FACTOR_KG_PER_KWH = 0.2; // kgCO2 / kWh (ordre de grandeur mix élec/chaleur)

const HEATING_MODES = [
  { id: 'bois', label: 'Bois (Granulés vrac)', priceKwh: 0.075 },
  { id: 'gaz', label: 'Gaz Naturel', priceKwh: 0.105 },
  { id: 'fioul', label: 'Fioul Domestique', priceKwh: 0.115 },
  { id: 'elec', label: 'Électricité (Directe)', priceKwh: 0.2016 },
  { id: 'pac', label: 'Pompe à chaleur', priceKwh: 0.06 },
];

const EnergySimulator = () => {
  const navigate = useNavigate();
  const [height, setHeight] = useState(7); // en mètres
  const [surface, setSurface] = useState(2000); // en m²
  const [clientType, setClientType] = useState('Site industriel / logistique');
  const [model, setModel] = useState('generfeu'); // 'teddington_ds3' | 'teddington_ds7' | 'generfeu'
  const [modeChauffage, setModeChauffage] = useState('gaz'); // id du mode (bois, gaz, fioul, elec, pac) — défaut Gaz pour ne pas bloquer le flow
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leadData, setLeadData] = useState({
    nom: '',
    societe: '',
    telephone: '',
    email: '',
    departement: '',
    fonction: '',
  });
  const [draftRestored, setDraftRestored] = useState(false);

  const FONCTIONS = [
    { value: 'DG', label: 'DG' },
    { value: 'Responsable maintenance', label: 'Responsable maintenance' },
    { value: 'Responsable énergie', label: 'Responsable énergie' },
    { value: 'Autre', label: 'Autre' },
  ];

  const leadFormRef = useRef(null);
  const phoneInputRef = useRef(null);
  const hasTrackedInteraction = useRef(false);
  const hasTrackedStep2Open = useRef(false);

  const trackSimulatorInteraction = () => {
    if (hasTrackedInteraction.current) return;
    hasTrackedInteraction.current = true;
    emitTracking('simulator_interaction');
  };

  const safeHeight = clamp(height, 5, 15);
  // TEDDINGTON DS7 : à partir de 6 m | GENERFEU : à partir de 7 m | TEDDINGTON DS3 : à partir de 5 m
  const teddingtonDs7Disabled = safeHeight < 6;
  const generfeuDisabled = safeHeight < 7;
  const safeSurface = clamp(surface, 800, 10000);
  const volume = safeHeight * safeSurface; // m3

  // Taux de renouvellement d'air en fonction du type d'organisation
  const airChangeRate =
    clientType === 'Site industriel / logistique'
      ? 3
      : clientType === 'Collectivité'
      ? 2.5
      : 2; // Tertiaire par défaut
  const destratCapacity =
    model === 'teddington_ds3' ? 2330 : model === 'teddington_ds7' ? 6500 : 10000; // m3/h par appareil

  const neededDestrat = Math.max(1, Math.ceil((volume * airChangeRate) / destratCapacity));

  // Besoin de chauffage (kW) : P = V × B × ΔT × 0.34 / 1000
  const powerKw = (volume * airChangeRate * DELTA_T_DEFAULT * HEAT_CAPACITY) / 1000;
  const consumptionKwhAn = powerKw * HEURES_CHAUFFAGE_AN;
  const priceMin = 0.06;
  const priceMax = 0.2016;
  const costEuroMin = consumptionKwhAn * priceMin;
  const costEuroMax = consumptionKwhAn * priceMax;
  const saving30Kwh = consumptionKwhAn * 0.3;
  const saving30EuroMin = costEuroMin * 0.3;
  const saving30EuroMax = costEuroMax * 0.3;
  const selectedMode = HEATING_MODES.find((m) => m.id === modeChauffage);
  const costEuroSelected = selectedMode ? consumptionKwhAn * selectedMode.priceKwh : null;
  const saving30EuroSelected = costEuroSelected != null ? costEuroSelected * 0.3 : null;
  const co2SavedTons = (saving30Kwh * EMISSION_FACTOR_KG_PER_KWH) / 1000;

  const formatNumber = (n) =>
    n.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
  const formatDecimal = (n) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const handleLeadChange = (e) => {
    const { name, value } = e.target;
    setLeadData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();

    if (!leadData.telephone || !leadData.departement) {
      toast({
        variant: 'destructive',
        title: 'Informations manquantes',
        description: 'Merci de renseigner au minimum Téléphone et Département.',
      });
      return;
    }
    if (!isValidFRPhone(leadData.telephone)) {
      toast({
        variant: 'destructive',
        title: 'Téléphone invalide',
        description: 'Merci de saisir un numéro français valide (10 chiffres, ex. 06 12 34 56 78).',
      });
      return;
    }

    if (leadData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(leadData.email)) {
        toast({
          variant: 'destructive',
          title: 'Email invalide',
          description: 'Merci de renseigner un email valide.',
        });
        return;
      }
    }

    setIsSubmitting(true);

    const consigne =
      model === 'teddington_ds3'
        ? 'TEDDINGTON - ONSEN-DS3'
        : model === 'teddington_ds7'
        ? 'TEDDINGTON ONSEN-DS7'
        : 'GENERFEU ELITURBO 2002';
    const modeChauffageLabel = modeChauffage ? (HEATING_MODES.find((m) => m.id === modeChauffage)?.label ?? modeChauffage) : '';

    const payload = {
      telephone: leadData.telephone,
      surface: `${formatNumber(safeSurface)} m²`,
      departement: leadData.departement,
      nom: leadData.nom,
      societe: leadData.societe,
      email: leadData.email,
      clientType,
      hauteur: `${safeHeight.toFixed(1)} m`,
      consigne,
      modeChauffage: modeChauffageLabel,
      fonction: leadData.fonction,
      // Données techniques et calculées pour Airtable
      puissanceChauffage: Math.round(powerKw * 10) / 10,
      volume,
      tauxBrassage: airChangeRate,
      nbDestratificateurs: neededDestrat,
      consommationKwhAn: Math.round(consumptionKwhAn),
      economie30Kwh: Math.round(saving30Kwh),
      economie30Euro: saving30EuroSelected != null ? Math.round(saving30EuroSelected) : null,
      economie30EuroMin: Math.round(saving30EuroMin),
      economie30EuroMax: Math.round(saving30EuroMax),
      coutAnnuelEstime: costEuroSelected != null ? Math.round(costEuroSelected) : null,
      coutAnnuelMin: Math.round(costEuroMin),
      coutAnnuelMax: Math.round(costEuroMax),
      // Honeypot attendu côté API mais vide pour les humains
      website: '',
    };

    try {
      const response = await fetch('/api/lead.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.ok) {
        emitTracking('lead_submit');
        if (typeof window !== 'undefined' && typeof window.gtag_report_conversion === 'function') {
          window.gtag_report_conversion();
        }
        try {
          window.localStorage.removeItem(DRAFT_STORAGE_KEY);
          window.sessionStorage.setItem(
            THANKYOU_DATA_KEY,
            JSON.stringify({
              nom: leadData.nom,
              societe: leadData.societe,
              surface: `${formatNumber(safeSurface)} m²`,
              departement: leadData.departement,
              economie30EuroMin: Math.round(saving30EuroMin),
              economie30EuroMax: Math.round(saving30EuroMax),
            })
          );
        } catch (_) {}
        navigate('/merci');
      } else {
        emitTracking('lead_error', { reason: 'backend' });
        const detail = result?.detail || result?.error || response.statusText;
        console.error('Simulateur lead error:', result || response.status);
        toast({
          variant: 'destructive',
          title: "Erreur d'envoi",
          description: result?.error === 'Server misconfigured'
            ? 'Configuration serveur manquante (api/.env). Contactez l\'administrateur.'
            : detail
              ? String(detail)
              : "Une erreur est survenue. Merci de réessayer dans quelques instants.",
        });
      }
    } catch (error) {
      emitTracking('lead_error', { reason: 'network' });
      console.error('Simulateur lead fetch error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur réseau',
        description: 'Impossible de contacter le serveur pour le moment.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restauration du brouillon au chargement (si l'utilisateur revient sans avoir envoyé)
  useEffect(() => {
    if (draftRestored) return;
    try {
      const raw = typeof window !== 'undefined' && window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.height != null) setHeight(Number(draft.height));
        if (draft.surface != null) setSurface(Number(draft.surface));
        if (draft.clientType) setClientType(draft.clientType);
        if (draft.model) setModel(draft.model);
        if (draft.modeChauffage) setModeChauffage(draft.modeChauffage);
        if (draft.leadData && typeof draft.leadData === 'object') setLeadData((prev) => ({ ...prev, ...draft.leadData }));
        if (draft.showLeadForm === true) setShowLeadForm(true);
      }
    } catch (_) {}
    setDraftRestored(true);
  }, [draftRestored]);

  // Sauvegarde du brouillon à chaque modification (pour garder les champs si l'utilisateur revient plus tard)
  useEffect(() => {
    if (!draftRestored) return;
    try {
      const draft = {
        height,
        surface,
        clientType,
        model,
        modeChauffage,
        leadData: { ...leadData },
        showLeadForm,
      };
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (_) {}
  }, [draftRestored, height, surface, clientType, model, modeChauffage, leadData, showLeadForm]);

  useEffect(() => {
    if (showLeadForm && leadFormRef.current) {
      leadFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Laisser le temps au scroll/DOM de se stabiliser avant le focus
      setTimeout(() => {
        if (phoneInputRef.current) {
          phoneInputRef.current.focus();
        }
      }, 400);
    }
  }, [showLeadForm]);

  // Sélection auto du modèle selon la hauteur : 5 m → DS3, 6 m → DS7, 7 m+ → GENERFEU
  useEffect(() => {
    if (safeHeight < 6) {
      setModel('teddington_ds3');
    } else if (safeHeight < 7) {
      setModel('teddington_ds7');
    } else {
      setModel('generfeu');
    }
  }, [safeHeight]);

  return (
    <Section variant="soft">
      <div className="container mx-auto px-4 max-w-5xl">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">
          Simulateur
        </h2>

        <motion.div
          id="simulator-main"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-gray-50 rounded-2xl p-6 md:p-8 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium text-gray-600">
              {showLeadForm ? 'Étape 2 sur 2' : 'Étape 1 sur 2'}
            </span>
            <span className="text-xs text-gray-500">
              {showLeadForm ? '100%' : '50%'}
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: showLeadForm ? '100%' : '50%' }}
            />
          </div>

          {!showLeadForm && (
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
            {/* Contrôles */}
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Type d’organisation
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { trackSimulatorInteraction(); setClientType('Site industriel / logistique'); }}
                    className={`text-center px-3 py-2 rounded-lg border text-xs md:text-sm ${
                      clientType === 'Site industriel / logistique'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Site industriel / logistique
                  </button>
                  <button
                    type="button"
                    onClick={() => { trackSimulatorInteraction(); setClientType('Collectivité'); }}
                    className={`text-center px-3 py-2 rounded-lg border text-xs md:text-sm ${
                      clientType === 'Collectivité'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Collectivité
                  </button>
                  <button
                    type="button"
                    onClick={() => { trackSimulatorInteraction(); setClientType('Tertiaire'); }}
                    className={`text-center px-3 py-2 rounded-lg border text-xs md:text-sm ${
                      clientType === 'Tertiaire'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    Tertiaire
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
                  Modèle de déstratificateur
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { trackSimulatorInteraction(); setModel('teddington_ds3'); }}
                    className={`text-left px-3 py-2 rounded-lg border text-sm ${
                      model === 'teddington_ds3'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    TEDDINGTON - ONSEN-DS3
                    <span className="block text-[11px] text-gray-500 font-normal">
                      Brassage ≈ 2 330 m³/h — À partir de 5 m
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={teddingtonDs7Disabled}
                    onClick={() => { if (!teddingtonDs7Disabled) { trackSimulatorInteraction(); setModel('teddington_ds7'); } }}
                    title={teddingtonDs7Disabled ? 'Disponible à partir de 6 m de hauteur' : undefined}
                    className={`text-left px-3 py-2 rounded-lg border text-sm ${
                      teddingtonDs7Disabled
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : model === 'teddington_ds7'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    TEDDINGTON ONSEN-DS7
                    <span className="block text-[11px] text-gray-500 font-normal">
                      Brassage ≈ 6 500 m³/h
                      {teddingtonDs7Disabled && ' — À partir de 6 m'}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={generfeuDisabled}
                    onClick={() => { if (!generfeuDisabled) { trackSimulatorInteraction(); setModel('generfeu'); } }}
                    title={generfeuDisabled ? 'Disponible à partir de 7 m de hauteur (hauteur d\'installation min. 6 m)' : undefined}
                    className={`text-left px-3 py-2 rounded-lg border text-sm ${
                      generfeuDisabled
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : model === 'generfeu'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    GENERFEU ELITURBO 2002
                    <span className="block text-[11px] text-gray-500 font-normal">
                      Brassage ≈ 10 000 m³/h
                      {generfeuDisabled && ' — À partir de 7 m'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Hauteur sous plafond (m)
                  </label>
                  <span className="text-sm text-gray-700 font-medium">
                    {safeHeight.toFixed(1)} m
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={15}
                  step={0.5}
                  value={safeHeight}
                  onChange={(e) => { trackSimulatorInteraction(); setHeight(parseFloat(e.target.value)); }}
                  className="w-full accent-blue-600"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 5 m pour que la solution soit pertinente.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Surface chauffée (m²)
                  </label>
                  <span className="text-sm text-gray-700 font-medium">
                    {formatNumber(safeSurface)} m²
                  </span>
                </div>
                <input
                  type="range"
                  min={800}
                  max={10000}
                  step={200}
                  value={safeSurface}
                  onChange={(e) => { trackSimulatorInteraction(); setSurface(parseInt(e.target.value, 10)); }}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                  <span>800 m²</span>
                  <span>5 000 m²</span>
                  <span>10 000 m²</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Mode de chauffage actuel <span className="font-normal text-gray-500">(modifiable si besoin)</span>
                </label>
                <select
                  value={modeChauffage}
                  onChange={(e) => {
                    trackSimulatorInteraction();
                    setModeChauffage(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Sélectionnez un mode</option>
                  {HEATING_MODES.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Pour afficher le coût annuel et l'économie 30 % en €.
                </p>
              </div>
            </div>

            {/* Résultat */}
            <div className="bg-white rounded-xl border border-blue-100 p-5 md:p-6 space-y-4">
              <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold">
                Estimation personnalisée
              </p>

              {/* 1. ÉCONOMIES — business d'abord, puis contexte en petit */}
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-5 md:p-6 shadow-sm">
                <p className="text-sm font-medium text-green-800">
                  💰 Économies estimées
                </p>
                <p className="mt-0.5 text-3xl md:text-4xl font-bold text-green-900 tracking-tight">
                  {saving30EuroSelected != null ? (
                    <>{formatNumber(Math.round(saving30EuroSelected))} € / an</>
                  ) : (
                    <>{formatNumber(Math.round(saving30EuroMin))} € à {formatNumber(Math.round(saving30EuroMax))} € / an</>
                  )}
                </p>
                <p className="mt-1.5 text-xs text-green-700">
                  Soit jusqu'à 30 % de réduction sur votre facture de chauffage.
                </p>
                <p className="mt-1.5 text-sm font-semibold text-green-800">
                  📈 ROI estimé : 18–36 mois
                </p>
                <p className="mt-1 text-sm font-semibold text-green-800">
                  🌱 CO₂ évité : {formatDecimal(Math.max(co2SavedTons, 1))} tonnes / an
                </p>
                <p className="text-sm text-green-700">
                  Financement CEE jusqu'à 100 %
                </p>
                <p className="text-sm font-semibold text-green-800">
                  Reste à charge estimé : 0 €*
                </p>
                <p className="mt-0.5 text-[11px] text-green-700/80">
                  * Sous réserve d'éligibilité et acceptation du dossier CEE.
                </p>
                <p className="mt-2 pt-2 border-t border-green-200/60 space-y-0.5">
                  <p className="text-[11px] text-green-700/85">
                    Sur la base de vos paramètres actuels.
                  </p>
                  <p className="text-[11px] italic text-green-900/80">
                    Équivalent à 1 salarié payé à ne rien produire.
                  </p>
                </p>
              </div>

              {/* 2. Dimensionnement — semi-bold, contrasté */}
              <p className="text-sm font-semibold text-gray-900">
                ≈ {neededDestrat} déstratificateur{neededDestrat > 1 ? 's' : ''} nécessaires
              </p>
              <p className="text-xs text-gray-400">
                Validation finale par bureau d'étude
              </p>
              <p className="text-xs text-gray-400">
                Sous réserve d'éligibilité CEE (BAT-TH-142)
              </p>
              {!showLeadForm && (
                <div className="mt-4">
                  <button
                    id="cta-step2-open"
                    type="button"
                    onClick={() => {
                      if (!hasTrackedStep2Open.current) {
                        hasTrackedStep2Open.current = true;
                        emitTracking('cta_step2_open');
                      }
                      setShowLeadForm(true);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm md:text-base font-semibold py-3 rounded-lg transition-colors"
                  >
                    👉 Recevoir mon étude CEE personnalisée (24h)
                  </button>
                  <p className="mt-2 text-xs text-gray-700 font-medium">
                    📞 Un expert vous rappelle sous 24h
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    Aucun engagement — étude gratuite
                  </p>
                  <p className="mt-1.5 text-[11px] text-gray-600 text-center">
                    Simulation réalisée par plus de 100 sites industriels équipés.
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500 text-center">
                    Sous réserve d'éligibilité CEE (BAT-TH-142)
                  </p>
                </div>
              )}
            </div>
          </div>
          )}

          {showLeadForm && (
            <form
              id="simulator-step2-form"
              onSubmit={handleLeadSubmit}
              className="space-y-4"
              ref={leadFormRef}
            >
              <button
                type="button"
                onClick={() => setShowLeadForm(false)}
                className="inline-flex items-center gap-2 px-4 py-2 mb-4 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                ← Retour à l'étape 1
              </button>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Étape 2 — Coordonnées pour recevoir l'étude
                </h3>
                <p className="text-sm text-gray-700">
                  On vous rappelle pour valider l'éligibilité et chiffrer à 0€.
                </p>
                <ul className="text-xs md:text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Étude gratuite</li>
                  <li>Validation sous 24h</li>
                  <li>Aucun engagement</li>
                </ul>
              </div>

              {selectedMode && (
                <p className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  Mode retenu : <span className="font-medium">{selectedMode.label}</span> — coût annuel estimé ~{formatNumber(Math.round(costEuroSelected))} €, économie 30 % ~{formatNumber(Math.round(saving30EuroSelected))} €/an.
                </p>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Fonction
                </label>
                <select
                  name="fonction"
                  value={leadData.fonction}
                  onChange={handleLeadChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Sélectionnez votre fonction</option>
                  {FONCTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={leadData.telephone}
                  onChange={handleLeadChange}
                  ref={phoneInputRef}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nom & prénom
                </label>
                <input
                  type="text"
                  name="nom"
                  value={leadData.nom}
                  onChange={handleLeadChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Département (ou code postal) *
                </label>
                <Combobox
                  options={departements}
                  value={leadData.departement}
                  onSelect={(value) =>
                    setLeadData((prev) => ({ ...prev, departement: value }))
                  }
                  placeholder="Sélectionnez un département"
                  searchPlaceholder="Rechercher..."
                  notFoundMessage="Aucun département."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Société
                </label>
                <input
                  type="text"
                  name="societe"
                  value={leadData.societe}
                  onChange={handleLeadChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nom de votre entreprise"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email pro
                </label>
                <input
                  type="email"
                  name="email"
                  value={leadData.email}
                  onChange={handleLeadChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="jean.dupont@entreprise.fr"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Recommandé pour recevoir le récapitulatif.
                </p>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4 text-[11px] md:text-xs text-gray-500">
                <span>
                  ✅ Sans engagement — un expert vous rappelle sous 24h pour valider votre éligibilité.
                </span>
                <span>
                  ⚠️ Solution réservée aux bâtiments professionnels chauffés dans le cadre des CEE.
                </span>
              </div>

              <p className="text-[11px] text-gray-500">
                Vos données sont utilisées uniquement pour traiter votre demande et ne sont pas transmises à des tiers. Sous réserve d'éligibilité et acceptation du dossier CEE.
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeadForm(false)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-gray-300 bg-white text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  ← Retour à l'étape 1
                </button>
                <button
                  id="cta-step2-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {isSubmitting ? 'Envoi en cours…' : (
                    <>
                      <Zap className="w-4 h-4" aria-hidden />
                      Valider & être rappelé (24h)
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </Section>
  );
};

export default EnergySimulator;

