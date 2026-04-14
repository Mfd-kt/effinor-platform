import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBag, Send, Loader2, ArrowLeft, CreditCard, Phone } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import { sanitizeFormData } from '@/utils/sanitize';
import { validateEmail, validateFrenchPhone } from '@/utils/formUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMMANDE_STATUTS } from '@/constants/commandes';
import { stripePromise } from '@/lib/stripeClient';
import { EffinorButton } from '@/components/ds/EffinorButton';

/**
 * Démarre le processus de paiement Stripe Checkout
 * Utilise stripe.redirectToCheckout({ sessionId }) pour la redirection
 * 
 * @param {string} commandeId - ID de la commande
 * @param {Function} toast - Fonction toast pour afficher les erreurs
 */
async function startStripeCheckout(commandeId, toast) {
  try {
    // Appel à l'Edge Function
    const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
      body: { commande_id: commandeId },
    });

    if (error) {
      logger.error('Erreur Edge Function create-stripe-checkout', { error });
      toast({
        title: 'Erreur de paiement',
        description: "Impossible de contacter le serveur de paiement. Merci de réessayer ou de nous contacter.",
        variant: 'destructive',
      });
      return;
    }

    const sessionId = data?.sessionId;

    if (!sessionId) {
      logger.error('sessionId manquant dans la réponse Stripe', { data });
      toast({
        title: 'Erreur de paiement',
        description: "Impossible d'obtenir l'ID de session de paiement. Merci de réessayer ou de nous contacter.",
        variant: 'destructive',
      });
      return;
    }

    if (!stripePromise) {
      logger.error('stripePromise null ou non initialisé');
      toast({
        title: 'Erreur de paiement',
        description: "Le système de paiement n'est pas correctement configuré. Merci de nous contacter.",
        variant: 'destructive',
      });
      return;
    }

    // Initialiser Stripe et rediriger
    const stripe = await stripePromise;

    if (!stripe) {
      logger.error('Échec de l\'initialisation de Stripe.js');
      toast({
        title: 'Erreur de paiement',
        description: "Le système de paiement n'est pas correctement configuré. Merci de nous contacter.",
        variant: 'destructive',
      });
      return;
    }

    const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

    if (stripeError) {
      logger.error('Erreur Stripe Checkout', { stripeError });
      toast({
        title: 'Erreur de paiement',
        description: "Redirection vers la page de paiement impossible. Merci de réessayer ou de nous contacter.",
        variant: 'destructive',
      });
    }

  } catch (err) {
    logger.error('Exception inattendue dans startStripeCheckout', { err });
    toast({
      title: 'Erreur de paiement',
      description: "Erreur inattendue lors du paiement. Merci de réessayer ou de nous contacter.",
      variant: 'destructive',
    });
  }
}

const Cart = () => {
  const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  const { cart, updateQuantity, removeFromCart, clearCart, getTotalPrice } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitMode, setSubmitMode] = useState(null);
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      phone: '',
      company: '',
      siret: '',
      adresseLigne1: '',
      adresseLigne2: '',
      postalCode: '',
      city: '',
      typeBatiment: '',
      message: '',
      billingDifferent: false,
      facturationNom: '',
      facturationRaisonSociale: '',
      facturationAdresseLigne1: '',
      facturationAdresseLigne2: '',
      facturationPostalCode: '',
      facturationVille: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      // Gérer les checkboxes (billingDifferent)
      const fieldValue = type === 'checkbox' ? checked : value;
      setFormData(prev => ({ ...prev, [name]: fieldValue }));
      if (errors[name]) {
          setErrors(prev => ({ ...prev, [name]: null }));
      }
  };

  const handleSelectChange = (name, value) => {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) {
          setErrors(prev => ({ ...prev, [name]: null }));
      }
  };

  const validateForm = () => {
    const newErrors = {};

    // Nom complet (obligatoire)
    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis.";
    }

    // Raison sociale (obligatoire)
    if (!formData.company.trim()) {
      newErrors.company = "La raison sociale est requise.";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis.";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Format d'email invalide.";
    }

    // Téléphone
    if (!formData.phone.trim()) {
      newErrors.phone = "Le téléphone est requis.";
    } else if (!validateFrenchPhone(formData.phone)) {
      newErrors.phone = "Format de téléphone invalide.";
    }

    // Adresse ligne 1 (obligatoire)
    if (!formData.adresseLigne1.trim()) {
      newErrors.adresseLigne1 = "L'adresse (numéro et rue) est requise.";
    } else if (formData.adresseLigne1.trim().length < 5) {
      newErrors.adresseLigne1 = "L'adresse semble trop courte.";
    }

    // Code postal (5 chiffres)
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = "Le code postal est requis.";
    } else if (!/^\d{5}$/.test(formData.postalCode.trim())) {
      newErrors.postalCode = "Le code postal doit contenir 5 chiffres.";
    }

    // Ville (obligatoire)
    if (!formData.city.trim()) {
      newErrors.city = "La ville est requise.";
    }

    // Type de bâtiment (obligatoire)
    if (!formData.typeBatiment.trim()) {
      newErrors.typeBatiment = "Le type de bâtiment est requis.";
    }

    // Validation adresse de facturation (si différente)
    if (formData.billingDifferent) {
      // Nom de contact facturation
      if (!formData.facturationNom.trim()) {
        newErrors.facturationNom = "Le nom de contact pour la facturation est requis.";
      }

      // Adresse facturation ligne 1
      if (!formData.facturationAdresseLigne1.trim()) {
        newErrors.facturationAdresseLigne1 = "L'adresse de facturation (numéro et rue) est requise.";
      } else if (formData.facturationAdresseLigne1.trim().length < 5) {
        newErrors.facturationAdresseLigne1 = "L'adresse de facturation semble trop courte.";
      }

      // Code postal facturation
      if (!formData.facturationPostalCode.trim()) {
        newErrors.facturationPostalCode = "Le code postal de facturation est requis.";
      } else if (!/^\d{5}$/.test(formData.facturationPostalCode.trim())) {
        newErrors.facturationPostalCode = "Le code postal de facturation doit contenir 5 chiffres.";
      }

      // Ville facturation
      if (!formData.facturationVille.trim()) {
        newErrors.facturationVille = "La ville de facturation est requise.";
      } else if (formData.facturationVille.trim().length < 2) {
        newErrors.facturationVille = "La ville de facturation doit contenir au moins 2 caractères.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (mode) => {
    setSubmitMode(mode);
    
    // Validation formulaire
    const isValid = validateForm();
    if (!isValid) {
      toast({ 
        title: "Erreur de validation", 
        description: "Veuillez remplir tous les champs obligatoires.", 
        variant: "destructive" 
      });
      setSubmitMode(null);
      return;
    }
    
    if (cart.length === 0) {
      toast({ title: "Panier vide", description: "Ajoutez des produits avant de valider.", variant: "destructive" });
      setSubmitMode(null);
      return;
    }

    setIsSubmitting(true);
    try {

      // Calcul des totaux panier (HT) et nombre d'articles
      const totalHt = cart.reduce((sum, item) => {
        if (!item.prix || item.sur_devis || item.prix === 0) return sum;
        const price = parseFloat(item.prix) || 0;
        if (isNaN(price)) {
          return sum;
        }
        return sum + price * (item.quantity || 1);
      }, 0);

      const nbArticles = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

      // Génération d'une référence commande de type CMD-YYYYMMDD-XXXX
      const now = new Date();
      const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(Math.random() * 9000) + 1000; // 4 chiffres
      const reference = `CMD-${ymd}-${rand}`;

      // Meta techniques (facultatives)
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : null;
      const currentUrl = typeof window !== 'undefined' ? window.location.href : null;

      // Construction de l'adresse de facturation
      const billingAddress = formData.billingDifferent
        ? {
            nom_client: formData.facturationNom.trim(),
            raison_sociale: (formData.facturationRaisonSociale || formData.company || '').trim(),
            adresse_ligne1: formData.facturationAdresseLigne1.trim(),
            adresse_ligne2: formData.facturationAdresseLigne2?.trim() || null,
            code_postal: formData.facturationPostalCode.trim(),
            ville: formData.facturationVille.trim(),
            pays: 'France',
          }
        : {
            nom_client: formData.name.trim(),
            raison_sociale: (formData.company || '').trim(),
            adresse_ligne1: formData.adresseLigne1.trim(),
            adresse_ligne2: formData.adresseLigne2?.trim() || null,
            code_postal: formData.postalCode.trim(),
            ville: formData.city.trim(),
            pays: 'France',
          };

      // Sanitize form data before insertion
      const orderDataToInsert = {
        // Champs contact & société
        nom_client: formData.name.trim(),
        raison_sociale: formData.company.trim(),
        siret: formData.siret ? formData.siret.replace(/\s/g, '') : null,
        email: formData.email.trim(),
        telephone: formData.phone.trim(),
        code_postal: formData.postalCode.trim(),
        ville: formData.city.trim(),
        type_batiment: formData.typeBatiment.trim(),
        commentaire: formData.message || null,
        adresse_ligne1: formData.adresseLigne1.trim(),
        adresse_ligne2: formData.adresseLigne2?.trim() || null,
        pays: 'France',

        // Adresse de facturation
        adresse_facturation_diff: formData.billingDifferent,
        facturation_nom_client: billingAddress.nom_client,
        facturation_raison_sociale: billingAddress.raison_sociale,
        facturation_adresse_ligne1: billingAddress.adresse_ligne1,
        facturation_adresse_ligne2: billingAddress.adresse_ligne2,
        facturation_code_postal: billingAddress.code_postal,
        facturation_ville: billingAddress.ville,
        facturation_pays: billingAddress.pays,

        // Métadonnées panier / source
        reference,
        statut: COMMANDE_STATUTS.NOUVELLE,
        source: 'site_ecommerce',
        
        // Nouveaux champs e-commerce
        type_commande: 'commande',
        mode_suivi: mode === 'stripe' ? 'paiement_en_ligne' : 'rappel',
        paiement_statut: 'en_attente',

        // Totaux & stats
        total_ht: totalHt > 0 ? parseFloat(totalHt.toFixed(2)) : null,
        total_ttc: totalHt > 0 ? parseFloat((totalHt * 1.2).toFixed(2)) : null,
        nb_articles: nbArticles || null,

        // Snapshot produits (pour compatibilité & analyse côté JSON)
        produits: cart.map(item => ({ 
          id: item.id, 
          nom: item.nom, 
          reference: item.reference || null,
          marque: item.marque || null,
          usage: item.usage || null,
          quantite: item.quantity 
        })),

        // Meta avec snapshot adresse de facturation
        meta: {
          userAgent,
          url: currentUrl,
          adresse_postale: {
            adresse_ligne1: formData.adresseLigne1.trim(),
            adresse_ligne2: formData.adresseLigne2?.trim() || null,
            code_postal: formData.postalCode.trim(),
            ville: formData.city.trim(),
            pays: 'France',
          },
          adresse_facturation: {
            different: formData.billingDifferent,
            ...billingAddress,
          },
        },
      };
      const sanitizedOrderData = sanitizeFormData(orderDataToInsert);
      
      const { data: orderData, error: orderError } = await supabase
        .from('commandes')
        .insert([sanitizedOrderData])
        .select('id, reference, total_ht, total_ttc')
        .single();
      
      if (orderError) {
        logger.error('Erreur lors de la création de la commande', { error: orderError });
        toast({
          title: "Erreur lors de la création de la commande",
          description: orderError.message || "Une erreur est survenue. Veuillez réessayer.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        setSubmitMode(null);
        return;
      }
      
      // TODO: corriger la RLS sur commandes_lignes côté Supabase.
      // Pour l'instant, on ne bloque pas le flux de commande car les produits sont déjà
      // enregistrés dans commandes.produits (snapshot JSON).
      // Create order lines in commandes_lignes table (non-bloquant si RLS échoue)
      if (orderData && orderData.id) {
        try {
          const lineInserts = cart.map(item => {
            const unitPriceHt = Number(item.prix ?? 0);
            const lineTotalHt = Number(unitPriceHt * (item.quantity || 1));
            return {
              commande_id: orderData.id,
              produit_id: item.id, // Nom de colonne dans la base de données
              quantite: item.quantity,
              prix_unitaire_ht: unitPriceHt,
              total_ligne_ht: lineTotalHt,
              meta: {
                nom: item.nom ?? item.name ?? null,
                reference: item.reference ?? null,
                marque: item.marque ?? null,
                usage: item.usage ?? null,
              },
            };
          });
          
          const { error: linesError } = await supabase
            .from('commandes_lignes')
            .insert(lineInserts);
          
          if (linesError) {
            // Gérer l'erreur RLS (code 42501) de façon non-bloquante
            if (linesError.code === '42501' || linesError.code === 'PGRST301') {
              // On continue : les produits sont déjà dans commandes.produits
            } else {
              logger.error('Erreur inattendue lors de l\'insert commandes_lignes', { 
                error: linesError,
                code: linesError.code,
                orderId: orderData.id 
              });
            }
          }
        } catch (err) {
          logger.error('Exception lors de l\'insert commandes_lignes', { 
            error: err,
            message: err.message,
            orderId: orderData.id 
          });
          // NE PAS throw : on continue le flux même en cas d'exception
          // Les produits sont déjà en snapshot JSON dans commandes.produits
        }
      }

      const orderId = orderData.id;

      // Gérer le mode de paiement
      if (mode === 'stripe') {
        // Vérifier que le total TTC est valide pour Stripe
        const finalTotalTtc = orderData.total_ttc || (totalHt > 0 ? parseFloat((totalHt * 1.2).toFixed(2)) : 0);
        
        if (!finalTotalTtc || finalTotalTtc <= 0) {
          logger.error('Total TTC invalide pour Stripe', { finalTotalTtc, orderData });
          toast({ 
            title: "Erreur", 
            description: "Le montant de la commande doit être supérieur à 0 pour le paiement en ligne.", 
            variant: "destructive" 
          });
          setIsSubmitting(false);
          setSubmitMode(null);
          return;
        }

        // Démarrer le processus Stripe Checkout
        await startStripeCheckout(orderId, toast);
        
        // Si on arrive ici, il y a eu une erreur (gérée dans startStripeCheckout)
        setIsSubmitting(false);
        setSubmitMode(null);
        return;
      }

      // Mode rappel : continuer avec le flux normal
      // Best-effort: notifier n8n du nouvel événement commande
      if (n8nWebhookUrl && orderId) {
        try {
          await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'nouvelle_commande',
              commande: {
                id: orderId,
                reference: orderData.reference || reference,
                raison_sociale: sanitizedOrderData.raison_sociale,
                nom_client: sanitizedOrderData.nom_client,
                email: sanitizedOrderData.email,
                telephone: sanitizedOrderData.telephone,
                code_postal: sanitizedOrderData.code_postal,
                ville: sanitizedOrderData.ville,
                type_batiment: sanitizedOrderData.type_batiment,
                total_ht: sanitizedOrderData.total_ht,
                total_ttc: sanitizedOrderData.total_ttc,
                nb_articles: sanitizedOrderData.nb_articles,
                source: sanitizedOrderData.source,
                statut: sanitizedOrderData.statut,
              },
            }),
          });
        } catch (webhookError) {
          logger.error('Error calling n8n webhook for new order:', webhookError);
          // Ne bloque pas l'utilisateur si le webhook échoue
        }
      }
      
      // Message différent selon le mode
      if (mode === 'rappel') {
        toast({ 
          title: "✅ Commande enregistrée !", 
          description: "Merci ! Un expert va vous rappeler pour finaliser votre commande." 
        });
      }

      // Clear cart and form
      clearCart();
      setFormData({ 
        name: '',
        email: '',
        phone: '',
        company: '',
        siret: '',
        adresseLigne1: '',
        adresseLigne2: '',
        postalCode: '',
        city: '',
        typeBatiment: '',
        message: '',
        billingDifferent: false,
        facturationNom: '',
        facturationRaisonSociale: '',
        facturationAdresseLigne1: '',
        facturationAdresseLigne2: '',
        facturationPostalCode: '',
        facturationVille: ''
      });

      // Redirect to thank you page after short delay (uniquement pour mode rappel)
      if (mode === 'rappel') {
        setTimeout(() => {
          const adressePostale = `${formData.adresseLigne1}${formData.adresseLigne2 ? '\n' + formData.adresseLigne2 : ''}\n${formData.postalCode} ${formData.city}\nFrance`;
          navigate('/merci', { 
            state: { 
              orderId: orderId,
              companyName: formData.company || formData.name,
              orderType: 'commande_rappel',
              reference: orderData.reference || reference,
              adressePostale,
            } 
          });
        }, 1500);
      }

    } catch (error) {
      logger.error('Error submitting order:', error);
      toast({ 
        title: "Erreur lors de l'envoi", 
        description: `Une erreur est survenue : ${error.message}`, 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
      setSubmitMode(null);
    }
  };

  if (cart.length === 0) {
    return (
      <>
        <Helmet><title>Mon Panier | EFFINOR</title></Helmet>
        <div className="container mx-auto py-12 pt-32 text-center">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4">Votre panier est vide</h1>
            <p className="text-gray-600 mb-8">Découvrez nos solutions LED professionnelles</p>
            <EffinorButton to="/produits-solutions" variant="primary">
              Découvrir nos produits
            </EffinorButton>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Mon Panier | EFFINOR</title></Helmet>
      {/* Hero Section - Full Width Background */}
      <div className="w-full bg-primary-900 bg-dark-section py-12 pt-32">
        <div className="container mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-5xl font-bold mb-4">Mon Panier</h1>
          <p className="text-xl text-white/90">Finalisez votre demande de devis</p>
        </div>
      </div>
      {/* Main Content */}
      <div className="container mx-auto py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Produits sélectionnés</h2>
                <Link to="/produits-solutions" className="flex items-center gap-2 text-sm text-secondary-600 hover:text-secondary-700 font-medium">
                  <ArrowLeft className="h-4 w-4" />
                  Continuer mes achats
                </Link>
              </div>
              <div className="space-y-4">
                {cart.map((item) => (
                  <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 p-4 border rounded-lg">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img alt={item.nom} className="w-full h-full object-cover" src={item.image_url || "https://images.unsplash.com/photo-1669784589815-bf71646b7bc7"} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.nom}</h3>
                      {(item.marque || item.reference) && (
                        <p className="text-xs text-gray-600 mb-1">
                          {item.marque && <span className="font-medium">{item.marque}</span>}
                          {item.marque && item.reference && <span className="mx-1 text-gray-400">•</span>}
                          {item.reference && <span className="text-gray-500">Réf. {item.reference}</span>}
                        </p>
                      )}
                      {item.usage && (
                        <p className="text-xs text-gray-500 mb-2">
                          Usage: <span className="font-medium capitalize">{item.usage}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border rounded-lg">
                          <button className="btn-ghost" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></button>
                          <span className="w-12 text-center text-sm font-semibold">{item.quantity}</span>
                          <button className="btn-ghost" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></button>
                        </div>
                        <button className="btn-ghost text-error" onClick={() => removeFromCart(item.id)}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.prix === 0 || item.sur_devis ? (
                        <span className="font-bold text-secondary-700">Sur demande</span>
                      ) : (
                        <div className="space-y-1">
                          <div className="font-bold text-secondary-700">
                            {(item.prix * item.quantity).toFixed(2)} € HT
                          </div>
                          <div className="text-sm text-gray-600">
                            {(item.prix * item.quantity * 1.2).toFixed(2)} € TTC
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-6">Vos informations</h2>
              <form onSubmit={(e) => { e.preventDefault(); }}>
                <div className={`form-field ${errors.name ? 'error' : ''}`}>
                  <label htmlFor="name">Nom complet *</label>
                  <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} placeholder="Jean Dupont"/>
                   {errors.name && <span className="error-message">{errors.name}</span>}
                </div>
                <div className={`form-field ${errors.company ? 'error' : ''}`}>
                  <label htmlFor="company">Raison sociale *</label>
                  <input type="text" id="company" name="company" required value={formData.company} onChange={handleChange} placeholder="Nom de votre entreprise"/>
                  {errors.company && <span className="error-message">{errors.company}</span>}
                </div>
                <div className={`form-field ${errors.siret ? 'error' : ''}`}>
                  <label htmlFor="siret">SIRET (optionnel)</label>
                  <input 
                    type="text" 
                    id="siret" 
                    name="siret" 
                    value={formData.siret} 
                    onChange={handleChange} 
                    placeholder="14 chiffres (ex: 12345678901234)"
                    maxLength="14"
                  />
                  {errors.siret && <span className="error-message">{errors.siret}</span>}
                </div>
                <div className={`form-field ${errors.email ? 'error' : ''}`}>
                  <label htmlFor="email">Email *</label>
                  <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} placeholder="jean.dupont@exemple.fr"/>
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                <div className={`form-field ${errors.phone ? 'error' : ''}`}>
                  <label htmlFor="phone">Téléphone *</label>
                  <input type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleChange} placeholder="06 12 34 56 78"/>
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
                <div className={`form-field ${errors.adresseLigne1 ? 'error' : ''}`}>
                  <label htmlFor="adresseLigne1">Adresse (numéro et rue) *</label>
                  <input
                    type="text"
                    id="adresseLigne1"
                    name="adresseLigne1"
                    value={formData.adresseLigne1}
                    onChange={handleChange}
                    placeholder="10 Rue de l'Industrie"
                  />
                  {errors.adresseLigne1 && <span className="error-message">{errors.adresseLigne1}</span>}
                </div>
                <div className="form-field">
                  <label htmlFor="adresseLigne2">Complément d'adresse (optionnel)</label>
                  <input
                    type="text"
                    id="adresseLigne2"
                    name="adresseLigne2"
                    value={formData.adresseLigne2}
                    onChange={handleChange}
                    placeholder="Bâtiment B, 2ème étage"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`form-field ${errors.postalCode ? 'error' : ''}`}>
                    <label htmlFor="postalCode">Code postal</label>
                    <input 
                      type="text" 
                      id="postalCode" 
                      name="postalCode" 
                      value={formData.postalCode} 
                      onChange={handleChange} 
                      placeholder="75001"
                      maxLength="5"
                    />
                    {errors.postalCode && <span className="error-message">{errors.postalCode}</span>}
                  </div>
                  <div className="form-field">
                    <label htmlFor="city">Ville</label>
                    <input type="text" id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Paris"/>
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="typeBatiment">Type de bâtiment</label>
                  <Select value={formData.typeBatiment} onValueChange={(value) => handleSelectChange('typeBatiment', value)}>
                    <SelectTrigger 
                      id="typeBatiment"
                      className="w-full h-auto py-3 px-4 border-2 border-gray-300 rounded-lg text-base text-gray-900 bg-white focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/10 focus:outline-none"
                    >
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Industriel">Industriel (usine, atelier, entrepôt)</SelectItem>
                      <SelectItem value="Tertiaire">Tertiaire (bureaux, commerces)</SelectItem>
                      <SelectItem value="Agricole">Agricole (serre, élevage, bâtiment agricole)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-field">
                  <label htmlFor="message">Commentaires / Informations complémentaires</label>
                  <textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Précisez vos besoins, délais souhaités, contraintes particulières..."/>
                </div>

                {/* Bloc adresse de facturation (affiché si billingDifferent === true) */}
                {formData.billingDifferent && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4 mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Adresse de facturation</h3>
                    
                    <div className={`form-field ${errors.facturationNom ? 'error' : ''}`}>
                      <label htmlFor="facturationNom">Nom du contact facturation *</label>
                      <input
                        type="text"
                        id="facturationNom"
                        name="facturationNom"
                        value={formData.facturationNom}
                        onChange={handleChange}
                        placeholder="Nom du contact"
                        required
                      />
                      {errors.facturationNom && <span className="error-message">{errors.facturationNom}</span>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="facturationRaisonSociale">Raison sociale facturation (optionnel)</label>
                      <input
                        type="text"
                        id="facturationRaisonSociale"
                        name="facturationRaisonSociale"
                        value={formData.facturationRaisonSociale}
                        onChange={handleChange}
                        placeholder="Raison sociale (si différente)"
                      />
                    </div>

                    <div className={`form-field ${errors.facturationAdresseLigne1 ? 'error' : ''}`}>
                      <label htmlFor="facturationAdresseLigne1">Adresse (numéro et rue) *</label>
                      <input
                        type="text"
                        id="facturationAdresseLigne1"
                        name="facturationAdresseLigne1"
                        value={formData.facturationAdresseLigne1}
                        onChange={handleChange}
                        placeholder="10 Rue de l'Industrie"
                        required
                      />
                      {errors.facturationAdresseLigne1 && <span className="error-message">{errors.facturationAdresseLigne1}</span>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="facturationAdresseLigne2">Complément d'adresse (optionnel)</label>
                      <input
                        type="text"
                        id="facturationAdresseLigne2"
                        name="facturationAdresseLigne2"
                        value={formData.facturationAdresseLigne2}
                        onChange={handleChange}
                        placeholder="Bâtiment B, 2ème étage"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className={`form-field ${errors.facturationPostalCode ? 'error' : ''}`}>
                        <label htmlFor="facturationPostalCode">Code postal *</label>
                        <input
                          type="text"
                          id="facturationPostalCode"
                          name="facturationPostalCode"
                          value={formData.facturationPostalCode}
                          onChange={handleChange}
                          placeholder="75001"
                          maxLength="5"
                          required
                        />
                        {errors.facturationPostalCode && <span className="error-message">{errors.facturationPostalCode}</span>}
                      </div>
                      <div className={`form-field ${errors.facturationVille ? 'error' : ''}`}>
                        <label htmlFor="facturationVille">Ville *</label>
                        <input
                          type="text"
                          id="facturationVille"
                          name="facturationVille"
                          value={formData.facturationVille}
                          onChange={handleChange}
                          placeholder="Paris"
                          required
                        />
                        {errors.facturationVille && <span className="error-message">{errors.facturationVille}</span>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Checkbox adresse de facturation différente */}
                <div className="form-field">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="billingDifferent"
                      checked={formData.billingDifferent}
                      onChange={handleChange}
                      className="w-4 h-4 text-secondary-600 border-gray-300 rounded focus:ring-secondary-500"
                    />
                    <span>Adresse de facturation différente ?</span>
                  </label>
                </div>

                {/* Boutons d'action */}
                <div className="form-field space-y-3">
                  <EffinorButton
                    type="button"
                    variant="primary"
                    fullWidth
                    onClick={() => handleSubmit('stripe')}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && submitMode === 'stripe' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        Payer maintenant par carte
                      </>
                    )}
                  </EffinorButton>

                  <EffinorButton
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => handleSubmit('rappel')}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && submitMode === 'rappel' ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Traitement en cours...
                      </>
                    ) : (
                      <>
                        <Phone className="h-5 w-5" />
                        Être rappelé par un expert
                      </>
                    )}
                  </EffinorButton>
                </div>
              </form>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Récapitulatif</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nombre d'articles</span>
                  <span className="font-semibold">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                </div>
                {getTotalPrice() > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total indicatif HT</span>
                      <span className="font-semibold">{getTotalPrice().toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TVA (20%)</span>
                      <span className="font-semibold">{(getTotalPrice() * 0.2).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total indicatif TTC</span>
                      <span className="font-semibold text-secondary-700">{(getTotalPrice() * 1.2).toFixed(2)} €</span>
                    </div>
                  </>
                )}
              </div>
              <div className="bg-secondary-50 border border-secondary-200 rounded-lg w-full text-center p-3 mb-6">
                <p className="text-secondary-700 font-medium">💡 Livraison rapide et support technique inclus</p>
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <p>✓ Devis personnalisé sous 24h</p>
                <p>✓ Étude photométrique gratuite</p>
                <p>✓ Support technique et accompagnement projet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;/*
 * ========================================
 * TESTS À EFFECTUER
 * ========================================
 * 
 * Scénario 1 : Paiement en ligne (Stripe)
 * ----------------------------------------
 * 1. Ajouter 1 produit au panier
 * 2. Remplir le formulaire avec des données valides
 * 3. Cliquer sur "Payer maintenant par carte"
 * 
 * Attendu :
 * - Validation du formulaire réussie
 * - Création de la commande dans `public.commandes` avec :
 *   - `type_commande = 'commande'`
 *   - `mode_suivi = 'paiement_en_ligne'`
 *   - `paiement_statut = 'en_attente'`
 * - Création des lignes dans `public.commandes_lignes`
 * - Appel Edge Function `create-stripe-checkout` réussi
 * - Edge Function retourne un `sessionId`
 * - Initialisation de Stripe.js réussie
 * - Redirection vers Stripe Checkout avec `redirectToCheckout({ sessionId })`
 * - Page de paiement Stripe s'affiche sans erreur "apiKey is not set"
 * 
 * 
 * Scénario 2 : Annulation Stripe
 * -------------------------------
 * 1. Suivre le scénario 1 jusqu'à la page Stripe Checkout
 * 2. Depuis Stripe, cliquer sur "Annuler" / "Retourner au site"
 * 
 * Attendu :
 * - Redirection vers `/paiement/annulee?commande_id=XXX`
 * - Page `PaymentCancel.jsx` s'affiche avec message clair
 * - Bouton "Retour au panier" fonctionne
 * - Bouton "Être rappelé" redirige vers `/contact`
 * 
 * 
 * Scénario 3 : Succès paiement Stripe
 * ------------------------------------
 * 1. Suivre le scénario 1 jusqu'à la page Stripe Checkout
 * 2. Utiliser une carte de test Stripe (ex: 4242 4242 4242 4242, date future, CVC 123)
 * 3. Valider le paiement
 * 
 * Attendu :
 * - Redirection vers `/paiement/succes?session_id=cs_test_...`
 * - Page `PaymentSuccess.jsx` s'affiche avec message de succès
 * - Référence de paiement (sessionId) affichée
 * - Bouton "Voir la boutique" fonctionne
 * - Dans Supabase, la commande a :
 *   - `stripe_session_id` rempli
 *   - `paiement_statut` mis à jour via webhook (plus tard)
 * 
 * 
 * Scénario 4 : Être rappelé par un expert
 * ----------------------------------------
 * 1. Ajouter des produits au panier
 * 2. Remplir le formulaire
 * 3. Cliquer sur "Être rappelé par un expert"
 * 
 * Attendu :
 * - Validation du formulaire réussie
 * - Création de la commande avec :
 *   - `type_commande = 'commande'`
 *   - `mode_suivi = 'rappel'`
 *   - `paiement_statut = 'en_attente'`
 * - Création des lignes dans `public.commandes_lignes`
 * - Notification n8n envoyée (si webhook configuré)
 * - Redirection vers `/merci` avec message indiquant qu'un expert va appeler
 * - Pas d'appel Stripe (pas de création de session)
 * 
 * 
 * Scénario 5 : Erreurs
 * ---------------------
 * 1. Tester avec panier vide → Message d'erreur
 * 2. Tester avec formulaire incomplet → Messages d'erreur par champ
 * 3. Tester avec `VITE_STRIPE_PUBLIC_KEY` absente → Message explicite
 * 4. Tester avec total = 0 → Message d'erreur pour paiement Stripe
 * 
 * 
 * Points de vérification supplémentaires :
 * -----------------------------------------
 * - Logs dans la console : tous utilisent `logger` (pas de `console.log` brut)
 * - Erreurs affichées via `toast` avec messages clairs en français
 * - URLs de callback Stripe alignées entre Edge Function et routes React Router
 * - Client Stripe centralisé (`stripeClient.js`) utilisé partout
 */

// ====================================================================
// TESTS MANUELS STRIPE
// ====================================================================
/*
 * Checklist de tests à réaliser après déploiement :
 * 
 * [ ] Cas 1 : Paiement par carte réussi
 *     - Panier rempli avec plusieurs produits
 *     - Formulaire rempli correctement
 *     - Clic sur "Payer maintenant par carte"
 *     - Vérifier : redirection vers Stripe Checkout OK
 *     - Vérifier : session visible dans Stripe Dashboard
 *     - Vérifier : commande créée dans public.commandes avec stripe_session_id
 * 
 * [ ] Cas 2 : Erreur volontaire sur STRIPE_SECRET_KEY
 *     - Modifier temporairement STRIPE_SECRET_KEY avec une mauvaise clé
 *     - Tenter un paiement
 *     - Vérifier : Edge Function renvoie erreur 500
 *     - Vérifier : Toast "Erreur de paiement" affiché côté front
 * 
 * [ ] Cas 3 : RLS toujours active sur commandes_lignes
 *     - S'assurer que la politique RLS bloque toujours les inserts anonymes
 *     - Tenter un paiement
 *     - Vérifier : Warning dans console pour commandes_lignes (403)
 *     - Vérifier : Paiement continue malgré le 403
 *     - Vérifier : Commande créée dans public.commandes
 *     - Vérifier : Session Stripe créée et redirection OK
 *     - Vérifier : Produits disponibles dans commandes.produits (snapshot JSON)
 * 
 * [ ] Cas 4 : Mode "Être rappelé par un expert"
 *     - Panier rempli
 *     - Formulaire rempli
 *     - Clic sur "Être rappelé par un expert"
 *     - Vérifier : Aucun appel à l'Edge Function create-stripe-checkout
 *     - Vérifier : Commande créée avec mode_suivi = 'rappel'
 *     - Vérifier : Redirection vers /merci avec message approprié
 *     - Vérifier : Webhook n8n appelé (si configuré)
 */

