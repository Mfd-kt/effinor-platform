import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useCart } from '@/contexts/CartContext';
import { logger } from '@/utils/logger';
import { Badge } from '@/components/ui/badge';

// URL du webhook n8n pour l'envoi d'email de confirmation
const N8N_WEBHOOK_URL = "https://n8n.srv792550.hstgr.cloud/webhook/476adfbe-a4ae-4ac2-83bc-e6e5e5e3b30c";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const cartClearedRef = useRef(false);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupération des paramètres URL
  const commandeId = searchParams.get('commande_id');
  const ref = searchParams.get('ref');

  // Fonction de formatage de date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return '-';
    }
  };

  // Fonction de formatage de prix
  const formatPrice = (price) => {
    if (!price && price !== 0) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(price));
  };

  // Badge de statut de paiement
  const getPaymentStatusBadge = (paiementStatut) => {
    const statusMap = {
      'payee': { label: 'Payée', className: 'bg-green-100 text-green-800' },
      'en_attente': { label: 'En attente de confirmation', className: 'bg-orange-100 text-orange-800' },
      'echouee': { label: 'Échouée', className: 'bg-red-100 text-red-800' },
      'annulee': { label: 'Annulée', className: 'bg-red-100 text-red-800' },
      'remboursee': { label: 'Remboursée', className: 'bg-gray-100 text-gray-800' },
    };

    const status = statusMap[paiementStatut] || { 
      label: paiementStatut || 'En attente', 
      className: 'bg-gray-100 text-gray-800' 
    };
    
    return <Badge className={status.className}>{status.label}</Badge>;
  };

  // Fonction pour charger la commande
  const fetchOrder = async (id, reference) => {
    try {
      let query = supabase.from('commandes').select('*');
      
      // Priorité 1 : chercher par ID si disponible
      if (id) {
        query = query.eq('id', id);
      }
      // Priorité 2 : chercher par référence
      else if (reference && reference.trim() !== '') {
        query = query.eq('reference', reference.trim());
      } else {
        throw new Error('Aucun identifiant de commande fourni');
      }

      const { data, error: fetchError } = await query.single();

      if (fetchError || !data) {
        logger.error('[PaymentSuccess] Commande non trouvée', { id, reference, error: fetchError });
        throw new Error('Commande introuvable');
      }

      logger.info('[PaymentSuccess] Commande trouvée', { 
        id: data.id,
        reference: data.reference,
        paiement_statut: data.paiement_statut 
      });

      return data;
    } catch (err) {
      logger.error('[PaymentSuccess] Erreur chargement commande', err);
      throw err;
    }
  };

  // Fonction pour envoyer le webhook n8n
  const sendN8nWebhook = async (orderData) => {
    const storageKey = `emailSentForCommande_${orderData.id}`;
    
    // Vérifier si le webhook a déjà été appelé
    if (sessionStorage.getItem(storageKey)) {
      logger.info('[PaymentSuccess] Webhook n8n déjà appelé pour cette commande', { 
        reference: orderData.reference 
      });
      return;
    }

    try {
      // Préparer les produits avec les détails complets
      // Les produits sont stockés dans commandes.produits (snapshot JSON avec prix_unitaire_ht)
      let produits = [];
      if (orderData.produits && Array.isArray(orderData.produits)) {
        produits = orderData.produits.map(produit => {
          const prixUnitaireHt = produit.prix_unitaire_ht || produit.prix || null;
          const quantite = produit.quantite || 1;
          const surDevis = produit.sur_devis || false;
          
          return {
            id: produit.id || null,
            nom: produit.nom || null,
            reference: produit.reference || null,
            marque: produit.marque || null,
            usage: produit.usage || null,
            quantite: quantite,
            prix_unitaire_ht: surDevis ? null : prixUnitaireHt,
            sur_devis: surDevis,
            total_ligne_ht: (surDevis || !prixUnitaireHt) ? null : (prixUnitaireHt * quantite)
          };
        });
      }

      const adresseLivraison = {
        adresse_ligne1: orderData.adresse_ligne1 || null,
        adresse_ligne2: orderData.adresse_ligne2 || null,
        code_postal: orderData.code_postal || null,
        ville: orderData.ville || null,
        pays: orderData.pays || 'France'
      };

      const totalHt = orderData.total_ht || 0;
      const totalTtc = orderData.total_ttc || (totalHt ? totalHt * 1.2 : 0);
      const montantTva = totalTtc - totalHt;
      const tauxTva = 0.2;

      const payload = {
        commande_id: orderData.id,
        reference: orderData.reference,
        type: 'paiement_en_ligne',
        email: orderData.email,
        client_nom: orderData.nom_client || null,
        client_raison_sociale: orderData.raison_sociale || null,
        telephone: orderData.telephone || null,
        date_commande: orderData.date_creation || orderData.created_at || null,
        total_ht: totalHt,
        total_ttc: totalTtc,
        montant_tva: montantTva < 0 ? 0 : parseFloat(montantTva.toFixed(2)),
        taux_tva: tauxTva,
        paiement_statut: orderData.paiement_statut || 'en_attente',
        source: 'site_ecommerce',
        produits: produits,
        nb_articles: orderData.nb_articles || produits.reduce((sum, p) => sum + (p.quantite || 0), 0),
        adresse_livraison: adresseLivraison
      };

      logger.info('[PaymentSuccess] Appel webhook n8n', { 
        url: N8N_WEBHOOK_URL,
        reference: orderData.reference,
        payload 
      });

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      
      logger.info('[PaymentSuccess] Réponse webhook n8n', { 
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 200) // Limiter la taille pour les logs
      });

      if (response.ok) {
        sessionStorage.setItem(storageKey, 'true');
        logger.info('[PaymentSuccess] Webhook n8n appelé avec succès', { 
          reference: orderData.reference 
        });
      } else {
        logger.error('[PaymentSuccess] Erreur réponse n8n', { 
          status: response.status,
          statusText: response.statusText,
          responseText
        });
      }
    } catch (err) {
      // Ne pas casser la page si le webhook échoue
      logger.error('[PaymentSuccess] Erreur appel webhook n8n', { 
        error: err,
        message: err.message,
        stack: err.stack
      });
      console.error('[PaymentSuccess] Détails erreur webhook n8n:', err);
    }
  };

  // Charger la commande au montage du composant
  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      setError(null);

      try {
        const orderData = await fetchOrder(commandeId, ref);
        setOrder(orderData);
        setError(null);
      } catch (err) {
        logger.error('[PaymentSuccess] Erreur chargement commande', err);
        setError(err.message || 'Impossible de charger les détails de la commande.');
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    if (commandeId || ref) {
      loadOrder();
    } else {
      setError('Aucun identifiant de commande fourni dans l\'URL.');
      setLoading(false);
    }
  }, [commandeId, ref]);

  // Vider le panier une seule fois (éviter doubles appels en StrictMode)
  useEffect(() => {
    if (!cartClearedRef.current && !loading) {
      cartClearedRef.current = true;
      clearCart();
      logger.info('[PaymentSuccess] Panier vidé');
    }
  }, [loading, clearCart]);

  // Appeler le webhook n8n après chargement réussi
  useEffect(() => {
    if (order && !error) {
      logger.info('[PaymentSuccess] Déclenchement webhook n8n', { 
        orderId: order.id,
        reference: order.reference 
      });
      sendN8nWebhook(order);
    } else {
      logger.info('[PaymentSuccess] Webhook n8n non déclenché', { 
        hasOrder: !!order,
        hasError: !!error 
      });
    }
  }, [order, error]);

  return (
    <>
      <Helmet>
        <title>Paiement réussi | EFFINOR</title>
        <meta name="description" content="Votre paiement a été accepté. Merci pour votre commande !" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-md p-8 md:p-10">
          {loading ? (
            <>
              <div className="flex justify-center mb-6">
                <Loader2 className="h-16 w-16 animate-spin text-emerald-600" />
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-center text-gray-900 mb-2">
                Chargement de votre commande...
              </h1>
              <p className="text-center text-gray-600">
                Veuillez patienter pendant que nous récupérons les détails de votre commande.
              </p>
            </>
          ) : error ? (
            <>
              {/* Même en cas d'erreur, on affiche un message de remerciement car on est sur la page de succès */}
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-center text-gray-900 mb-2">
                Merci, votre paiement a bien été validé.
              </h1>
              <p className="text-center text-gray-600 mb-4">
                Votre commande a été enregistrée. Notre équipe va préparer l'expédition de vos luminaires.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Note :</strong> {error} Vous allez recevoir une confirmation par email avec les détails de votre commande.
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <Link
                  to="/produits-solutions"
                  className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                >
                  ← Retourner aux produits
                </Link>
                <Link
                  to="/contact"
                  className="w-full inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                >
                  Contacter le support
                </Link>
              </div>
            </>
          ) : order ? (
            <>
              {/* Icône OK */}
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
              </div>

              {/* Titre */}
              <h1 className="text-2xl md:text-3xl font-semibold text-center text-gray-900 mb-2">
                Merci, votre commande a bien été enregistrée.
              </h1>
              <p className="text-center text-gray-600 mb-8">
                Votre commande a été enregistrée. Notre équipe va préparer l'expédition de vos luminaires.
              </p>

              {/* Détails de la commande */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Détails de la commande
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Référence :</span>
                    <span className="text-sm font-mono font-semibold text-gray-900">
                      {order.reference || '-'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Date de création :</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(order.date_creation || order.created_at)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total TTC :</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatPrice(order.total_ttc || (order.total_ht ? order.total_ht * 1.2 : 0))}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Mode de paiement :</span>
                    <span className="text-sm text-gray-900">
                      Paiement en ligne via Stripe
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Statut de paiement :</span>
                    {getPaymentStatusBadge(order.paiement_statut)}
                  </div>
                </div>


                <ul className="mt-6 text-sm text-gray-700 list-disc list-inside space-y-1">
                  <li>Vous allez recevoir une confirmation par email.</li>
                  <li>Un expert peut vous contacter si des précisions sont nécessaires.</li>
                  <li>Vous pouvez suivre l'avancement depuis nos échanges email/téléphone.</li>
                </ul>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col md:flex-row gap-3">
                <Link
                  to="/produits-solutions"
                  className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                >
                  ← Retourner aux produits
                </Link>
                <Link
                  to="/contact"
                  className="w-full inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                >
                  Contacter un expert Effinor
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default PaymentSuccess;