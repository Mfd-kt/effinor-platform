import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { loadFormData, clearFormData, saveFormData, getFormDataFromUrl } from '@/utils/formStorage';
import { getLeadById, updateLead } from '@/lib/api/leads';
import { calculateCEEPotential } from '@/utils/ceeCalculations';
import { logger } from '@/utils/logger';
import { sanitizeFormData } from '@/utils/sanitize';
import { useDebounce } from '@/hooks/useDebounce';
import { validateEmail, validateFrenchPhone } from '@/utils/formUtils';
import ProgressBar from '@/components/cee/ProgressBar';
import FormNavigation from '@/components/cee/FormNavigation';
import CeeStepProjectType from '@/components/cee/steps/CeeStepProjectType';
import CeeStepBuildingPac from '@/components/cee/steps/CeeStepBuildingPac';
import CeeStepBuildingDestrat from '@/components/cee/steps/CeeStepBuildingDestrat';
import CeeStepContextPac from '@/components/cee/steps/CeeStepContextPac';
import CeeStepContextDestrat from '@/components/cee/steps/CeeStepContextDestrat';
import CeeStepContactRemarks from '@/components/cee/steps/CeeStepContactRemarks';
import {
  trackFormLongOpen,
  trackFormStepComplete,
  trackFormSubmitSuccess,
  trackFormSubmitError,
  trackFormAbandon,
} from '@/lib/effinorAnalytics';

/**
 * Formulaire CEE v2 — parcours basé sur le type de projet (PAC ou déstratification).
 *
 * Schéma formulaire_data (JSON) :
 * - formVersion: 2
 * - projectType: 'pac' | 'destrat'
 * - pac: champs bâtiment + chauffage + objectif + échéance
 * - destrat: champs bâtiment + volume + chauffage + problème + échéance
 * - contact: identité + coordonnées + remarques
 * - buildings / step1 / step2 : miroir legacy pour CRM & scoring (sans éclairage)
 */

const TOTAL_STEPS = 4;
const STEP_LABELS = ['Votre projet', 'Le bâtiment', 'Chauffage & objectifs', 'Vos coordonnées'];

const emptyPac = () => ({
  buildingType: '',
  surfaceM2: '',
  postalCode: '',
  city: '',
  currentHeating: '',
  projectGoal: '',
  timeline: '',
});

const emptyDestrat = () => ({
  buildingType: '',
  surfaceM2: '',
  ceilingHeightM: '',
  postalCode: '',
  currentHeating: '',
  mainProblem: '',
  timeline: '',
});

const emptyContact = () => ({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  companyName: '',
  remarks: '',
});

function mapBesoinPrincipalToProjectType(besoin) {
  if (!besoin || typeof besoin !== 'string') return '';
  if (besoin.startsWith('pac')) return 'pac';
  if (besoin.startsWith('destrat')) return 'destrat';
  return '';
}

function mapMiniTypeBatimentToPacBuildingType(tb) {
  if (!tb) return '';
  const s = tb.toLowerCase();
  if (s.includes('résidentiel') && !s.includes('copro') && !s.includes('collectif')) return 'maison';
  if (s.includes('copro') || s.includes('collectif')) return 'copro';
  if (s.includes('bureau') || s.includes('tertiaire') || s.includes('commerce') || s.includes('retail')) return 'tertiaire';
  return 'autre';
}

function mapMiniTypeBatimentToDestratBuildingType(tb) {
  if (!tb) return '';
  const s = tb.toLowerCase();
  if (s.includes('entrepôt') || s.includes('logistique')) return 'entrepot';
  if (s.includes('usine') || s.includes('production')) return 'industriel';
  if (s.includes('bureau') || s.includes('commerce')) return 'tertiaire';
  return 'autre';
}

function pacBuildingTypeLabel(v) {
  const m = {
    maison: 'Maison',
    copro: 'Copropriété / résidentiel collectif',
    tertiaire: 'Tertiaire',
    autre: 'Autre',
  };
  return m[v] || v;
}

function destratBuildingTypeLabel(v) {
  const m = {
    entrepot: 'Entrepôt',
    industriel: 'Bâtiment industriel',
    tertiaire: 'Local tertiaire',
    gymnase: 'Gymnase / grand volume',
    autre: 'Autre',
  };
  return m[v] || v;
}

/** Agrège l’état React vers la forme attendue par calculateCEEPotential + miroir legacy. */
function toPersistableFormData(form) {
  const { projectType, pac, destrat, contact } = form;
  const surface = projectType === 'pac' ? pac.surfaceM2 : destrat.surfaceM2;
  const ceilingHeight = projectType === 'destrat' ? destrat.ceilingHeightM : '';

  const typeCode = projectType === 'pac' ? pac.buildingType : destrat.buildingType;
  const typeLabel = projectType === 'pac' ? pacBuildingTypeLabel(typeCode) : destratBuildingTypeLabel(typeCode);

  const buildings = [
    {
      type: typeCode,
      surface: String(surface || ''),
      ceilingHeight: ceilingHeight || undefined,
      heating: true,
      heatingMode: projectType === 'pac' ? pac.currentHeating : destrat.currentHeating,
    },
  ];

  const postal = projectType === 'pac' ? pac.postalCode : destrat.postalCode || '';
  const city = projectType === 'pac' ? pac.city : '';

  return {
    projectType,
    pacDetails: projectType === 'pac' ? { ...pac } : {},
    destratDetails: projectType === 'destrat' ? { ...destrat } : {},
    contact: { ...contact },
    buildings,
    step1: {
      companyName: contact.companyName || '',
      postalCode: postal || '',
      city: city || '',
      address: '',
    },
    step2: {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
    },
    step3: {},
    step4: { buildingCount: 1 },
    step6: { remarks: contact.remarks || '' },
    /** Contexte métier structuré (audit CRM) */
    qualification: {
      projectType,
      typeBatiment: typeLabel,
      surfaceM2: surface,
      ...(projectType === 'pac'
        ? {
            currentHeating: pac.currentHeating,
            projectGoal: pac.projectGoal,
            timeline: pac.timeline,
            postalCode: pac.postalCode,
            city: pac.city,
          }
        : {
            currentHeating: destrat.currentHeating,
            mainProblem: destrat.mainProblem,
            timeline: destrat.timeline,
            ceilingHeightM: destrat.ceilingHeightM,
            postalCode: destrat.postalCode,
          }),
    },
  };
}

function validateStep(currentStep, form) {
  const errors = {};
  if (currentStep === 1) {
    if (!form.projectType) errors.projectType = 'Veuillez sélectionner un type de projet.';
  } else if (currentStep === 2) {
    if (form.projectType === 'pac') {
      const { pac } = form;
      if (!pac.buildingType) errors.buildingType = 'Ce champ est requis.';
      if (!pac.surfaceM2 || parseFloat(pac.surfaceM2) < 30) errors.surfaceM2 = 'Indiquez une surface d’au moins 30 m².';
      if (!pac.postalCode || pac.postalCode.length !== 5) errors.postalCode = 'Code postal à 5 chiffres.';
      if (!pac.city?.trim()) errors.city = 'Ce champ est requis.';
    } else if (form.projectType === 'destrat') {
      const { destrat } = form;
      if (!destrat.buildingType) errors.buildingType = 'Ce champ est requis.';
      if (!destrat.surfaceM2 || parseFloat(destrat.surfaceM2) < 100) {
        errors.surfaceM2 = 'Indiquez une surface d’au moins 100 m².';
      }
      if (!destrat.ceilingHeightM || parseFloat(destrat.ceilingHeightM) < 3) {
        errors.ceilingHeightM = 'Hauteur minimale 3 m.';
      }
      if (destrat.postalCode && destrat.postalCode.length !== 5) {
        errors.postalCode = 'Code postal à 5 chiffres ou laissez vide.';
      }
    }
  } else if (currentStep === 3) {
    if (form.projectType === 'pac') {
      const { pac } = form;
      if (!pac.currentHeating) errors.currentHeating = 'Ce champ est requis.';
      if (!pac.projectGoal) errors.projectGoal = 'Ce champ est requis.';
      if (!pac.timeline) errors.timeline = 'Ce champ est requis.';
    } else if (form.projectType === 'destrat') {
      const { destrat } = form;
      if (!destrat.currentHeating) errors.currentHeating = 'Ce champ est requis.';
      if (!destrat.mainProblem) errors.mainProblem = 'Ce champ est requis.';
      if (!destrat.timeline) errors.timeline = 'Ce champ est requis.';
    }
  } else if (currentStep === 4) {
    const { contact } = form;
    if (!contact.firstName?.trim()) errors.firstName = 'Ce champ est requis.';
    if (!contact.lastName?.trim()) errors.lastName = 'Ce champ est requis.';
    if (!validateFrenchPhone(contact.phone)) errors.phone = 'Numéro de téléphone invalide.';
    if (!validateEmail(contact.email)) errors.email = 'Adresse e-mail invalide.';
  }
  return errors;
}

const CEEEligibilityForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formState, setFormState] = useState({
    projectType: '',
    pac: emptyPac(),
    destrat: emptyDestrat(),
    contact: emptyContact(),
  });

  const debouncedFormState = useDebounce(formState, 2000);
  const savingRef = useRef(false);
  const formSessionReadyRef = useRef(false);
  const abandonTrackedRef = useRef(false);
  const abandonFiredRef = useRef(false);
  const lastActivityRef = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());
  const currentStepRef = useRef(1);
  const projectTypeRef = useRef('');

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    projectTypeRef.current = formState.projectType;
  }, [formState.projectType]);

  const setProjectType = (v) => {
    setFormState((s) => {
      if (s.projectType === v) return s;
      const next = { ...s, projectType: v };
      if (s.projectType === 'destrat' && v === 'pac') next.destrat = emptyDestrat();
      if (s.projectType === 'pac' && v === 'destrat') next.pac = emptyPac();
      return next;
    });
  };

  const setPacField = (field, value) => {
    setFormState((s) => ({ ...s, pac: { ...s.pac, [field]: value } }));
  };

  const setDestratField = (field, value) => {
    setFormState((s) => ({ ...s, destrat: { ...s.destrat, [field]: value } }));
  };

  const setContactField = (field, value) => {
    setFormState((s) => ({ ...s, contact: { ...s.contact, [field]: value } }));
  };

  const saveFormProgress = useCallback(
    async (stateOverride = null) => {
      const urlData = getFormDataFromUrl();
      const leadId = urlData.leadId || localStorage.getItem('current_lead_id');
      if (!leadId || savingRef.current) return;

      const state = stateOverride || formState;
      if (!state.projectType) return;

      savingRef.current = true;
      try {
        const merged = toPersistableFormData(state);
        const ceePotential = calculateCEEPotential({
          projectType: state.projectType,
          pacDetails: state.pac,
          destratDetails: state.destrat,
          buildings: merged.buildings,
        });

        const formulaireData = {
          formVersion: 2,
          projectType: state.projectType,
          pac: state.pac,
          destrat: state.destrat,
          contact: state.contact,
          qualification: merged.qualification,
          buildings: merged.buildings,
          step1: merged.step1,
          step2: merged.step2,
          step3: {},
          step4: merged.step4,
          step6: merged.step6,
          ceePotential,
        };

        const typeProjetLabel = state.projectType === 'pac' ? 'Pompe à chaleur' : "Déstratificateur d'air";
        const updateData = {
          formulaire_data: JSON.stringify(formulaireData),
          etape_formulaire: `step${currentStep}`,
          type_projet: typeProjetLabel,
        };

        if (merged.step1.companyName) updateData.societe = merged.step1.companyName;
        if (merged.step1.postalCode) updateData.code_postal = merged.step1.postalCode;
        if (merged.step1.city) updateData.ville = merged.step1.city;
        if (merged.step1.postalCode && merged.step1.city) {
          updateData.adresse = `${merged.step1.postalCode} ${merged.step1.city}`;
        } else if (state.projectType === 'destrat' && state.destrat.postalCode) {
          updateData.adresse = `CP ${state.destrat.postalCode}`;
          updateData.code_postal = state.destrat.postalCode;
        }
        if (merged.step2.firstName || merged.step2.lastName) {
          updateData.nom = `${merged.step2.firstName || ''} ${merged.step2.lastName || ''}`.trim();
          updateData.prenom = merged.step2.firstName || '';
        }
        if (merged.step2.email) updateData.email = merged.step2.email;
        if (merged.step2.phone) updateData.telephone = merged.step2.phone;
        updateData.type_batiment =
          state.projectType === 'pac' ? pacBuildingTypeLabel(state.pac.buildingType) : destratBuildingTypeLabel(state.destrat.buildingType);
        const surf = parseFloat(state.projectType === 'pac' ? state.pac.surfaceM2 : state.destrat.surfaceM2) || 0;
        if (surf > 0) updateData.surface_m2 = surf;
        if (merged.step6.remarks) updateData.message = merged.step6.remarks;

        await updateLead(leadId, sanitizeFormData(updateData));
      } catch (error) {
        logger.error('Error saving form progress:', error);
      } finally {
        savingRef.current = false;
      }
    },
    [formState, currentStep]
  );

  useEffect(() => {
    const urlData = getFormDataFromUrl();
    const leadId = urlData.leadId || localStorage.getItem('current_lead_id');
    if (!leadId || !debouncedFormState.projectType) return;
    const hasMore =
      debouncedFormState.projectType === 'pac'
        ? Object.values(debouncedFormState.pac).some(Boolean)
        : Object.values(debouncedFormState.destrat).some(Boolean);
    if (hasMore && currentStep >= 2) {
      saveFormProgress(debouncedFormState);
    }
  }, [debouncedFormState, currentStep, saveFormProgress]);

  useEffect(() => {
    const loadInitialData = async () => {
      const urlData = getFormDataFromUrl();
      let leadId = urlData.leadId || localStorage.getItem('current_lead_id');

      if (!leadId) {
        toast({
          title: 'Accès invalide',
          description: 'Commencez par le formulaire sur la page d’accueil.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      let leadData = null;
      try {
        const leadResult = await getLeadById(leadId, { skipScoreCalculation: true });
        if (leadResult.success && leadResult.data) {
          leadData = leadResult.data;
          localStorage.setItem('current_lead_id', leadId);
        } else {
          throw new Error('Lead introuvable');
        }
      } catch (e) {
        localStorage.removeItem('current_lead_id');
        clearFormData();
        toast({
          title: 'Lead introuvable',
          description: 'Recommencez depuis la page d’accueil.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      let fd = leadData.formulaire_data;
      if (typeof fd === 'string') {
        try {
          fd = JSON.parse(fd);
        } catch {
          fd = null;
        }
      }

      if (fd?.formVersion === 2 && fd.projectType) {
        setFormState({
          projectType: fd.projectType,
          pac: { ...emptyPac(), ...fd.pac },
          destrat: { ...emptyDestrat(), ...fd.destrat },
          contact: { ...emptyContact(), ...fd.contact },
        });
        saveFormData({
          step1: fd.step1,
          step2: fd.step2,
          buildings: fd.buildings,
        });
        formSessionReadyRef.current = true;
        lastActivityRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
        trackFormLongOpen({ effinor_type_projet: fd.projectType || '' });
        return;
      }

      const hasUrlData = urlData.nom || urlData.prenom || urlData.email || urlData.telephone;
      if (hasUrlData) clearFormData();

      let savedData = null;
      if (!hasUrlData) savedData = loadFormData();

      const merged = {
        nom: urlData.nom || leadData?.nom || '',
        prenom: urlData.prenom || leadData?.prenom || '',
        email: urlData.email || leadData?.email || '',
        telephone: urlData.telephone || leadData?.telephone || '',
        societe: urlData.societe || leadData?.societe || '',
        type_batiment: leadData?.type_batiment || savedData?.type_batiment || '',
        surface_m2: leadData?.surface_m2 || savedData?.surface_m2 || '',
        besoin_principal: savedData?.besoin_principal || '',
      };

      let firstName = merged.prenom || '';
      let lastName = merged.nom || '';
      if (!firstName && lastName) {
        const parts = lastName.trim().split(' ');
        if (parts.length > 1) {
          firstName = parts[0];
          lastName = parts.slice(1).join(' ');
        } else {
          firstName = lastName;
          lastName = '';
        }
      }

      const fromBesoin = mapBesoinPrincipalToProjectType(merged.besoin_principal);
      const fromLeadType =
        leadData?.type_projet === 'Pompe à chaleur' || leadData?.type_projet === 'Pompe à Chaleur'
          ? 'pac'
          : leadData?.type_projet?.toLowerCase().includes('déstrat') || leadData?.type_projet?.toLowerCase().includes('destrat')
            ? 'destrat'
            : '';

      const projectType = fromBesoin || fromLeadType || '';

      const next = {
        projectType,
        pac: emptyPac(),
        destrat: emptyDestrat(),
        contact: {
          ...emptyContact(),
          firstName,
          lastName,
          email: merged.email || '',
          phone: merged.telephone || '',
          companyName: merged.societe || '',
        },
      };

      if (projectType === 'pac') {
        next.pac.buildingType = mapMiniTypeBatimentToPacBuildingType(merged.type_batiment);
        if (merged.surface_m2) next.pac.surfaceM2 = String(merged.surface_m2);
        if (leadData?.code_postal) next.pac.postalCode = leadData.code_postal;
        if (leadData?.ville) next.pac.city = leadData.ville;
      } else if (projectType === 'destrat') {
        next.destrat.buildingType = mapMiniTypeBatimentToDestratBuildingType(merged.type_batiment);
        if (merged.surface_m2) next.destrat.surfaceM2 = String(merged.surface_m2);
        if (leadData?.code_postal) next.destrat.postalCode = leadData.code_postal;
      }

      setFormState(next);
      saveFormData({ ...next, lead_id: leadId });
      formSessionReadyRef.current = true;
      lastActivityRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
      trackFormLongOpen({ effinor_type_projet: next.projectType || '' });

      if (merged.email || merged.telephone) {
        toast({
          title: 'Informations pré-remplies',
          description: 'Complétez les étapes pour finaliser votre demande.',
        });
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const leadId = () => getFormDataFromUrl().leadId || localStorage.getItem('current_lead_id') || '';

    const bumpActivity = () => {
      lastActivityRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    };
    const activityEvents = ['keydown', 'mousedown', 'scroll', 'touchstart'];
    activityEvents.forEach((ev) => window.addEventListener(ev, bumpActivity, { passive: true }));

    const fireAbandonOnce = (reason) => {
      if (!formSessionReadyRef.current || abandonTrackedRef.current || abandonFiredRef.current) return;
      abandonFiredRef.current = true;
      trackFormAbandon(reason, {
        formStep: currentStepRef.current,
        lead_id: leadId(),
        effinor_type_projet: projectTypeRef.current || '',
      });
    };

    const onBeforeUnload = () => fireAbandonOnce('page_exit');
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') fireAbandonOnce('page_exit');
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibility);

    const idleMs = 30000;
    const tickMs = 5000;
    const inactivityTimer = window.setInterval(() => {
      if (!formSessionReadyRef.current || abandonTrackedRef.current || abandonFiredRef.current) return;
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      if (now - lastActivityRef.current >= idleMs) {
        fireAbandonOnce('inactive_30s');
      }
    }, tickMs);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, bumpActivity));
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(inactivityTimer);
      if (formSessionReadyRef.current && !abandonTrackedRef.current && !abandonFiredRef.current) {
        abandonFiredRef.current = true;
        trackFormAbandon('page_exit', {
          formStep: currentStepRef.current,
          lead_id: leadId(),
          effinor_type_projet: projectTypeRef.current || '',
        });
      }
    };
  }, []);

  useEffect(() => {
    saveFormData({
      projectType: formState.projectType,
      pac: formState.pac,
      destrat: formState.destrat,
      contact: formState.contact,
    });
  }, [formState]);

  const handleNext = async () => {
    const v = validateStep(currentStep, formState);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      toast({ title: 'Vérifiez les champs', description: 'Certains champs sont manquants ou invalides.', variant: 'destructive' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors({});
    await saveFormProgress();
    const leadId = getFormDataFromUrl().leadId || localStorage.getItem('current_lead_id') || '';
    trackFormStepComplete(currentStep, STEP_LABELS[currentStep - 1] || '', {
      effinor_type_projet: formState.projectType || '',
      lead_id: leadId,
    });
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const v = validateStep(4, formState);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      toast({ title: 'Vérifiez vos coordonnées', variant: 'destructive' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const urlData = getFormDataFromUrl();
    let leadId = urlData.leadId || localStorage.getItem('current_lead_id');
    if (!leadId) {
      toast({ title: 'Erreur', description: 'Session expirée. Recommencez depuis l’accueil.', variant: 'destructive' });
      navigate('/');
      return;
    }

    setIsSubmitting(true);
    try {
      const check = await getLeadById(leadId, { skipScoreCalculation: true });
      if (!check.success || !check.data) {
        throw new Error('Lead introuvable');
      }

      const merged = toPersistableFormData(formState);
      const ceePotential = calculateCEEPotential({
        projectType: formState.projectType,
        pacDetails: formState.pac,
        destratDetails: formState.destrat,
        buildings: merged.buildings,
      });

      const formulaireData = {
        formVersion: 2,
        projectType: formState.projectType,
        pac: formState.pac,
        destrat: formState.destrat,
        contact: formState.contact,
        qualification: merged.qualification,
        buildings: merged.buildings,
        step1: merged.step1,
        step2: merged.step2,
        step3: {},
        step4: merged.step4,
        step6: merged.step6,
        ceePotential,
      };

      const typeProjetLabel = formState.projectType === 'pac' ? 'Pompe à chaleur' : "Déstratificateur d'air";

      const updateData = {
        societe: formState.contact.companyName || null,
        adresse:
          formState.projectType === 'pac'
            ? `${formState.pac.postalCode} ${formState.pac.city}`.trim()
            : formState.destrat.postalCode
              ? `CP ${formState.destrat.postalCode}`
              : null,
        code_postal: formState.projectType === 'pac' ? formState.pac.postalCode : formState.destrat.postalCode || null,
        ville: formState.projectType === 'pac' ? formState.pac.city : null,
        nom: `${formState.contact.firstName} ${formState.contact.lastName}`.trim(),
        prenom: formState.contact.firstName,
        telephone: formState.contact.phone,
        email: formState.contact.email,
        type_batiment:
          formState.projectType === 'pac'
            ? pacBuildingTypeLabel(formState.pac.buildingType)
            : destratBuildingTypeLabel(formState.destrat.buildingType),
        surface_m2: parseFloat(formState.projectType === 'pac' ? formState.pac.surfaceM2 : formState.destrat.surfaceM2) || null,
        message: formState.contact.remarks || '',
        type_projet: typeProjetLabel,
        products: JSON.stringify({ formVersion: 2, ...formulaireData }),
        formulaire_data: JSON.stringify(formulaireData),
        montant_cee_estime: ceePotential.totalPotential,
        notes_techniques: `CEE v2 — ${typeProjetLabel} | Chauffage/indicatif: ${ceePotential.heatingPotential} € | Total: ${ceePotential.totalPotential} € | ${ceePotential.classification}`,
        formulaire_complet: true,
        etape_formulaire: 'complet',
        statut: 'devis_a_preparer',
      };

      const { error } = await supabase.from('leads').update(sanitizeFormData(updateData)).eq('id', leadId);
      if (error) throw error;

      abandonTrackedRef.current = true;
      clearFormData();
      localStorage.removeItem('current_lead_id');
      trackFormSubmitSuccess({ effinor_type_projet: formState.projectType });
      toast({ title: 'Demande envoyée', description: 'Notre équipe vous recontacte rapidement.' });
      navigate('/merci', {
        state: {
          leadId,
          ceePotential,
          companyName: formState.contact.companyName || `${formState.contact.firstName} ${formState.contact.lastName}`,
        },
      });
    } catch (error) {
      logger.error('Error updating lead:', error);
      trackFormSubmitError({ effinor_type_projet: formState.projectType });
      toast({ title: 'Erreur', description: 'Impossible d’enregistrer. Réessayez ou appelez-nous.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const persistable = toPersistableFormData(formState);
  const ceePreview = calculateCEEPotential({
    projectType: formState.projectType,
    pacDetails: formState.pac,
    destratDetails: formState.destrat,
    buildings: persistable.buildings,
  });

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CeeStepProjectType value={formState.projectType} onChange={setProjectType} errors={errors} />;
      case 2:
        if (formState.projectType === 'pac') {
          return <CeeStepBuildingPac data={formState.pac} onChange={setPacField} errors={errors} />;
        }
        if (formState.projectType === 'destrat') {
          return <CeeStepBuildingDestrat data={formState.destrat} onChange={setDestratField} errors={errors} />;
        }
        return (
          <p className="text-center text-gray-600">
            Retournez à l’étape 1 pour choisir un type de projet.
          </p>
        );
      case 3:
        if (formState.projectType === 'pac') {
          return <CeeStepContextPac data={formState.pac} onChange={setPacField} errors={errors} />;
        }
        if (formState.projectType === 'destrat') {
          return <CeeStepContextDestrat data={formState.destrat} onChange={setDestratField} errors={errors} />;
        }
        return null;
      case 4:
        return (
          <CeeStepContactRemarks
            data={formState.contact}
            onChange={setContactField}
            errors={errors}
            ceePotential={ceePreview}
            projectType={formState.projectType}
          />
        );
      default:
        return null;
    }
  };

  const canNavigate =
    currentStep === 1 ||
    (currentStep > 1 && (formState.projectType === 'pac' || formState.projectType === 'destrat'));

  return (
    <>
      <Helmet>
        <title>Finalisez votre demande | EFFINOR</title>
        <meta
          name="description"
          content="Parcours court : pompe à chaleur ou déstratification. Complétez votre dossier pour une étude et le montage CEE."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-10 md:py-14 pt-28 md:pt-32">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-gray-200/80 bg-white shadow-lg shadow-gray-200/50 p-6 md:p-10">
              <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} stepLabels={STEP_LABELS} />
              <div className="mt-6 md:mt-10 min-h-[200px]">{renderStep()}</div>
              {canNavigate && (
                <FormNavigation
                  currentStep={currentStep}
                  totalSteps={TOTAL_STEPS}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  onSubmit={handleSubmit}
                  isValid
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CEEEligibilityForm;
