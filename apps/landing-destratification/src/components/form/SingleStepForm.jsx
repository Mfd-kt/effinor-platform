import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Combobox } from "@/components/ui/combobox";
import { departements } from '@/lib/departements';

const SingleStepForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hauteur: '',
    surface: '',
    chauffe: '',
    mode_chauffage: '',
    nom: '',
    email: '',
    telephone: '',
    societe: '',
    departement: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChoiceClick = (group, value) => {
    setFormData(prev => ({ ...prev, [group]: value }));
  };

  const handleFinalSubmit = async () => {
    const WEBHOOK = "https://n8n.srv792550.hstgr.cloud/webhook/86dbf176-7614-4fe0-8570-34c0f0ea88ac";
    
    const need = (name, label) => {
      const value = formData[name];
      if (!value) {
        toast({ variant: "destructive", title: "Champ requis", description: `Merci de renseigner : ${label}` });
        return false;
      }
      return true;
    };

    if (!need("nom", "Nom")) return;
    if (!need("email", "Email")) return;
    if (!need("telephone", "Téléphone")) return;

    const qs = new URLSearchParams(window.location.search);
    const dataToSend = {
      ...formData,
      landing: 'destratificateur',
      page_url: window.location.href,
      page_title: document.title || '',
      referrer: document.referrer || '',
      utm_source: qs.get('utm_source') || '',
      utm_medium: qs.get('utm_medium') || '',
      utm_campaign: qs.get('utm_campaign') || '',
      utm_term: qs.get('utm_term') || '',
      utm_content: qs.get('utm_content') || '',
    };
    
    const body = new FormData();
    for (const key in dataToSend) {
        body.append(key, dataToSend[key]);
    }

    try {
      await fetch(WEBHOOK, { 
        method: "POST", 
        body: body
      });
      navigate("/merci");
    } catch (_) {
      toast({ variant: "destructive", title: "Erreur", description: "Erreur d’envoi. Veuillez réessayer." });
    }
  };

  return (
    <div id="single-step-form-container" className="bg-white p-6 md:p-8 rounded-xl shadow-2xl">
      <h3 className="font-bold text-xl text-center mb-4">Demandez votre audit gratuit</h3>
      <form id="elig-cee-form" data-landing="destratificateur" onSubmit={(e) => e.preventDefault()}>
        
        <FormField>
          <Label>Hauteur sous plafond</Label>
          <div className="grid grid-cols-3 gap-2">
            <RadioPill data-g="hauteur" data-v="<5m" onClick={() => handleChoiceClick('hauteur', '<5m')} className={formData.hauteur === '<5m' ? 'on' : ''}>&lt;5m</RadioPill>
            <RadioPill data-g="hauteur" data-v="5-8m" onClick={() => handleChoiceClick('hauteur', '5-8m')} className={formData.hauteur === '5-8m' ? 'on' : ''}>5–8m</RadioPill>
            <RadioPill data-g="hauteur" data-v=">8m" onClick={() => handleChoiceClick('hauteur', '>8m')} className={formData.hauteur === '>8m' ? 'on' : ''}>&gt;8m</RadioPill>
          </div>
        </FormField>

        <FormField>
          <Label>Surface approximative</Label>
          <div className="grid grid-cols-3 gap-2">
            <RadioPill data-g="surface" data-v="<1000 m²" onClick={() => handleChoiceClick('surface', '<1000 m²')} className={formData.surface === '<1000 m²' ? 'on' : ''}>&lt;1000 m²</RadioPill>
            <RadioPill data-g="surface" data-v="1000-5000 m²" onClick={() => handleChoiceClick('surface', '1000-5000 m²')} className={formData.surface === '1000-5000 m²' ? 'on' : ''}>1000–5000 m²</RadioPill>
            <RadioPill data-g="surface" data-v=">5000 m²" onClick={() => handleChoiceClick('surface', '>5000 m²')} className={formData.surface === '>5000 m²' ? 'on' : ''}>&gt;5000 m²</RadioPill>
          </div>
        </FormField>

        <FormField>
          <Label>Votre bâtiment est-il chauffé ?</Label>
          <div className="flex gap-4">
            <RadioPill data-g="chauffe" data-v="Oui" onClick={() => handleChoiceClick('chauffe', 'Oui')} className={formData.chauffe === 'Oui' ? 'on' : ''}>Oui</RadioPill>
            <RadioPill data-g="chauffe" data-v="Non" onClick={() => handleChoiceClick('chauffe', 'Non')} className={formData.chauffe === 'Non' ? 'on' : ''}>Non</RadioPill>
          </div>
        </FormField>

        <motion.div
          initial={false}
          animate={{ height: formData.chauffe === 'Oui' ? 'auto' : 0, opacity: formData.chauffe === 'Oui' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className="overflow-hidden"
        >
          <FormField>
            <Label>Quel est votre mode de chauffage principal ?</Label>
            <div className="grid grid-cols-3 gap-2">
              <RadioPill data-g="mode_chauffage" data-v="Gaz" onClick={() => handleChoiceClick('mode_chauffage', 'Gaz')} className={formData.mode_chauffage === 'Gaz' ? 'on' : ''}>Gaz</RadioPill>
              <RadioPill data-g="mode_chauffage" data-v="Électrique" onClick={() => handleChoiceClick('mode_chauffage', 'Électrique')} className={formData.mode_chauffage === 'Électrique' ? 'on' : ''}>Électrique</RadioPill>
              <RadioPill data-g="mode_chauffage" data-v="Fioul" onClick={() => handleChoiceClick('mode_chauffage', 'Fioul')} className={formData.mode_chauffage === 'Fioul' ? 'on' : ''}>Fioul</RadioPill>
              <RadioPill data-g="mode_chauffage" data-v="Bois" onClick={() => handleChoiceClick('mode_chauffage', 'Bois')} className={formData.mode_chauffage === 'Bois' ? 'on' : ''}>Bois</RadioPill>
              <RadioPill data-g="mode_chauffage" data-v="PAC" onClick={() => handleChoiceClick('mode_chauffage', 'PAC')} className={formData.mode_chauffage === 'PAC' ? 'on' : ''}>PAC</RadioPill>
            </div>
          </FormField>
        </motion.div>

        <hr className="my-6 border-gray-200" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <FormField><Label htmlFor="nom">Nom*</Label><Input id="nom" name="nom" value={formData.nom} onChange={handleInputChange} required /></FormField>
          <FormField><Label htmlFor="societe">Société</Label><Input id="societe" name="societe" value={formData.societe} onChange={handleInputChange} /></FormField>
        </div>
        <FormField><Label htmlFor="email">Email*</Label><Input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required /></FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <FormField><Label htmlFor="telephone">Téléphone*</Label><Input type="tel" id="telephone" name="telephone" value={formData.telephone} onChange={handleInputChange} required /></FormField>
          <FormField>
            <Label htmlFor="departement">Département</Label>
             <Combobox
                options={departements}
                value={formData.departement}
                onSelect={(value) => handleSelectChange('departement', value)}
                placeholder="Sélectionnez un département"
                searchPlaceholder="Rechercher un département..."
                notFoundMessage="Aucun département trouvé."
              />
          </FormField>
        </div>
        
        <div className="mt-6">
            <Button id="btn-submit-elig" type="button" onClick={handleFinalSubmit} className="btn-secondary w-full text-lg py-3">
              Vérifiez mon éligibilité CEE gratuitement
            </Button>
        </div>
        <p className="text-center text-xs text-gray-500 mt-3">Un conseiller vous rappelle sous 24h – Sans engagement.</p>
      </form>
    </div>
  );
};

const FormField = ({ children }) => <div className="mb-4">{children}</div>;
const Label = ({ children, htmlFor }) => <label htmlFor={htmlFor} className="block text-sm font-semibold text-gray-700 mb-2">{children}</label>;
const Input = (props) => <input {...props} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />;
const RadioPill = ({ children, ...props }) => (
  <button type="button" {...props} className={`choice-pill block w-full text-center px-3 py-2 border rounded-lg cursor-pointer transition-colors bg-white hover:bg-gray-100 ${props.className || ''}`}>
    <span className="text-sm font-medium pointer-events-none">{children}</span>
  </button>
);

export default SingleStepForm;