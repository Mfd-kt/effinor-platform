import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Euro, PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { validateEmail, validateFrenchPhone } from '@/utils/formUtils';
import { sanitizeFormData } from '@/utils/sanitize';

const DeshumidificateurForm = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    societe: '',
    type_batiment: '',
    surface_m2: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nom?.trim()) newErrors.nom = 'Le nom est requis';
    if (!formData.email?.trim() || !validateEmail(formData.email)) {
      newErrors.email = 'Un email valide est requis';
    }
    if (!formData.telephone?.trim() || !validateFrenchPhone(formData.telephone)) {
      newErrors.telephone = 'Un numéro de téléphone valide est requis';
    }
    if (!formData.type_batiment) newErrors.type_batiment = 'Le type de bâtiment est requis';
    if (!formData.surface_m2 || parseInt(formData.surface_m2) < 1) {
      newErrors.surface_m2 = 'La surface doit être supérieure à 0 m²';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast({
        variant: 'destructive',
        title: 'Erreur de validation',
        description: 'Veuillez corriger les erreurs dans le formulaire.'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const leadData = sanitizeFormData({
        nom: formData.nom.trim(),
        prenom: formData.prenom?.trim() || '',
        email: formData.email.trim().toLowerCase(),
        telephone: formData.telephone.trim(),
        societe: formData.societe?.trim() || '',
        type_batiment: formData.type_batiment,
        surface_m2: parseInt(formData.surface_m2) || null,
        message: formData.message?.trim() || '',
        source: 'Landing Déshumidificateur',
        campagne: 'deshumidificateur-2024',
        statut: 'nouveau',
        priorite: 'haute',
        formulaire_complet: false
      });

      const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;

      setSuccess(true);
      toast({
        title: '✅ Demande envoyée avec succès !',
        description: 'Un expert va vous recontacter sous 24h.'
      });

      setTimeout(() => {
        navigate('/merci', { 
          state: { 
            leadId: data?.id || 'landing-deshumidificateur',
            companyName: formData.societe || formData.nom 
          } 
        });
      }, 2000);

    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue. Veuillez réessayer.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.7 }}
        className="bg-white dark:bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl sm:text-2xl font-bold mb-2 text-green-600">Demande envoyée !</h3>
          <p className="text-slate-600 dark:text-slate-400">Redirection en cours...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.7, delay: 0.2 }}
      className="bg-white dark:bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700"
    >
      <h3 className="text-xl sm:text-2xl font-bold text-center mb-4 bg-gradient-to-r from-secondary-600 to-green-600 bg-clip-text text-transparent">
        Vérifiez votre éligibilité
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nom" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Nom *
          </Label>
          <Input 
            id="nom" 
            type="text" 
            placeholder="Dupont" 
            required 
            value={formData.nom} 
            onChange={(e) => handleChange('nom', e.target.value)}
            className={errors.nom ? 'border-red-500' : ''}
          />
          {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
        </div>

        <div>
          <Label htmlFor="prenom" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Prénom
          </Label>
          <Input 
            id="prenom" 
            type="text" 
            placeholder="Jean" 
            value={formData.prenom} 
            onChange={(e) => handleChange('prenom', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email *
          </Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="votre@email.com" 
            required 
            value={formData.email} 
            onChange={(e) => handleChange('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="telephone" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Téléphone *
          </Label>
          <Input 
            id="telephone" 
            type="tel" 
            placeholder="06 12 34 56 78" 
            required 
            value={formData.telephone} 
            onChange={(e) => handleChange('telephone', e.target.value)}
            className={errors.telephone ? 'border-red-500' : ''}
          />
          {errors.telephone && <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>}
        </div>

        <div>
          <Label htmlFor="societe" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Société
          </Label>
          <Input 
            id="societe" 
            type="text" 
            placeholder="Nom de votre entreprise" 
            value={formData.societe} 
            onChange={(e) => handleChange('societe', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="type_batiment" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Type de bâtiment *
          </Label>
          <Select 
            value={formData.type_batiment} 
            onValueChange={(value) => handleChange('type_batiment', value)}
          >
            <SelectTrigger className={errors.type_batiment ? 'border-red-500' : ''}>
              <SelectValue placeholder="Sélectionnez un type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Usine / Atelier">Usine / Atelier</SelectItem>
              <SelectItem value="Entrepôt">Entrepôt</SelectItem>
              <SelectItem value="Bâtiment agricole">Bâtiment agricole</SelectItem>
              <SelectItem value="Serre">Serre</SelectItem>
              <SelectItem value="Salle de sport">Salle de sport</SelectItem>
              <SelectItem value="Centre commercial">Centre commercial</SelectItem>
              <SelectItem value="Autre">Autre</SelectItem>
            </SelectContent>
          </Select>
          {errors.type_batiment && <p className="text-xs text-red-500 mt-1">{errors.type_batiment}</p>}
        </div>

        <div>
          <Label htmlFor="surface_m2" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Surface (m²) *
          </Label>
          <Input 
            id="surface_m2" 
            type="number" 
            placeholder="500" 
            min="1"
            required 
            value={formData.surface_m2} 
            onChange={(e) => handleChange('surface_m2', e.target.value)}
            className={errors.surface_m2 ? 'border-red-500' : ''}
          />
          {errors.surface_m2 && <p className="text-xs text-red-500 mt-1">{errors.surface_m2}</p>}
        </div>

        <div>
          <Label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Message (optionnel)
          </Label>
          <Textarea 
            id="message" 
            placeholder="Décrivez vos besoins..." 
            rows="3"
            value={formData.message} 
            onChange={(e) => handleChange('message', e.target.value)}
          />
        </div>

        <Button 
          type="submit" 
          size="lg" 
          className="w-full font-bold text-lg bg-secondary-500 hover:bg-secondary-600" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Euro className="w-5 h-5 mr-2" /> 
              Demander un devis gratuit
            </>
          )}
        </Button>
        <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-2">
          ✅ Aucun engagement • 🔒 Diagnostic offert • 📞 Réponse &lt; 24h
        </p>
      </form>
    </motion.div>
  );
};

const HeroSection = () => {
  return (
    <section id="hero" className="relative py-20 md:py-28 bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        <img 
          className="w-full h-full object-cover" 
          alt="Bâtiment industriel moderne" 
          src="https://images.unsplash.com/photo-1581092160562-40aa08e78837" 
        />
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/50 via-slate-50/80 to-slate-50 dark:from-black/50 dark:via-slate-950/80 dark:to-slate-950"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4"
          >
            Déshumidificateur industriel <span className="bg-gradient-to-r from-secondary-600 to-green-600 bg-clip-text text-transparent">professionnel</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8"
          >
            Solutions déshumidification haute performance pour usines, entrepôts et bâtiments professionnels. Installation rapide, service expert, garantie complète.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 mt-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.7, delay: 0.5 }}
            className="lg:col-span-3 relative aspect-video rounded-xl shadow-2xl overflow-hidden group cursor-pointer"
          >
            <img 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              alt="Déshumidificateur thermodynamique en fonctionnement dans un bâtiment industriel" 
              src="https://images.unsplash.com/photo-1581092160562-40aa08e78837" 
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <PlayCircle className="w-20 h-20 text-white/80 group-hover:text-white transition-colors" />
            </div>
            <div className="absolute bottom-4 left-4 text-white">
              <p className="font-bold">Avant / Après : Voyez la différence</p>
              <p className="text-sm opacity-80">Bâtiment sain, environnement optimisé</p>
            </div>
          </motion.div>
          <div className="lg:col-span-2" id="contact-form">
            <DeshumidificateurForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

