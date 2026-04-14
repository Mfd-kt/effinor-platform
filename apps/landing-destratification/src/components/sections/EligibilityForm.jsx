import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { departements } from '@/lib/departements';
import { Progress } from '@/components/ui/progress';
import { pushEvent, getStoredUtms } from '@/lib/tracking';
import { toast } from '@/components/ui/use-toast';
import Section from '@/components/layout/Section';

const THANKYOU_DATA_KEY = 'thankYouData';

/** Déduit le code département à partir du code postal (saisi en étape 1). */
function postalCodeToDepartment(postalCode) {
  const cp = (postalCode || '').replace(/\D/g, '').slice(0, 5);
  if (cp.length < 2) return '';
  if (cp.startsWith('97')) return cp.slice(0, 3); // DOM 971-976
  if (cp.startsWith('98')) return '98';
  if (cp.startsWith('20')) return parseInt(cp, 10) < 20200 ? '2A' : '2B'; // Corse
  return cp.slice(0, 2); // 01-95
}

function normalizePhone(value) {
  const digits = (value || '').replace(/\s/g, '').replace(/^\+33/, '0');
  return digits;
}
function isValidFRPhone(value) {
  const n = normalizePhone(value);
  return /^0[1-9]\d{8}$/.test(n);
}

const BUILDING_TYPES = [
  { value: 'Site industriel / logistique', label: 'Site industriel / logistique' },
  { value: 'Collectivité', label: 'Collectivité' },
  { value: 'Tertiaire', label: 'Tertiaire' },
];

const SURFACE_RANGES = [
  { value: '800–2 000 m²', label: '800–2 000 m²' },
  { value: '2 000–5 000 m²', label: '2 000–5 000 m²' },
  { value: '5 000+ m²', label: '5 000+ m²' },
];

const HEIGHT_RANGES = [
  { value: '5–6 m', label: '5–6 m' },
  { value: '6–8 m', label: '6–8 m' },
  { value: '8–12 m', label: '8–12 m' },
  { value: '12 m+', label: '12 m+' },
];

const HEATING_MODES = [
  { value: 'Gaz', label: 'Gaz' },
  { value: 'Fioul', label: 'Fioul' },
  { value: 'Électricité', label: 'Électricité' },
  { value: 'Bois (granulés)', label: 'Bois (granulés)' },
  { value: 'Pompe à chaleur', label: 'Pompe à chaleur' },
];

const CRENEAUX = [
  { value: 'Matin (8h-12h)', label: 'Matin (8h-12h)' },
  { value: 'Après-midi (12h-18h)', label: 'Après-midi (12h-18h)' },
];

const EligibilityForm = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [step, setStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isStep1Creating, setIsStep1Creating] = React.useState(false);
  const [airtableRecordId, setAirtableRecordId] = React.useState('');
  const step1StartedRef = useRef(false);

  const [step1, setStep1] = React.useState({
    buildingType: 'Site industriel / logistique',
    surfaceRange: '2 000–5 000 m²',
    heightRange: '6–8 m',
    postalCode: '',
    heatingMode: 'Gaz',
  });

  const [step2, setStep2] = React.useState({
    nom: '',
    societe: '',
    telephone: '',
    email: '',
    creneau: 'Matin (8h-12h)',
    consent: false,
  });

  // step1_start on first interaction with step 1
  const maybeTrackStep1Start = () => {
    if (step1StartedRef.current) return;
    step1StartedRef.current = true;
    pushEvent('step1_start', {
      triggered_from: 'eligibility_section',
      building_type: step1.buildingType,
    });
  };

  useEffect(() => {
    if (step === 2) {
      pushEvent('step2_start', {
        building_type: step1.buildingType,
        surface_range: step1.surfaceRange,
      });
    }
  }, [step, step1.buildingType, step1.surfaceRange]);

  const handleStep1Next = async (e) => {
    e.preventDefault();
    const cp = step1.postalCode.replace(/\D/g, '');
    if (cp.length !== 5) {
      toast({
        variant: 'destructive',
        title: 'Code postal invalide',
        description: 'Merci de saisir 5 chiffres.',
      });
      return;
    }
    pushEvent('step1_submit', {
      building_type: step1.buildingType,
      surface_range: step1.surfaceRange,
      height_range: step1.heightRange,
      postal_code_prefix: step1.postalCode.replace(/\D/g, '').slice(0, 2),
      heating_mode: step1.heatingMode,
    });

    // Créer un record Airtable dès le passage Step 1 -> Step 2 (sans persister l'id : refresh => nouveau record)
    setIsStep1Creating(true);
    try {
      const utms = getStoredUtms();
      const departement = postalCodeToDepartment(step1.postalCode);
      const step1Payload = {
        stage: 'step1',
        surface: step1.surfaceRange,
        departement,
        clientType: step1.buildingType,
        hauteur: step1.heightRange,
        modeChauffage: step1.heatingMode,
        sourceForm: 'eligibility',
        website: '',
        postalCode: step1.postalCode?.trim().replace(/\D/g, '').slice(0, 5) || '',
        gclid: utms.gclid || '',
        utm_source: utms.utm_source || '',
        utm_campaign: utms.utm_campaign || '',
      };

      const response = await fetch('/api/lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step1Payload),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.ok && result.recordId) {
        setAirtableRecordId(String(result.recordId));
      } else {
        // On n'empêche pas l'utilisateur d'avancer : au submit Step 2, on recréera si besoin.
        const detail = result?.detail || result?.error || response.statusText;
        toast({
          variant: 'destructive',
          title: 'Impossible de préparer votre étude',
          description: detail ? String(detail) : 'Merci de réessayer.',
        });
      }
    } catch (_) {
      toast({
        variant: 'destructive',
        title: 'Erreur réseau',
        description: 'Impossible de contacter le serveur pour le moment.',
      });
    } finally {
      setIsStep1Creating(false);
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!step2.consent) {
      toast({
        variant: 'destructive',
        title: 'Consentement requis',
        description: 'Merci d\'accepter l\'utilisation de vos données pour être rappelé.',
      });
      return;
    }
    if (!step2.telephone) {
      toast({
        variant: 'destructive',
        title: 'Champs requis',
        description: 'Merci de renseigner le téléphone.',
      });
      return;
    }
    if (!isValidFRPhone(step2.telephone)) {
      toast({
        variant: 'destructive',
        title: 'Téléphone invalide',
        description: 'Merci de saisir un numéro français valide (10 chiffres).',
      });
      return;
    }
    if (step2.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step2.email)) {
      toast({
        variant: 'destructive',
        title: 'Email invalide',
        description: 'Merci de saisir un email valide.',
      });
      return;
    }

    setIsSubmitting(true);
    const leadId = String(Date.now());
    const utms = getStoredUtms();
    const departement = postalCodeToDepartment(step1.postalCode);

    const payload = {
      recordId: airtableRecordId || undefined,
      telephone: normalizePhone(step2.telephone),
      surface: step1.surfaceRange,
      departement,
      nom: step2.nom,
      societe: step2.societe,
      email: step2.email || '',
      clientType: step1.buildingType,
      hauteur: step1.heightRange,
      consigne: 'À dimensionner',
      modeChauffage: step1.heatingMode,
      website: '',
      sourceForm: 'eligibility',
      postalCode: step1.postalCode?.trim().replace(/\D/g, '').slice(0, 5) || '',
      creneau: step2.creneau || '',
      gclid: utms.gclid || '',
      utm_source: utms.utm_source || '',
      utm_campaign: utms.utm_campaign || '',
    };

    try {
      const response = await fetch('/api/lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.ok) {
        pushEvent('lead_submit', {
          lead_id: leadId,
          method: 'form',
          utm_source: utms.utm_source,
          utm_campaign: utms.utm_campaign,
          gclid: utms.gclid,
          building_type: step1.buildingType,
          surface_range: step1.surfaceRange,
        });
        if (typeof window !== 'undefined' && typeof window.gtag_report_conversion === 'function') {
          window.gtag_report_conversion();
        }
        try {
          const deptLabel = departements.find((d) => d.value === departement)?.label || departement;
          window.sessionStorage.setItem(
            THANKYOU_DATA_KEY,
            JSON.stringify({
              nom: step2.nom,
              societe: step2.societe,
              surface: step1.surfaceRange,
              departement: deptLabel,
            })
          );
        } catch (_) {}
        navigate('/merci');
      } else {
        const detail = result?.detail || result?.error || response.statusText;
        toast({
          variant: 'destructive',
          title: "Erreur d'envoi",
          description: detail ? String(detail) : "Une erreur est survenue. Réessayez.",
        });
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erreur réseau',
        description: 'Impossible de contacter le serveur.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inner = (
    <div className="bg-white rounded-xl shadow-section-card border border-gray-200 p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Recevoir mon étude CEE (gratuit)</h2>
      <p className="text-gray-600 text-center text-sm mb-6">Audit gratuit — Réponse sous 48h — Sans engagement</p>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Étape {step} sur 2</span>
            <span>{step === 1 ? '50%' : '100%'}</span>
          </div>
          <Progress value={step === 1 ? 50 : 100} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step1"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleStep1Next}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Code postal <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  value={step1.postalCode}
                  onFocus={maybeTrackStep1Start}
                  onChange={(e) => {
                    maybeTrackStep1Start();
                    setStep1((s) => ({ ...s, postalCode: e.target.value.replace(/\D/g, '').slice(0, 5) }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="75001"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type de bâtiment</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {BUILDING_TYPES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        maybeTrackStep1Start();
                        setStep1((s) => ({ ...s, buildingType: opt.value }));
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium ${
                        step1.buildingType === opt.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Surface</label>
                <div className="grid grid-cols-3 gap-2">
                  {SURFACE_RANGES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        maybeTrackStep1Start();
                        setStep1((s) => ({ ...s, surfaceRange: opt.value }));
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        step1.surfaceRange === opt.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Hauteur sous plafond</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {HEIGHT_RANGES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        maybeTrackStep1Start();
                        setStep1((s) => ({ ...s, heightRange: opt.value }));
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        step1.heightRange === opt.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mode de chauffage</label>
                <select
                  value={step1.heatingMode}
                  onChange={(e) => {
                    maybeTrackStep1Start();
                    setStep1((s) => ({ ...s, heatingMode: e.target.value }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {HEATING_MODES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isStep1Creating}
                className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold"
              >
                {isStep1Creating ? 'Préparation…' : 'Calculer mon éligibilité →'}
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">30 secondes • Sans engagement • Réponse sous 48h</p>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step2"
              id="eligibility-step2-form"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 mb-4">
                <p className="font-medium text-gray-900">Récap</p>
                <p>{step1.buildingType} — {step1.surfaceRange} — {step1.heightRange}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={step2.nom}
                  onChange={(e) => setStep2((s) => ({ ...s, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone <span className="text-red-500">*</span></label>
                <input
                  type="tel"
                  value={step2.telephone}
                  onChange={(e) => setStep2((s) => ({ ...s, telephone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="06 12 34 56 78"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Nous vous rappelons uniquement pour vous transmettre l’étude CEE. Aucun démarchage.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={step2.email}
                  onChange={(e) => setStep2((s) => ({ ...s, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="jean.dupont@entreprise.fr"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Société</label>
                <input
                  type="text"
                  value={step2.societe}
                  onChange={(e) => setStep2((s) => ({ ...s, societe: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Créneau rappel</label>
                <div className="grid grid-cols-2 gap-2">
                  {CRENEAUX.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStep2((s) => ({ ...s, creneau: opt.value }))}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        step2.creneau === opt.value ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 bg-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={step2.consent}
                  onChange={(e) => setStep2((s) => ({ ...s, consent: e.target.checked }))}
                  className="mt-1 rounded border-gray-300"
                />
                <label htmlFor="consent" className="text-sm text-gray-600">
                  J'accepte que mes données soient utilisées pour me recontacter dans le cadre de ma demande d'éligibilité CEE (RGPD).
                </label>
              </div>
              <ul className="text-sm text-gray-800 space-y-1">
                <li>✔ Estimation des économies de chauffage</li>
                <li>✔ Vérification de votre éligibilité CEE</li>
                <li>✔ Étude technique envoyée sous 48h</li>
              </ul>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold"
              >
                {isSubmitting ? 'Envoi…' : 'Recevoir mon étude CEE gratuite (48h)'}
              </button>
              <ul className="mt-3 text-xs text-gray-600 space-y-1">
                <li>✔ Audit gratuit</li>
                <li>✔ Sans engagement</li>
                <li>✔ Réponse sous 48h</li>
              </ul>
            </motion.form>
          )}
        </AnimatePresence>
    </div>
  );

  if (embedded) {
    return (
      <div id="form-container" data-form-step={step} className="w-full">
        {inner}
      </div>
    );
  }

  return (
    <Section id="form-container" variant="soft" data-form-step={step}>
      <div className="container mx-auto px-4 max-w-2xl">
        {inner}
      </div>
    </Section>
  );
};

export default EligibilityForm;
