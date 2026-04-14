import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/utils/logger';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeFormData } from '@/utils/sanitize';
import { useAuth } from '@/contexts/AuthContext';
import { COMMANDE_STATUTS, COMMANDE_STATUT_LABELS, COMMANDE_STATUT_STYLES } from '@/constants/commandes';
import NotesTimeline from '@/components/NotesTimeline';
import { ArrowLeft, User, Mail, Building, Phone, Package, Loader2, Calendar, Edit, Trash2, Save, X, Plus, FileText, Upload, MoreVertical, Copy, Euro, CheckCircle, AlertCircle, Tag, Star, Clock, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const AdminOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  
  const [order, setOrder] = useState(null);
  const [orderLines, setOrderLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  // Get current user name for notes
  const currentUser = profile || user;
  const currentUserName = currentUser?.full_name || currentUser?.email || 'Admin';

  // Customer edit state
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [customerData, setCustomerData] = useState({
    nom_client: '',
    email: '',
    telephone: '',
    raison_sociale: '',
    siret: '',
    type_batiment: '',
    adresse_ligne1: '',
    adresse_ligne2: '',
    code_postal: '',
    ville: '',
    pays: 'France',
    commentaire: ''
  });

  // Products management state
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [updatingQuantity, setUpdatingQuantity] = useState({});

  // Comment state
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Email state
  const [sendingEmail, setSendingEmail] = useState(false);

  // Tab system state
  const [activeTab, setActiveTab] = useState('Résumé');
  
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL; // Optional

  // Construct image URL helper
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return imagePath;
    if (supabaseUrl) {
      if (imagePath.includes('supabase.co')) return imagePath;
      return `${supabaseUrl}/storage/v1/object/public/effinor-assets/${imagePath}`;
    }
    return imagePath;
  };

  // Get status badge color
  const getStatusColor = (statut) => {
    return COMMANDE_STATUT_STYLES[statut] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    fetchOrderData();
    fetchAvailableProducts();
  }, [id]);

  // Fetch available products for adding to order
  const fetchAvailableProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, nom, prix, sur_devis')
        .eq('actif', true)
        .order('nom');
      
      if (error) {
        logger.warn('⚠️ Erreur chargement produits disponibles:', error);
        return;
      }
      
      setAvailableProducts(data || []);
    } catch (err) {
      logger.warn('⚠️ Erreur chargement produits:', err);
    }
  };

  const fetchOrderData = async () => {
    setLoading(true);
    setError(null);
    try {
      logger.log(`📦 Chargement de la commande ID: ${id}`);
      
      // Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from('commandes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (orderError) {
        logger.error('❌ Erreur Supabase commande:', {
          message: orderError.message,
          code: orderError.code,
          details: orderError.details,
          hint: orderError.hint
        });
        
        if (orderError.code === 'PGRST116') {
          throw new Error('Commande non trouvée.');
        }
        
        if (orderError.message?.includes('permission denied') || orderError.message?.includes('RLS')) {
          throw new Error('Permissions insuffisantes. Vérifiez les politiques RLS dans Supabase.');
        }
        
        throw new Error(orderError.message || 'Erreur lors du chargement de la commande.');
      }

      if (!orderData) {
        logger.warn('⚠️ Aucune donnée retournée pour la commande:', id);
        throw new Error('Commande non trouvée.');
      }

      logger.log('✅ Commande chargée:', orderData);
      setOrder(orderData);
      
      // Initialize customer data and comment
      setCustomerData({
        nom_client: orderData.nom_client || '',
        email: orderData.email || '',
        telephone: orderData.telephone || '',
        raison_sociale: orderData.raison_sociale || '',
        siret: orderData.siret || '',
        type_batiment: orderData.type_batiment || '',
        adresse_ligne1: orderData.adresse_ligne1 || '',
        adresse_ligne2: orderData.adresse_ligne2 || '',
        code_postal: orderData.code_postal || '',
        ville: orderData.ville || '',
        pays: orderData.pays || 'France',
        commentaire: orderData.commentaire || ''
      });
      setCommentText(orderData.commentaire || '');

      // Fetch order lines
      try {
        const { data: linesData, error: linesError } = await supabase
          .from('commandes_lignes')
          .select(`
            id,
            quantite,
            prix_unitaire_ht,
            total_ligne_ht,
            meta,
            produit_id,
            products (
              id,
              nom,
              image_1,
              image_url,
              prix,
              slug
            )
          `)
          .eq('commande_id', id);
        
        if (linesError || !linesData || linesData.length === 0) {
          if (linesError) {
            logger.warn('⚠️ Erreur chargement lignes de commande:', linesError);
          }
          
          // Fallback: use produits JSON
          if (orderData.produits) {
            try {
              const produits = typeof orderData.produits === 'string' 
                ? JSON.parse(orderData.produits) 
                : orderData.produits;
              const parsedLines = Array.isArray(produits) ? produits : [];
              logger.log(`✅ ${parsedLines.length} produit(s) trouvé(s) dans JSON produits`);
              setOrderLines(parsedLines);
            } catch (parseError) {
              logger.error('❌ Erreur parsing produits JSON:', parseError);
              setOrderLines([]);
            }
          } else {
            setOrderLines([]);
          }
        } else {
          logger.log(`✅ ${linesData.length} ligne(s) de commande trouvée(s)`);
          setOrderLines(linesData || []);
        }
      } catch (linesErr) {
        logger.warn('⚠️ Erreur lors du chargement des lignes de commande:', linesErr);
        setOrderLines([]);
      }
      
    } catch (err) {
      logger.error('❌ Erreur chargement commande:', err);
      const errorMessage = err.message || "Impossible de charger la commande.";
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      logger.log(`💾 Mise à jour statut commande: ${newStatus}`);
      
      const { error } = await supabase
        .from('commandes')
        .update({ statut: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setOrder({ ...order, statut: newStatus });
      toast({
        title: "Succès",
        description: "Statut mis à jour avec succès."
      });
    } catch (err) {
      logger.error('❌ Erreur mise à jour statut:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Feature 1: Edit customer information
  const handleSaveCustomer = async () => {
    setUpdating(true);
    try {
      // Prepare data for update - clean SIRET (remove spaces)
      const dataToUpdate = { ...customerData };
      if (dataToUpdate.siret) {
        dataToUpdate.siret = dataToUpdate.siret.replace(/\s/g, '');
      }
      
      const sanitizedData = sanitizeFormData(dataToUpdate);
      
      // Update commentaire separately if it changed
      if (sanitizedData.commentaire !== commentText) {
        setCommentText(sanitizedData.commentaire || '');
      }
      
      const { error } = await supabase
        .from('commandes')
        .update(sanitizedData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh order data to get updated values
      await fetchOrderData();
      
      setEditingCustomer(false);
      toast({
        title: "Succès",
        description: "Toutes les informations ont été mises à jour avec succès."
      });
    } catch (err) {
      logger.error('❌ Erreur mise à jour commande:', err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de mettre à jour les informations.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Feature 2: Add product to order
  const handleAddProduct = async () => {
    if (!selectedProduct) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un produit.",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    try {
      const product = availableProducts.find(p => p.id === selectedProduct);
      if (!product) {
        throw new Error('Produit non trouvé');
      }

      // Add to commandes_lignes
      const unitPriceHt = product.prix || 0;
      const lineTotalHt = unitPriceHt * quantity;
      const newLine = {
        commande_id: id,
        produit_id: product.id, // Nom de colonne dans la base de données
        quantite: quantity,
        prix_unitaire_ht: unitPriceHt,
        total_ligne_ht: lineTotalHt,
        meta: {
          nom: product.nom,
        }
      };

      const { data, error } = await supabase
        .from('commandes_lignes')
        .insert([newLine])
        .select()
        .single();

      if (error) throw error;

      // Refresh order lines
      await fetchOrderData();
      
      toast({
        title: "Succès",
        description: "Produit ajouté à la commande."
      });
      
      setSelectedProduct('');
      setQuantity(1);
    } catch (err) {
      logger.error('❌ Erreur ajout produit:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le produit.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Feature 2: Remove product from order
  const handleRemoveProduct = async (lineId) => {
    if (!confirm('Supprimer ce produit de la commande ?')) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('commandes_lignes')
        .delete()
        .eq('id', lineId);
      
      if (error) throw error;
      
      await fetchOrderData();
      toast({
        title: "Succès",
        description: "Produit retiré de la commande."
      });
    } catch (err) {
      logger.error('❌ Erreur suppression produit:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Feature 2: Update product quantity
  const handleUpdateQuantity = async (lineId, newQuantity) => {
    if (newQuantity < 1) {
      toast({
        title: "Erreur",
        description: "La quantité doit être au moins 1.",
        variant: "destructive"
      });
      return;
    }

    setUpdatingQuantity({ ...updatingQuantity, [lineId]: true });
    try {
      const { error } = await supabase
        .from('commandes_lignes')
        .update({ quantite: newQuantity })
        .eq('id', lineId);
      
      if (error) throw error;
      
      await fetchOrderData();
      toast({
        title: "Succès",
        description: "Quantité mise à jour."
      });
    } catch (err) {
      logger.error('❌ Erreur mise à jour quantité:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la quantité.",
        variant: "destructive"
      });
    } finally {
      setUpdatingQuantity({ ...updatingQuantity, [lineId]: false });
    }
  };

  // Feature 3: Save comment
  const handleSaveComment = async () => {
    setUpdating(true);
    try {
      const sanitizedComment = sanitizeFormData({ commentaire: commentText }).commentaire;
      
      const { error } = await supabase
        .from('commandes')
        .update({ commentaire: sanitizedComment })
        .eq('id', id);
      
      if (error) throw error;
      
      setOrder({ ...order, commentaire: sanitizedComment });
      setIsEditingComment(false);
      toast({
        title: "Succès",
        description: "Commentaire enregistré."
      });
    } catch (err) {
      logger.error('❌ Erreur sauvegarde commentaire:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer le commentaire.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };


  // Feature 4: Send quote by email
  const handleSendQuote = async () => {
    if (!order.email) {
      toast({
        title: "Erreur",
        description: "Aucun email client pour envoyer le devis.",
        variant: "destructive"
      });
      return;
    }

    setSendingEmail(true);
    try {
      // Calculate total
      const total = orderLines.reduce((sum, line) => {
        const price = line.prix_unitaire_ht ?? line.prix_unitaire ?? line.products?.prix ?? 0;
        const qty = line.quantite || 1;
        return sum + (parseFloat(price) * qty);
      }, 0);

      // Build HTML email content
      const productsHTML = orderLines.map(line => {
        const productName = line.products?.nom || line.meta?.nom || line.nom || 'Produit inconnu';
        const qty = line.quantite || 1;
        const unitPrice = line.prix_unitaire_ht ?? line.prix_unitaire ?? line.products?.prix ?? 0;
        const lineTotal = parseFloat(unitPrice) * qty;
        
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${productName}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${qty}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${unitPrice > 0 ? `${parseFloat(unitPrice).toFixed(2)}€` : 'Sur devis'}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${unitPrice > 0 ? `${lineTotal.toFixed(2)}€` : 'Sur devis'}</td>
          </tr>
        `;
      }).join('');

      const orderDate = order.date_creation || order.created_at || new Date();
      const formattedDate = new Date(orderDate).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });

      const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: #10B981; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">EFFINOR - Devis</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
              <h2 style="margin-top: 0; color: #1f2937;">Informations Client</h2>
              <p style="margin: 8px 0;"><strong>Client:</strong> ${order.nom_client || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Société:</strong> ${order.raison_sociale || 'N/A'}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${order.email}</p>
              ${order.telephone ? `<p style="margin: 8px 0;"><strong>Téléphone:</strong> ${order.telephone}</p>` : ''}
              <p style="margin: 8px 0;"><strong>Date:</strong> ${formattedDate}</p>
            </div>
            
            <h2 style="color: #1f2937; margin-top: 0;">Détail du devis</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Produit</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">Quantité</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Prix unitaire</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${productsHTML}
              </tbody>
              <tfoot>
                <tr style="background-color: #10B981; color: white;">
                  <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold; font-size: 16px;">TOTAL HT</td>
                  <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 20px;">${total > 0 ? `${total.toFixed(2)}€` : 'Sur devis'}</td>
                </tr>
              </tfoot>
            </table>
            
            ${order.commentaire ? `
              <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <strong>Note:</strong><br/>
                <p style="margin: 5px 0; white-space: pre-wrap;">${order.commentaire}</p>
              </div>
            ` : ''}
            
            ${(order.adresse_siege || order.numero_siret || order.adresse_travaux || order.raison_sociale) ? `
              <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #1e40af; font-size: 18px;">Informations CEE Légales</h3>
                
                ${(order.adresse_siege || order.numero_siret) ? `
                  <div style="margin-bottom: 15px;">
                    <h4 style="color: #1e40af; margin-bottom: 8px; font-size: 14px; font-weight: bold;">Siège Social</h4>
                    ${order.adresse_siege ? `<p style="margin: 4px 0; color: #1f2937;">${order.adresse_siege}</p>` : ''}
                    ${(order.ville_siege || order.code_postal_siege) ? `<p style="margin: 4px 0; color: #1f2937;">${order.code_postal_siege || ''} ${order.ville_siege || ''}</p>` : ''}
                    ${order.numero_siret ? `<p style="margin: 4px 0; color: #1f2937;"><strong>SIRET:</strong> ${order.numero_siret}</p>` : ''}
                    ${order.siren ? `<p style="margin: 4px 0; color: #1f2937;"><strong>SIREN:</strong> ${order.siren}</p>` : ''}
                  </div>
                ` : ''}
                
                ${(order.adresse_travaux || order.region) ? `
                  <div style="margin-bottom: 15px;">
                    <h4 style="color: #1e40af; margin-bottom: 8px; font-size: 14px; font-weight: bold;">Adresse des Travaux</h4>
                    ${order.adresse_travaux ? `<p style="margin: 4px 0; color: #1f2937;">${order.adresse_travaux}</p>` : ''}
                    ${(order.ville_travaux || order.code_postal_travaux) ? `<p style="margin: 4px 0; color: #1f2937;">${order.code_postal_travaux || ''} ${order.ville_travaux || ''}</p>` : ''}
                    ${order.region ? `<p style="margin: 4px 0; color: #1f2937;"><strong>Région:</strong> ${order.region}</p>` : ''}
                    ${order.zone_climatique ? `<p style="margin: 4px 0; color: #1f2937;"><strong>Zone Climatique:</strong> ${order.zone_climatique}</p>` : ''}
                    ${order.siret_site_travaux ? `<p style="margin: 4px 0; color: #1f2937;"><strong>SIRET Site:</strong> ${order.siret_site_travaux}</p>` : ''}
                  </div>
                ` : ''}
                
                ${(order.raison_sociale || order.nom_responsable) ? `
                  <div style="margin-bottom: 15px;">
                    <h4 style="color: #1e40af; margin-bottom: 8px; font-size: 14px; font-weight: bold;">Bénéficiaire de Travaux</h4>
                    ${order.raison_sociale ? `<p style="margin: 4px 0; color: #1f2937;"><strong>Raison Sociale:</strong> ${order.raison_sociale}</p>` : ''}
                    ${(order.civilite_responsable || order.prenom_responsable || order.nom_responsable) ? `
                      <p style="margin: 4px 0; color: #1f2937;">
                        ${order.civilite_responsable || ''} ${order.prenom_responsable || ''} ${order.nom_responsable || ''}
                      </p>
                    ` : ''}
                    ${order.email_beneficiaire ? `<p style="margin: 4px 0; color: #1f2937;"><strong>Email:</strong> ${order.email_beneficiaire}</p>` : ''}
                    ${order.telephone_responsable ? `<p style="margin: 4px 0; color: #1f2937;"><strong>Téléphone:</strong> ${order.telephone_responsable}</p>` : ''}
                  </div>
                ` : ''}
                
                ${(order.surface_m2 || order.categories_travaux) ? `
                  <div>
                    <h4 style="color: #1e40af; margin-bottom: 8px; font-size: 14px; font-weight: bold;">Détails des Travaux</h4>
                    ${order.surface_m2 ? `<p style="margin: 4px 0; color: #1f2937;"><strong>Surface:</strong> ${order.surface_m2} m²</p>` : ''}
                    ${order.qualification ? `<p style="margin: 4px 0; color: #1f2937;"><strong>Qualification:</strong> ${order.qualification}</p>` : ''}
                    ${order.parcelle_cadastrale ? `<p style="margin: 4px 0; color: #1f2937;"><strong>Parcelle Cadastrale:</strong> ${order.parcelle_cadastrale}</p>` : ''}
                    ${order.categories_travaux ? `
                      <p style="margin: 4px 0; color: #1f2937;"><strong>Catégories:</strong> ${
                        Array.isArray(order.categories_travaux) 
                          ? order.categories_travaux.join(', ') 
                          : (typeof order.categories_travaux === 'string' ? JSON.parse(order.categories_travaux || '[]').join(', ') : '')
                      }</p>
                    ` : ''}
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            <div style="margin-top: 40px; padding: 20px; background-color: #f9fafb; border-radius: 8px; text-align: center;">
              <p style="margin: 10px 0; color: #6b7280;">Pour toute question, contactez-nous:</p>
              <p style="margin: 10px 0;"><strong style="color: #1f2937;">📞 09 78 45 50 63</strong></p>
              <p style="margin: 10px 0;"><strong style="color: #10B981;">✉️ contact@effinor.fr</strong></p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send via N8N webhook if configured, otherwise show error
      if (n8nWebhookUrl) {
        const response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: order.email,
            subject: `Devis EFFINOR - ${order.nom_client || 'Commande'}`,
            html: emailHTML
          })
        });

        if (!response.ok) {
          throw new Error('Échec de l\'envoi de l\'email');
        }

        // Update order status
        await supabase
          .from('commandes')
          .update({ statut: COMMANDE_STATUTS.DEVIS_ENVOYE })
          .eq('id', id);

        setOrder({ ...order, statut: COMMANDE_STATUTS.DEVIS_ENVOYE });

        toast({
          title: "Email envoyé",
          description: `Devis envoyé à ${order.email}`
        });
      } else {
        // Fallback: open mailto link with pre-filled content (limited)
        const mailtoSubject = encodeURIComponent(`Devis EFFINOR - ${order.nom_client || 'Commande'}`);
        const mailtoBody = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint le devis pour votre commande.\n\nCordialement,\nL'équipe EFFINOR`);
        
        window.open(`mailto:${order.email}?subject=${mailtoSubject}&body=${mailtoBody}`, '_blank');
        
        toast({
          title: "Ouvrir le client email",
          description: "Un client email va s'ouvrir. Pour envoyer un devis HTML complet, configurez VITE_N8N_WEBHOOK_URL dans votre .env"
        });
      }
    } catch (err) {
      logger.error('❌ Erreur envoi email:', err);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email. Vérifiez la configuration du webhook N8N.",
        variant: "destructive"
      });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page p-4 md:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-secondary-500 mx-auto mb-4" />
            <p className="text-gray-600">Chargement de la commande...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="admin-page p-4 md:p-8">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-red-600 text-2xl">⚠️</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-800 mb-2">
                {error ? 'Erreur de chargement' : 'Commande introuvable'}
              </h2>
              <p className="text-red-700 mb-4">{error || 'Cette commande n\'existe pas.'}</p>
              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={() => navigate('/commandes')} 
                  className="bg-secondary-500 hover:bg-secondary-600"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Retour aux commandes
                </Button>
                <Button onClick={fetchOrderData} variant="outline">
                  Réessayer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total: use order.total_ht if available, otherwise calculate from lines
  const calculatedTotal = order?.total_ht 
    ? parseFloat(order.total_ht) 
    : orderLines.reduce((sum, line) => {
        const price = line.prix_unitaire_ht ?? line.prix_unitaire ?? line.total_ligne_ht ?? line.products?.prix ?? 0;
        const qty = line.quantite || 1;
        // If total_ligne_ht exists, use it directly, otherwise calculate
        if (line.total_ligne_ht) {
          return sum + parseFloat(line.total_ligne_ht);
        }
        return sum + (parseFloat(price) * qty);
      }, 0);
  
  // Use order.total_ttc if available, otherwise calculate from HT
  const calculatedTotalTTC = order?.total_ttc 
    ? parseFloat(order.total_ttc) 
    : (calculatedTotal > 0 ? calculatedTotal * 1.2 : 0);

  // Format date helper
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format short date helper
  const formatShortDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <>
      <Helmet>
        <title>Commande #{order.id.slice(0, 8)} | Effinor Admin</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Sticky Header Bar */}
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/orders')}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Commande #{order.id.slice(0, 8)}
                  </h1>
                  <Badge className={`${getStatusColor(order.statut)} text-sm px-3 py-1`}>
                    {COMMANDE_STATUT_LABELS[order.statut] || COMMANDE_STATUT_LABELS[COMMANDE_STATUTS.NOUVELLE]}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Créée le {formatDate(order.date_creation || order.created_at)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Status Dropdown */}
              <Select
                value={order.statut || COMMANDE_STATUTS.NOUVELLE}
                onValueChange={handleStatusChange}
                disabled={updating}
              >
                <SelectTrigger className="w-48 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={COMMANDE_STATUTS.NOUVELLE}>{COMMANDE_STATUT_LABELS[COMMANDE_STATUTS.NOUVELLE]}</SelectItem>
                  <SelectItem value={COMMANDE_STATUTS.EN_COURS}>{COMMANDE_STATUT_LABELS[COMMANDE_STATUTS.EN_COURS]}</SelectItem>
                  <SelectItem value={COMMANDE_STATUTS.DEVIS_ENVOYE}>{COMMANDE_STATUT_LABELS[COMMANDE_STATUTS.DEVIS_ENVOYE]}</SelectItem>
                  <SelectItem value={COMMANDE_STATUTS.EN_ATTENTE_CLIENT}>{COMMANDE_STATUT_LABELS[COMMANDE_STATUTS.EN_ATTENTE_CLIENT]}</SelectItem>
                  <SelectItem value={COMMANDE_STATUTS.ACCEPTEE}>{COMMANDE_STATUT_LABELS[COMMANDE_STATUTS.ACCEPTEE]}</SelectItem>
                  <SelectItem value={COMMANDE_STATUTS.REFUSEE}>{COMMANDE_STATUT_LABELS[COMMANDE_STATUTS.REFUSEE]}</SelectItem>
                  <SelectItem value={COMMANDE_STATUTS.ARCHIVEE}>{COMMANDE_STATUT_LABELS[COMMANDE_STATUTS.ARCHIVEE]}</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Action Buttons */}
              <Button
                onClick={handleSendQuote}
                disabled={sendingEmail || !order.email || updating}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 disabled:bg-gray-300"
              >
                <Mail className="w-4 h-4" />
                {sendingEmail ? 'Envoi...' : 'Envoyer devis'}
              </Button>
              
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100 rounded-lg">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Fixed 320px */}
          <aside className="hidden lg:flex w-80 bg-gray-50 border-r border-gray-200 flex-col overflow-y-auto p-6 space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-secondary-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">{order.nom_client || 'Client'}</h3>
                  {order.raison_sociale && <p className="text-sm text-gray-500 truncate">{order.raison_sociale}</p>}
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${order.email}`} className="text-secondary-600 hover:underline break-all">
                    {order.email || '-'}
                  </a>
                </div>
                
                {order.telephone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <a href={`tel:${order.telephone}`} className="text-gray-900 hover:text-secondary-600">
                      {order.telephone}
                    </a>
                  </div>
                )}
                
                {order.raison_sociale && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600 truncate">{order.raison_sociale}</span>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingCustomer(true);
                  setCustomerData({
                    nom_client: order.nom_client || '',
                    email: order.email || '',
                    telephone: order.telephone || '',
                    raison_sociale: order.raison_sociale || '',
                    siret: order.siret || '',
                    type_batiment: order.type_batiment || '',
                    adresse_ligne1: order.adresse_ligne1 || '',
                    adresse_ligne2: order.adresse_ligne2 || '',
                    code_postal: order.code_postal || '',
                    ville: order.ville || '',
                    pays: order.pays || 'France',
                    commentaire: order.commentaire || ''
                  });
                }}
                className="mt-4 w-full text-sm text-secondary-600 hover:bg-secondary-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier les informations
              </Button>
            </div>
            
            {/* Customer Edit Modal */}
            {editingCustomer && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setEditingCustomer(false);
                  setCustomerData({
                    nom_client: order.nom_client || '',
                    email: order.email || '',
                    telephone: order.telephone || '',
                    raison_sociale: order.raison_sociale || '',
                    siret: order.siret || '',
                    type_batiment: order.type_batiment || '',
                    adresse_ligne1: order.adresse_ligne1 || '',
                    adresse_ligne2: order.adresse_ligne2 || '',
                    code_postal: order.code_postal || '',
                    ville: order.ville || '',
                    pays: order.pays || 'France',
                    commentaire: order.commentaire || ''
                  });
                }
              }}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-gray-900">Modifier les informations de la commande</h2>
                    <button
                      onClick={() => {
                        setEditingCustomer(false);
                        setCustomerData({
                          nom_client: order.nom_client || '',
                          email: order.email || '',
                          telephone: order.telephone || '',
                          raison_sociale: order.raison_sociale || '',
                          siret: order.siret || '',
                          type_batiment: order.type_batiment || '',
                          adresse_ligne1: order.adresse_ligne1 || '',
                          adresse_ligne2: order.adresse_ligne2 || '',
                          code_postal: order.code_postal || '',
                          ville: order.ville || '',
                          pays: order.pays || 'France',
                          commentaire: order.commentaire || ''
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveCustomer();
                  }} className="p-6 space-y-6">
                    {/* Section Contact */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Contact</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                          <Input
                            value={customerData.nom_client}
                            onChange={(e) => setCustomerData({...customerData, nom_client: e.target.value})}
                            placeholder="Nom du client"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                          <Input
                            type="email"
                            value={customerData.email}
                            onChange={(e) => setCustomerData({...customerData, email: e.target.value})}
                            placeholder="email@exemple.fr"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                          <Input
                            value={customerData.telephone}
                            onChange={(e) => setCustomerData({...customerData, telephone: e.target.value})}
                            placeholder="06 12 34 56 78"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section Entreprise */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Entreprise</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Raison sociale *</label>
                          <Input
                            value={customerData.raison_sociale}
                            onChange={(e) => setCustomerData({...customerData, raison_sociale: e.target.value})}
                            placeholder="Nom de l'entreprise"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
                          <Input
                            value={customerData.siret}
                            onChange={(e) => setCustomerData({...customerData, siret: e.target.value})}
                            placeholder="14 chiffres"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SIRET (optionnel)</label>
                          <Input
                            value={customerData.siret}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 14);
                              setCustomerData({...customerData, siret: value});
                            }}
                            placeholder="14 chiffres"
                            maxLength={14}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type de bâtiment *</label>
                          <Select 
                            value={customerData.type_batiment || ''} 
                            onValueChange={(value) => setCustomerData({...customerData, type_batiment: value})}
                            required
                          >
                            <SelectTrigger className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Industriel (usine, atelier, entrepôt)">Industriel (usine, atelier, entrepôt)</SelectItem>
                              <SelectItem value="Tertiaire (bureaux, école, ...)">Tertiaire (bureaux, école, ...)</SelectItem>
                              <SelectItem value="Agricole (serre, élevage, ...)">Agricole (serre, élevage, ...)</SelectItem>
                              <SelectItem value="Logistique (entrepôt, plateforme)">Logistique (entrepôt, plateforme)</SelectItem>
                              <SelectItem value="Commerce (magasin, showroom)">Commerce (magasin, showroom)</SelectItem>
                              <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Section Adresse */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Adresse</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse (numéro et rue) *</label>
                          <Input
                            value={customerData.adresse_ligne1}
                            onChange={(e) => setCustomerData({...customerData, adresse_ligne1: e.target.value})}
                            placeholder="10 Rue de l'Industrie"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Complément d'adresse (optionnel)</label>
                          <Input
                            value={customerData.adresse_ligne2}
                            onChange={(e) => setCustomerData({...customerData, adresse_ligne2: e.target.value})}
                            placeholder="Bâtiment B, 2ème étage"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Code postal *</label>
                          <Input
                            value={customerData.code_postal}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                              setCustomerData({...customerData, code_postal: value});
                            }}
                            placeholder="75001"
                            maxLength={5}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Ville *</label>
                          <Input
                            value={customerData.ville}
                            onChange={(e) => setCustomerData({...customerData, ville: e.target.value})}
                            placeholder="Paris"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                          <Input
                            value={customerData.pays}
                            onChange={(e) => setCustomerData({...customerData, pays: e.target.value})}
                            placeholder="France"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section Commentaire */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Commentaire</h3>
                      <Textarea
                        value={customerData.commentaire}
                        onChange={(e) => setCustomerData({...customerData, commentaire: e.target.value})}
                        placeholder="Commentaires ou informations complémentaires..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <Button
                        type="submit"
                        disabled={updating}
                        className="flex-1 bg-secondary-500 hover:bg-secondary-600 text-white"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updating ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setEditingCustomer(false);
                          setCustomerData({
                            nom_client: order.nom_client || '',
                            email: order.email || '',
                            telephone: order.telephone || '',
                            raison_sociale: order.raison_sociale || '',
                            siret: order.siret || '',
                            type_batiment: order.type_batiment || '',
                            adresse_ligne1: order.adresse_ligne1 || '',
                            adresse_ligne2: order.adresse_ligne2 || '',
                            code_postal: order.code_postal || '',
                            ville: order.ville || '',
                            pays: order.pays || 'France',
                            commentaire: order.commentaire || ''
                          });
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h4 className="font-semibold text-gray-900 mb-4">Statistiques</h4>
              <div className="space-y-3">
                {/* Référence */}
                {order.reference && (
                  <div className="pb-2 border-b border-gray-200">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Référence</span>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{order.reference}</p>
                  </div>
                )}
                
                {/* Nombre d'articles */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nb articles</span>
                  <span className="font-semibold text-gray-900">
                    {order.nb_articles ?? orderLines.length}
                  </span>
                </div>
                
                {/* Détail des articles */}
                {orderLines.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Détail articles</span>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {orderLines.map((line, idx) => {
                        const productName = line.products?.nom || line.meta?.nom || line.nom || `Produit ${idx + 1}`;
                        const qty = line.quantite || 1;
                        const unitPrice = line.prix_unitaire_ht ?? line.products?.prix ?? 0;
                        const lineTotal = line.total_ligne_ht ?? (unitPrice * qty);
                        return (
                          <div key={line.id || idx} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-gray-700 flex-1 truncate">{productName}</span>
                              <span className="text-gray-600 ml-2">×{qty}</span>
                            </div>
                            {lineTotal > 0 && (
                              <div className="text-right text-gray-500 mt-1">
                                {lineTotal.toFixed(2)} € HT
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Totaux */}
                {calculatedTotal > 0 ? (
                  <>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total HT</span>
                        <span className="text-base font-bold text-secondary-600">
                          {calculatedTotal.toFixed(2)} €
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm font-medium text-gray-700">Total TTC</span>
                        <span className="text-base font-bold text-secondary-700">
                          {calculatedTotalTTC.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="font-semibold text-gray-500">Sur devis</span>
                    </div>
                  </div>
                )}
                
                {/* Informations complémentaires */}
                <div className="pt-2 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Date création</span>
                    <span className="text-xs text-gray-900">{formatShortDate(order.date_creation || order.created_at)}</span>
                  </div>
                  {order.type_batiment && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Type bâtiment</span>
                      <span className="text-xs text-gray-900 truncate ml-2">{order.type_batiment}</span>
                    </div>
                  )}
                  {order.siret && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">SIRET</span>
                      <span className="text-xs text-gray-900 font-mono">{order.siret}</span>
                    </div>
                  )}
                  {order.source && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Source</span>
                      <span className="text-xs text-gray-900">{order.source}</span>
                    </div>
                  )}
                  {order.mode_suivi && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Mode de traitement</span>
                      {order.mode_suivi === 'paiement_en_ligne' ? (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Paiement en ligne</Badge>
                      ) : order.mode_suivi === 'rappel' ? (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">Rappel téléphonique</Badge>
                      ) : (
                        <span className="text-xs text-gray-900">{order.mode_suivi}</span>
                      )}
                    </div>
                  )}
                  {order.paiement_statut && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Statut paiement</span>
                      <Badge className={
                        order.paiement_statut === 'payee' ? 'bg-emerald-100 text-emerald-800' :
                        order.paiement_statut === 'echouee' ? 'bg-red-100 text-red-800' :
                        order.paiement_statut === 'annulee' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {order.paiement_statut === 'payee' ? 'Payée' :
                         order.paiement_statut === 'echouee' ? 'Échouée' :
                         order.paiement_statut === 'annulee' ? 'Annulée' :
                         'En attente'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h4 className="font-semibold text-gray-900 mb-3">Actions rapides</h4>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm hover:bg-gray-50"
                  onClick={() => {
                    toast({
                      title: "Fonctionnalité à venir",
                      description: "Le téléchargement PDF sera disponible prochainement.",
                    });
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm hover:bg-gray-50"
                  onClick={() => {
                    toast({
                      title: "Fonctionnalité à venir",
                      description: "La duplication de commande sera disponible prochainement.",
                    });
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Dupliquer commande
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ? Cette action est irréversible.')) {
                      // Handle delete
                      toast({
                        title: "Fonctionnalité à venir",
                        description: "La suppression de commande sera disponible prochainement.",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
            
            {/* Activity Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h4 className="font-semibold text-gray-900 mb-3">Activité récente</h4>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-secondary-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">Commande créée</p>
                    <p className="text-xs text-gray-500">{formatShortDate(order.date_creation || order.created_at)}</p>
                  </div>
                </div>
                {order.statut && order.statut !== COMMANDE_STATUTS.NOUVELLE && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">Statut: {order.statut}</p>
                      <p className="text-xs text-gray-500">Mis à jour récemment</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 bg-white flex flex-col overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 px-6 bg-white">
              <div className="flex gap-6 overflow-x-auto">
                {['Résumé', 'Produits', 'Notes'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                      ${activeTab === tab 
                        ? 'border-secondary-500 text-secondary-600' 
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Résumé Tab */}
              {activeTab === 'Résumé' && (
                <div className="max-w-4xl space-y-6">
                  {/* Order Summary Cards */}
                  <div className="grid md:grid-cols-3 gap-4">
                    {calculatedTotal > 0 ? (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-blue-600 mb-1">Total HT</p>
                              <p className="text-2xl font-bold text-blue-900">
                                {calculatedTotal.toFixed(2)} €
                              </p>
                            </div>
                            <Euro className="w-8 h-8 text-blue-400" />
                          </div>
                        </div>
                        
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-indigo-600 mb-1">Total TTC</p>
                              <p className="text-2xl font-bold text-indigo-900">
                                {calculatedTotalTTC.toFixed(2)} €
                              </p>
                            </div>
                            <Euro className="w-8 h-8 text-indigo-400" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 mb-1">Montant</p>
                            <p className="text-2xl font-bold text-blue-900">Sur devis</p>
                          </div>
                          <Euro className="w-8 h-8 text-blue-400" />
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 mb-1">Produits</p>
                          <p className="text-2xl font-bold text-green-900">
                            {order.nb_articles ?? orderLines.length}
                          </p>
                        </div>
                        <Package className="w-8 h-8 text-green-400" />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 mb-1">Statut</p>
                          <p className="text-lg font-semibold text-purple-900">
                            {COMMANDE_STATUT_LABELS[order.statut] || COMMANDE_STATUT_LABELS[COMMANDE_STATUTS.NOUVELLE]}
                          </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-purple-400" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer Details */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4">Détails client</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm text-gray-600">Nom complet</label>
                        <p className="font-medium text-gray-900 mt-1">{order.nom_client || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Raison sociale</label>
                        <p className="font-medium text-gray-900 mt-1">{order.raison_sociale || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Email</label>
                        <p className="font-medium text-gray-900 mt-1 break-all">{order.email || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Téléphone</label>
                        <p className="font-medium text-gray-900 mt-1">{order.telephone || 'N/A'}</p>
                      </div>
                      {order.siret && (
                        <div>
                          <label className="text-sm text-gray-600">SIRET</label>
                          <p className="font-medium text-gray-900 mt-1 font-mono">{order.siret}</p>
                        </div>
                      )}
                      {order.type_batiment && (
                        <div>
                          <label className="text-sm text-gray-600">Type de bâtiment</label>
                          <p className="font-medium text-gray-900 mt-1">{order.type_batiment}</p>
                        </div>
                      )}
                      {order.source && (
                        <div>
                          <label className="text-sm text-gray-600">Source</label>
                          <p className="font-medium text-gray-900 mt-1">
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              {order.source === 'site_ecommerce' ? 'Site e-commerce' : order.source}
                            </Badge>
                          </p>
                        </div>
                      )}
                      {order.reference && (
                        <div>
                          <label className="text-sm text-gray-600">Référence commande</label>
                          <p className="font-medium text-gray-900 mt-1 font-mono">{order.reference}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Adresse de livraison */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4">Adresse de livraison</h3>
                    <div className="space-y-1 text-gray-900">
                      <p>{order.adresse_ligne1 || 'Adresse non renseignée'}</p>
                      {order.adresse_ligne2 && (
                        <p>{order.adresse_ligne2}</p>
                      )}
                      <p>
                        {(order.code_postal || '')} {order.ville || ''}
                      </p>
                      <p>{order.pays || 'France'}</p>
                    </div>
                  </div>

                  {/* Adresse de facturation */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4">Adresse de facturation</h3>
                    {order.adresse_facturation_diff ? (
                      <div className="space-y-1 text-gray-900">
                        <p>{order.facturation_nom_client || 'Nom de facturation non renseigné'}</p>
                        {order.facturation_raison_sociale && (
                          <p className="text-gray-700">{order.facturation_raison_sociale}</p>
                        )}
                        <p>{order.facturation_adresse_ligne1 || 'Adresse non renseignée'}</p>
                        {order.facturation_adresse_ligne2 && (
                          <p>{order.facturation_adresse_ligne2}</p>
                        )}
                        <p>
                          {(order.facturation_code_postal || '')} {order.facturation_ville || ''}
                        </p>
                        <p>{order.facturation_pays || 'France'}</p>
                      </div>
                    ) : (
                      <p className="text-gray-600">Identique à l'adresse de livraison.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Produits Tab */}
              {activeTab === 'Produits' && (
                <div className="max-w-6xl space-y-6">
                  {/* Add Product Section */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-lg text-gray-900 mb-4 flex items-center gap-2">
                      <Plus className="w-5 h-5 text-secondary-500" />
                      Ajouter un produit
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Select
                        value={selectedProduct}
                        onValueChange={setSelectedProduct}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Sélectionner un produit" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableProducts.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.nom} - {product.prix ? `${parseFloat(product.prix).toFixed(2)}€` : 'Sur devis'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24"
                        placeholder="Qté"
                      />
                      <Button
                        onClick={handleAddProduct}
                        disabled={!selectedProduct || updating}
                        className="bg-secondary-500 hover:bg-secondary-600 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>

                  {/* Products Table */}
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Package className="w-5 h-5 text-secondary-500" />
                        Produits Commandés
                      </h3>
                    </div>
                    
                    {orderLines.length > 0 ? (
                      <>
                        <div className="divide-y divide-gray-200">
                          {orderLines.map((line, index) => {
                            const product = line.products || {};
                            const productName = product.nom || line.meta?.nom || line.nom || 'Produit inconnu';
                            const productImage = product.image_1 || product.image_url || line.image_1;
                            const qty = line.quantite || 1;
                            const unitPrice = line.prix_unitaire_ht ?? line.prix_unitaire ?? product.prix ?? 0;
                            const lineTotal = parseFloat(unitPrice) * qty;
                            const hasId = line.id;
                            
                            return (
                              <div key={line.id || index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                  {productImage && (
                                    <img
                                      src={getImageUrl(productImage)}
                                      alt={productName}
                                      className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                      onError={(e) => {
                                        e.target.src = 'https://via.placeholder.com/64?text=Image';
                                      }}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 mb-1">{productName}</h4>
                                    {product.slug && (
                                      <Link
                                        to={`/produit/${product.slug}`}
                                        className="text-xs text-secondary-600 hover:underline"
                                        target="_blank"
                                      >
                                        Voir le produit →
                                      </Link>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-6">
                                    <div className="text-center">
                                      <label className="text-xs text-gray-600 block mb-1">Quantité</label>
                                      {hasId ? (
                                        <Input
                                          type="number"
                                          min="1"
                                          value={qty}
                                          onChange={(e) => {
                                            const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                            if (newQty !== qty) {
                                              handleUpdateQuantity(line.id, newQty);
                                            }
                                          }}
                                          onBlur={(e) => {
                                            const newQty = Math.max(1, parseInt(e.target.value) || 1);
                                            handleUpdateQuantity(line.id, newQty);
                                          }}
                                          disabled={updatingQuantity[line.id]}
                                          className="w-20 h-8 text-center"
                                        />
                                      ) : (
                                        <span className="font-medium">{qty}</span>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <label className="text-xs text-gray-600 block mb-1">Prix unit.</label>
                                      <span className="font-medium text-sm">
                                        {unitPrice > 0 ? `${parseFloat(unitPrice).toFixed(2)}€` : 'Sur devis'}
                                      </span>
                                    </div>
                                    <div className="text-right w-24">
                                      <label className="text-xs text-gray-600 block mb-1">Total</label>
                                      <span className="font-bold text-secondary-600">
                                        {unitPrice > 0 ? `${lineTotal.toFixed(2)}€` : 'Sur devis'}
                                      </span>
                                    </div>
                                    {hasId && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveProduct(line.id)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {/* Total */}
                        {calculatedTotal > 0 && (
                          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold text-gray-900">TOTAL HT</span>
                              <span className="text-2xl font-bold text-secondary-600">
                                {calculatedTotal.toFixed(2)} €
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-base font-medium text-gray-700">TOTAL TTC</span>
                              <span className="text-xl font-bold text-secondary-700">
                                {calculatedTotalTTC.toFixed(2)} €
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-12 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun produit trouvé dans cette commande.</p>
                        <p className="text-sm mt-2">Utilisez le formulaire ci-dessus pour ajouter des produits.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Tab */}
              {activeTab === 'Notes' && order && (
                <div className="max-w-4xl">
                  <NotesTimeline 
                    commandeId={order.id}
                    currentUser={currentUserName}
                    title="Notes Internes"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default AdminOrderDetail;
