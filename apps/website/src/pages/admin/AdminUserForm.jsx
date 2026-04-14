import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import { sanitizeFormData } from '@/utils/sanitize';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Label } from '@/components/ui/label.jsx';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getAllRoles } from '@/lib/api/roles';

const AdminUserForm = ({ onCreated }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    role_id: null,
    active: true,
    photo_profil_url: '',
  });
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false); // Toujours false au départ, sera true seulement si on édite
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchUser = useCallback(async () => {
    // Ne charger l'utilisateur que si on est en mode édition
    if (!isEditing || !id) {
        return;
    }
    setPageLoading(true);
    try {
        const { data, error } = await supabase
          .from('utilisateurs')
          .select(`
            *,
            role:roles!utilisateurs_role_id_fkey(id, slug, label, nom)
          `)
          .eq('id', id)
          .single();
        
        if (error || !data) {
            logger.error('Erreur:', error);
            throw new Error("Impossible de charger l'utilisateur.");
        }

        const userData = {
            prenom: data.prenom || '',
            nom: data.nom || '',
            full_name: data.full_name || '',
            email: data.email || '',
            role_id: data.role_id || null,
            active: data.statut === 'actif',
            photo_profil_url: data.photo_profil_url || '',
            created_at: data.created_at,
            updated_at: data.updated_at,
        };
        setFormData(userData);
        setInitialData(userData);
    } catch (error) {
        logger.error('Error fetching user:', error);
        toast({ 
          title: "Impossible de charger l'utilisateur", 
          description: "Une erreur est survenue lors du chargement des données. Veuillez réessayer ou contacter le support technique.",
          variant: "destructive" 
        });
        navigate('/utilisateurs');
    } finally {
        setPageLoading(false);
    }
  }, [id, isEditing, navigate, toast]);

  // Load roles from database
  useEffect(() => {
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        const { success, data, error } = await getAllRoles();
        if (success && data) {
          setRoles(data);
          logger.log('✅ Rôles chargés:', data);
        } else {
          logger.error('Erreur chargement rôles:', error);
          // Ne pas bloquer le rendu, juste afficher un message
          toast({
            title: "Avertissement",
            description: "Impossible de charger la liste des rôles. Vous pouvez continuer, mais le rôle ne pourra pas être défini.",
            variant: "default",
            duration: 5000,
          });
          setRoles([]);
        }
      } catch (error) {
        logger.error('Erreur chargement rôles:', error);
        // Ne pas bloquer le rendu, juste afficher un message
        toast({
          title: "Avertissement",
          description: "Impossible de charger la liste des rôles. Vous pouvez continuer, mais le rôle ne pourra pas être défini.",
          variant: "default",
          duration: 5000,
        });
        setRoles([]);
      } finally {
        setRolesLoading(false);
      }
    };
    
    loadRoles();
  }, [toast]);

  // Charger l'utilisateur seulement si on est en mode édition
  useEffect(() => {
    if (isEditing && id) {
      fetchUser();
    }
  }, [isEditing, id, fetchUser]);
  
  useEffect(() => {
    if (!isEditing) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        setIsEmailValid(emailRegex.test(formData.email || ''));
    }
  }, [formData.email, isEditing]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name, checked) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleInviteUser = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    
    const { prenom, nom, email, role_id } = formData;
    
    // Validation
    if (!email || !prenom || !nom) {
      setErrorMessage("Veuillez remplir tous les champs obligatoires.");
      setLoading(false);
      return;
    }

    // Build full_name
    const full_name = `${prenom} ${nom}`.trim();
    
    // Prepare payload for Edge Function
    const payload = {
      email: email.toLowerCase().trim(),
      full_name,
      role_id: role_id || null,
      send_email: true,
    };

    logger.log('=== INVITATION UTILISATEUR ===');
    logger.log('Payload envoyé:', payload);

    try {
      // Call Edge Function using fetch directly to have better error handling
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const functionUrl = `${supabaseUrl}/functions/v1/create-user`;
      
      logger.log('📤 Appel Edge Function:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify(payload),
      });

      // Parse response body
      let responseData;
      const responseText = await response.text();
      
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseData = { error: responseText || 'Erreur inconnue' };
      }

      logger.log('📥 Réponse Edge Function:', { status: response.status, data: responseData });

      // Check if response is successful
      if (!response.ok) {
        // Extract error message from response body
        let errorMsg = 'Une erreur est survenue lors de l\'invitation.';
        
        if (responseData?.error) {
          errorMsg = typeof responseData.error === 'string' 
            ? responseData.error 
            : responseData.error.message || errorMsg;
        } else if (responseText) {
          // Try to parse as JSON if not already parsed
          try {
            const parsed = JSON.parse(responseText);
            if (parsed.error) {
              errorMsg = typeof parsed.error === 'string' ? parsed.error : parsed.error.message || errorMsg;
            }
          } catch {
            errorMsg = responseText;
          }
        }
        
        logger.error('❌ Erreur Edge Function:', errorMsg);
        
        setErrorMessage(errorMsg);
        toast({
          title: "Erreur d'invitation",
          description: errorMsg,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check if response indicates success
      if (responseData?.success) {
        logger.log('✅ Réponse Edge Function:', responseData);
        const successMsg = `Invitation envoyée à ${email}. L'utilisateur doit finaliser son compte par email.`;
        setSuccessMessage(successMsg);
        toast({
          title: "✅ Invitation envoyée",
          description: successMsg,
          duration: 5000,
        });

        // Reset form
        setFormData({
          prenom: '',
          nom: '',
          email: '',
          role_id: null,
          active: true,
          photo_profil_url: '',
        });

        // Call onCreated callback if provided
        if (onCreated && typeof onCreated === 'function') {
          onCreated(responseData);
        }

        // Navigate after a short delay
        setTimeout(() => {
          navigate('/utilisateurs');
        }, 2000);
      } else {
        // Handle case where success is false but no error thrown
        // Extract error message from responseData
        let errorMsg = 'L\'invitation a échoué.';
        
        if (responseData?.error) {
          errorMsg = typeof responseData.error === 'string' ? responseData.error : responseData.error.message || errorMsg;
        }
        
        setErrorMessage(errorMsg);
        toast({
          title: "Erreur d'invitation",
          description: errorMsg,
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (error) {
      logger.error('❌ Erreur inattendue:', error);
      const errorMsg = error.message || 'Une erreur inattendue est survenue.';
      setErrorMessage(errorMsg);
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleUpdate = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          // Prepare and sanitize data before update
          const updateData = {
              prenom: formData.prenom,
              nom: formData.nom,
              full_name: `${formData.prenom} ${formData.nom}`,
              photo_profil_url: formData.photo_profil_url,
              role_id: formData.role_id || null,
              statut: formData.active ? 'actif' : 'suspendu',
          };
          const sanitizedUpdateData = sanitizeFormData(updateData);
          
          const { error } = await supabase.from('utilisateurs').update(sanitizedUpdateData).eq('id', id);
          if (error) throw error;
          toast({ title: "Succès", description: "Utilisateur mis à jour." });
          fetchUser();
      } catch (error) {
          logger.error('Error updating user:', error);
          toast({ 
            title: "Impossible de mettre à jour l'utilisateur", 
            description: "Une erreur est survenue lors de la mise à jour. Vérifiez que tous les champs sont correctement remplis et réessayez.",
            variant: "destructive" 
          });
      } finally {
          setLoading(false);
      }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      handleUpdate(e);
    } else {
      handleInviteUser(e);
    }
  };

  if (pageLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-secondary-600" /></div>;
  }

  const isFormDirty = isEditing && JSON.stringify(formData) !== JSON.stringify(initialData);

  return (
    <>
      <Helmet><title>{isEditing ? 'Fiche Utilisateur' : 'Inviter un Utilisateur'} | Effinor Admin</title></Helmet>
      <div className="space-y-8 max-w-5xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100/50 min-h-screen p-6 md:p-8">
        <div className="flex items-center gap-4 fade-in">
            <Link to="/utilisateurs">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 border-2 border-gray-300 hover:border-gray-400 hover:bg-white transition-all group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </Button>
            </Link>
            {isEditing ? (
                 <div className="flex items-center gap-5">
                    <Avatar className="h-16 w-16 ring-4 ring-white shadow-xl">
                        <AvatarImage src={formData.photo_profil_url} />
                        <AvatarFallback className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white font-bold text-xl">
                          {`${(formData.prenom || '').charAt(0)}${(formData.nom || '').charAt(0)}`}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">{formData.full_name}</h1>
                        <p className="text-gray-600 mt-1">{formData.email}</p>
                    </div>
                </div>
            ) : (
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Inviter un nouvel utilisateur</h1>
                  <p className="text-gray-600 mt-2">Créez un nouveau compte utilisateur pour votre équipe</p>
                </div>
            )}
        </div>
        <form onSubmit={handleFormSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="enterprise-card p-8 space-y-6">
                    <div className="pb-4 border-b border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900">Profil</h2>
                        <p className="text-sm text-gray-600 mt-1">Informations personnelles de l'utilisateur</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="prenom" className="text-sm font-semibold text-gray-700">Prénom *</Label>
                        <Input 
                          id="prenom" 
                          name="prenom" 
                          value={formData.prenom} 
                          onChange={handleInputChange} 
                          placeholder="Jean" 
                          required
                          className="enterprise-input h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nom" className="text-sm font-semibold text-gray-700">Nom *</Label>
                        <Input 
                          id="nom" 
                          name="nom" 
                          value={formData.nom} 
                          onChange={handleInputChange} 
                          placeholder="Dupont" 
                          required
                          className="enterprise-input h-11"
                        />
                      </div>
                    </div>
                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email *</Label>
                            <Input 
                              id="email" 
                              name="email" 
                              type="email" 
                              value={formData.email} 
                              onChange={handleInputChange} 
                              placeholder="jean.dupont@email.com" 
                              required
                              className="enterprise-input h-11"
                            />
                            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                              <span>ℹ️</span>
                              L'utilisateur devra s'inscrire avec cet email.
                            </p>
                        </div>
                    )}
                     {isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="photo_profil_url" className="text-sm font-semibold text-gray-700">URL de l'avatar</Label>
                            <Input 
                              id="photo_profil_url" 
                              name="photo_profil_url" 
                              value={formData.photo_profil_url} 
                              onChange={handleInputChange} 
                              placeholder="https://..." 
                              className="enterprise-input h-11"
                            />
                        </div>
                    )}
                </div>

                <div className="enterprise-card p-8 space-y-6">
                    <div className="pb-4 border-b border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-900">Rôle & Statut</h2>
                        <p className="text-sm text-gray-600 mt-1">Configuration du compte et des permissions</p>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="role_id" className="text-sm font-semibold text-gray-700">Rôle</Label>
                          {rolesLoading ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Chargement des rôles...</span>
                            </div>
                          ) : (
                            <Select 
                              name="role_id" 
                              value={formData.role_id || ''} 
                              onValueChange={(v) => handleSelectChange('role_id', v)}
                            >
                              <SelectTrigger className="enterprise-input h-11">
                                <SelectValue placeholder="Sélectionner un rôle" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.length > 0 ? (
                                  roles.map((role) => (
                                    <SelectItem 
                                      key={role.id} 
                                      value={role.id} 
                                      className="cursor-pointer"
                                    >
                                      {role.nom || role.label || role.slug}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="" className="cursor-pointer" disabled>
                                    Aucun rôle disponible
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 pt-8">
                            <Switch 
                              id="active" 
                              name="active" 
                              checked={formData.active} 
                              onCheckedChange={(c) => handleSwitchChange('active', c)} 
                              className="data-[state=checked]:bg-secondary-500"
                            />
                            <Label htmlFor="active" className="text-sm font-semibold text-gray-700 cursor-pointer">
                              Statut : <span className="font-bold capitalize text-gray-900">{formData.active ? 'Actif' : 'Inactif'}</span>
                            </Label>
                        </div>
                    </div>
                </div>

                 <div className="flex justify-end pt-4">
                    {isEditing ? (
                        <Button 
                          type="submit" 
                          disabled={loading || !isFormDirty} 
                          className="enterprise-button enterprise-button-primary h-12 px-8 shadow-lg shadow-secondary-500/30"
                        >
                           {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                           <span className="font-semibold">Enregistrer</span>
                        </Button>
                    ) : (
                        <>
                          {errorMessage && (
                            <div className="text-red-600 text-sm mt-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                              {errorMessage}
                            </div>
                          )}
                          {successMessage && (
                            <div className="text-emerald-600 text-sm mt-2 mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                              {successMessage}
                            </div>
                          )}
                          <Button 
                            type="submit" 
                            disabled={loading || !isEmailValid || !formData.prenom || !formData.nom} 
                            className="enterprise-button enterprise-button-primary h-12 px-8 shadow-lg shadow-secondary-500/30"
                          >
                              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                              <span className="font-semibold">
                                {loading ? 'Invitation en cours...' : 'Envoyer l\'invitation'}
                              </span>
                          </Button>
                        </>
                    )}
                 </div>
            </div>
            {isEditing && (
                <div className="space-y-6">
                    <div className="enterprise-card p-6 space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">Métadonnées</h2>
                        <div className="text-sm space-y-3 text-gray-600">
                           <div>
                             <span className="font-semibold text-gray-700">ID:</span>
                             <p className="font-mono text-xs break-all mt-1 p-2 bg-gray-50 rounded border border-gray-200">{id}</p>
                           </div>
                           <div>
                             <span className="font-semibold text-gray-700">Créé le:</span>
                             <p className="mt-1">{formData.created_at ? new Date(formData.created_at).toLocaleString('fr-FR') : 'N/A'}</p>
                           </div>
                           <div>
                             <span className="font-semibold text-gray-700">Mis à jour le:</span>
                             <p className="mt-1">{formData.updated_at ? new Date(formData.updated_at).toLocaleString('fr-FR') : 'N/A'}</p>
                           </div>
                        </div>
                    </div>
                     <div className="enterprise-card p-6 space-y-4 border-2 border-red-200">
                        <h2 className="text-xl font-bold text-red-600 border-b border-red-100 pb-3">Zone de danger</h2>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full h-11 bg-red-600 hover:bg-red-700 shadow-lg hover:shadow-xl transition-all" disabled>
                              <Trash2 className="mr-2 h-4 w-4" />Supprimer l'utilisateur
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                La suppression d'un utilisateur est une action critique qui doit être effectuée depuis une fonction sécurisée. Cette fonction n'est pas encore implémentée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                     </div>
                </div>
            )}
        </div>
        </form>
      </div>
    </>
  );
};

export default AdminUserForm;