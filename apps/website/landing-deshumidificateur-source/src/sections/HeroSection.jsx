import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PlayCircle, Euro } from 'lucide-react';

// 🆕 CONFIGURATION MAKE.COM (remplace N8N)
const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/rg84halucxy8kolf6ur1wi9uydeqsmil';
const REDIRECT_URL = 'https://formulaire.groupe-effinor.fr/';

// Configuration Web3Forms - Email de secours TOUJOURS actif
const WEB3FORMS_ACCESS_KEY = '5e19aa32-226b-4798-9027-b0bef7c66478';
const BACKUP_EMAIL = 'leads.effinor@gmail.com';

const SimplifiedContactForm = ({ scrollToSection }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // EMAIL DE SECOURS (toujours envoyé)
  const sendEmailNotification = async (data, webhookStatus) => {
    try {
      console.log('📧 Envoi email de secours...');

      const statusEmoji = webhookStatus === 'success' ? '✅' : '🚨';
      const statusText = webhookStatus === 'success'
        ? 'Lead enregistré avec succès dans Airtable via Make.com'
        : 'ATTENTION : Make.com webhook a échoué - Lead NON enregistré dans Airtable';

      const emailBody = `
${statusEmoji} NOUVEAU LEAD - DÉSHUMIDIFICATEUR SERRE

${webhookStatus === 'success' ? '' : '⚠️⚠️⚠️ ALERTE : CE LEAD N\'EST PAS DANS AIRTABLE ⚠️⚠️⚠️\n'}
═══════════════════════════════════════
📋 INFORMATIONS DE CONTACT
═══════════════════════════════════════

👤 Nom/Prénom   : ${data.nom_prenom}
📧 Email        : ${data.email}
📞 Téléphone    : ${data.telephone}

═══════════════════════════════════════
ℹ️ INFORMATIONS COMPLÉMENTAIRES
═══════════════════════════════════════

🌐 Source : ${data.landing}
🕐 Date   : ${data.timestamp}

═══════════════════════════════════════
📊 STATUT MAKE.COM
═══════════════════════════════════════

${statusText}

${webhookStatus === 'success'
          ? '✅ Ce lead a été correctement enregistré.\n✅ Email de bienvenue Déshumidificateur envoyé au client.\n\nCet email est votre notification de contrôle.'
          : '🚨 Ce lead N\'A PAS été enregistré dans Airtable.\n⚠️ VOUS DEVEZ LE CRÉER MANUELLEMENT.\n\n⚠️ Vérifiez Make.com et corrigez le problème.'}
      `;

      const subjectPrefix = webhookStatus === 'success' ? '✅' : '🚨 [ÉCHEC]';

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: `${subjectPrefix} Lead Déshumidificateur - ${data.nom_prenom}`,
          from_name: 'Landing Déshumidificateur Effinor',
          email: BACKUP_EMAIL,
          message: emailBody,
          'Nom': data.nom_prenom,
          'Email': data.email,
          'Téléphone': data.telephone,
          'Landing': data.landing,
          'Statut Webhook': webhookStatus === 'success' ? 'OK' : 'ÉCHEC'
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Email de secours envoyé');
        return true;
      } else {
        console.error('❌ Erreur Web3Forms:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ Échec email secours:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast({ 
        variant: 'destructive', 
        title: 'Champs requis', 
        description: 'Veuillez remplir tous les champs.' 
      });
      return;
    }

    setIsSubmitting(true);

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'form_submit_start', {
        'event_category': 'form_deshumidificateur',
        'event_label': 'eligibilite'
      });
    }

    const submissionData = {
      nom_prenom: formData.name,
      email: formData.email,
      telephone: formData.phone,
      landing: "landing_deshumidificateur",
      timestamp: new Date().toISOString()
    };

    console.log('📤 Données à envoyer:', submissionData);

    let webhookSuccess = false;

    // 🆕 ENVOI À MAKE.COM (avec proxy CORS si nécessaire)
    try {
      console.log('📤 Envoi à Make.com...');

      // Essai direct d'abord
      let response;
      try {
        response = await fetch(MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData)
        });
      } catch (corsError) {
        // Si CORS bloque, utiliser un proxy
        console.warn('⚠️ CORS détecté, utilisation du proxy...');
        const PROXY_URL = 'https://corsproxy.io/?' + encodeURIComponent(MAKE_WEBHOOK_URL);
        response = await fetch(PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData)
        });
      }

      console.log('📨 Réponse Make.com:', response.status);

      if (response.ok || response.status === 200) {
        console.log('✅ Make.com WEBHOOK SUCCESS !');
        webhookSuccess = true;

        if (typeof window.gtag === 'function') {
          window.gtag('event', 'form_submit_success', {
            'event_category': 'form_deshumidificateur',
            'event_label': 'eligibilite',
            'method': 'makecom'
          });
        }
      } else {
        console.error('❌ Make.com erreur:', response.status);
        throw new Error(`Make.com ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erreur Make.com:', error);
      webhookSuccess = false;

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'form_submit_webhook_error', {
          'event_category': 'form_deshumidificateur',
          'event_label': 'eligibilite',
          'error_type': error.name || 'unknown'
        });
      }
    }

    // EMAIL DE SECOURS (toujours envoyé)
    console.log('📧 Envoi email de secours...');
    const emailSent = await sendEmailNotification(
      submissionData,
      webhookSuccess ? 'success' : 'error'
    );

    if (emailSent) {
      console.log('✅ Email de secours envoyé');
    } else {
      console.warn('⚠️ Email de secours échoué');
    }

    // Afficher le résultat
    if (webhookSuccess || emailSent) {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'conversion', {
          'send_to': 'AW-XXXXX/XXXXX',
          'value': 1.0,
          'currency': 'EUR'
        });
      }

      toast({ 
        title: "✅ Merci pour votre confiance !", 
        description: "Votre demande a été envoyée avec succès. Un expert va vous recontacter sous 24h pour confirmer votre éligibilité." 
      });

      setFormData({ name: '', email: '', phone: '' });

      // Pas de redirection - Message de remerciement dans le toast suffit

    } else {
      console.error('❌ ÉCHEC TOTAL : Make.com ET Email');

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'form_submit_total_failure', {
          'event_category': 'form_deshumidificateur',
          'event_label': 'eligibilite'
        });
      }

      toast({ 
        variant: 'destructive', 
        title: '❌ Erreur', 
        description: "L'envoi a échoué. Veuillez réessayer." 
      });
    }

    setIsSubmitting(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.7, delay: 0.2 }}
      className="bg-white dark:bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700"
    >
      <h3 className="text-xl sm:text-2xl font-bold text-center mb-4 gradient-text">Vérifiez votre éligibilité</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Nom</Label>
          <Input 
            id="name" 
            name="name" 
            type="text" 
            placeholder="Jean Dupont" 
            required 
            value={formData.name} 
            onChange={handleChange} 
          />
        </div>
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="votre@email.com" 
            required 
            value={formData.email} 
            onChange={handleChange} 
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Téléphone</Label>
          <Input 
            id="phone" 
            name="phone" 
            type="tel" 
            placeholder="06 12 34 56 78" 
            required 
            value={formData.phone} 
            onChange={handleChange} 
          />
        </div>
        <Button type="submit" size="lg" className="w-full font-bold text-lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="animate-spin" />
          ) : (
            <>
              <Euro className="w-5 h-5 mr-2" /> 
              Vérifier mon éligibilité gratuite
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

const HeroSection = ({ scrollToSection }) => {
  return (
    <section id="hero" className="relative py-20 md:py-28 bg-slate-100 dark:bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-10">
        <img className="w-full h-full object-cover" alt="Arrière-plan d'une serre agricole luxuriante et moderne sous un beau soleil" src="https://images.unsplash.com/photo-1551704539-fb72c5f3d920" />
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
            Votre serre mérite mieux : <span className="gradient-text">Déshumidificateur thermodynamique 100% financé</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8"
          >
            Grâce aux primes CEE, votre installation est entièrement prise en charge. Boostez vos récoltes, sans sortir le moindre centime.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex justify-center"
          >
            <Button size="lg" onClick={() => scrollToSection('contact-form')} className="text-lg font-bold">
              Je Vérifie Mon Éligibilité Gratuite
            </Button>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8 mt-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.7, delay: 0.5 }}
            className="lg:col-span-3 relative aspect-video rounded-xl shadow-2xl overflow-hidden group cursor-pointer"
          >
            <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="Déshumidificateur thermodynamique en fonctionnement dans une serre" src="https://images.unsplash.com/photo-1680252401364-7f12444ee032" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <PlayCircle className="w-20 h-20 text-white/80 group-hover:text-white transition-colors" />
            </div>
            <div className="absolute bottom-4 left-4 text-white">
              <p className="font-bold">Avant / Après : Voyez la différence</p>
              <p className="text-sm opacity-80">Serre saine, sans rien payer</p>
            </div>
          </motion.div>
          <div className="lg:col-span-2" id="contact-form">
            <SimplifiedContactForm scrollToSection={scrollToSection} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;