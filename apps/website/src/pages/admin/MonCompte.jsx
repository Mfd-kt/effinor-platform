/**
 * Page "Mon compte" - Gestion du profil utilisateur
 * 
 * Design premium niveau SaaS (Linear, Notion, Stripe Dashboard)
 * avec upload d'avatar dans Supabase Storage, compression automatique,
 * et mise à jour réactive via UserContext.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import { sanitizeFormData } from '@/utils/sanitize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Upload, Check, X, Calendar, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import UserAvatar from '@/components/common/UserAvatar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Header de la page avec titre, sous-titre et badge rôle
 */
const AccountHeader = ({ profile, userRole, onBack }) => {
  const memberSince = profile?.created_at 
    ? format(new Date(profile.created_at), "MMMM yyyy", { locale: fr })
    : null;

  return (
    <div className="bg-white border-b border-slate-200 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-9 w-9 -ml-2"
              aria-label="Retour au dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                Mon compte
              </h1>
              <p className="text-slate-600 mt-1.5 text-sm md:text-base">
                Gérez vos informations personnelles et votre profil Effinor Admin
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant="outline" 
              className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"
            >
              {userRole || 'user'}
            </Badge>
            {memberSince && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3 w-3" />
                <span>Membre depuis {memberSince}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Carte hero avec résumé du compte
 */
const AccountHeroCard = ({ profile, formData, displayName, userRole, onAvatarClick }) => {
  const memberSince = profile?.created_at 
    ? format(new Date(profile.created_at), "MMMM yyyy", { locale: fr })
    : null;

  return (
    <Card className="rounded-2xl border border-slate-200 shadow-md bg-white overflow-hidden">
      <CardContent className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar cliquable */}
          <button
            type="button"
            onClick={onAvatarClick}
            className="flex-shrink-0 group relative focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-full transition-transform hover:scale-105"
            aria-label="Changer la photo de profil"
          >
            <UserAvatar 
              user={profile || { ...formData, full_name: displayName }} 
              size="2xl"
              className="ring-4 ring-slate-100 group-hover:ring-emerald-100 transition-all"
            />
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <Upload className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-1">
              {displayName}
            </h2>
            <p className="text-slate-600 text-sm md:text-base mb-3">
              {formData.email || profile?.email || '—'}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge 
                variant="outline" 
                className="bg-slate-50 text-slate-700 border-slate-200"
              >
                {userRole || 'user'}
              </Badge>
              {memberSince && (
                <span className="text-xs text-slate-500">
                  Membre depuis {memberSince}
                </span>
              )}
            </div>
          </div>

          {/* Action secondaire */}
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex"
            disabled
          >
            <Activity className="h-4 w-4 mr-2" />
            Voir mon activité
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Section carte pour les champs de formulaire
 */
const AccountSectionCard = ({ title, description, children, className = '' }) => {
  return (
    <Card className={`rounded-2xl border border-slate-200 shadow-sm bg-white ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm text-slate-600 mt-1">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
};

/**
 * Groupe de champs avec label et aide
 */
const AccountFieldGroup = ({ label, htmlFor, required, helpText, error, children }) => {
  return (
    <div className="space-y-2">
      <Label 
        htmlFor={htmlFor} 
        className="text-sm font-medium text-slate-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {helpText && !error && (
        <p className="text-xs text-slate-500">{helpText}</p>
      )}
      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const MonCompte = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, loading: profileLoading, refreshProfile } = useUser();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    poste: '',
    photo_profil_url: '',
  });
  const [initialData, setInitialData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [emailNotifications, setEmailNotifications] = useState(true); // Préférence (structure préparée)

  // Initialize form data from profile
  useEffect(() => {
    if (profile && !profileLoading) {
      const data = {
        prenom: profile.prenom || '',
        nom: profile.nom || '',
        email: profile.email || user?.email || '',
        telephone: profile.telephone || '',
        poste: profile.poste || '',
        photo_profil_url: profile.photo_profil_url || profile.avatar_url || '',
      };
      setFormData(data);
      setInitialData(data);
      setPreviewUrl(data.photo_profil_url || null);
    }
  }, [profile, profileLoading, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Compress and resize image before upload
   */
  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Erreur lors de la compression de l\'image'));
              }
            },
            file.type || 'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    });
  };

  /**
   * Handle photo upload with compression
   */
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image (JPG, PNG, WEBP)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image est trop volumineuse (max 5MB)",
        variant: "destructive"
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      // Compress image
      logger.info('Compression de l\'image...', { originalSize: `${(file.size / 1024).toFixed(2)} KB` });
      const compressedBlob = await compressImage(file, 800, 800, 0.8);
      const compressedSize = (compressedBlob.size / 1024).toFixed(2);
      logger.info('Image compressée', { 
        compressedSize: `${compressedSize} KB`, 
        reduction: `${((1 - compressedBlob.size / file.size) * 100).toFixed(1)}%` 
      });

      // Create preview
      const preview = URL.createObjectURL(compressedBlob);
      setPreviewUrl(preview);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: compressedBlob.type
        });

      if (uploadError) {
        // If bucket doesn't exist, fallback to URL input
        logger.warn('Storage upload failed:', uploadError);
        toast({
          title: "Info",
          description: "Le stockage d'images n'est pas configuré. Veuillez utiliser une URL d'image.",
          variant: "default"
        });
        setUploadingPhoto(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, photo_profil_url: publicUrl }));
      toast({
        title: "Photo téléversée",
        description: `Image compressée (${compressedSize} KB) et téléversée avec succès`,
      });
    } catch (error) {
      logger.error('Error uploading photo:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de téléverser la photo",
        variant: "destructive"
      });
      setPreviewUrl(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  /**
   * Remove photo preview
   */
  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, photo_profil_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Reset form to initial values
   */
  const handleReset = () => {
    if (initialData) {
      setFormData(initialData);
      setPreviewUrl(initialData.photo_profil_url || null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: "Formulaire réinitialisé",
        description: "Les modifications non sauvegardées ont été annulées.",
      });
    }
  };

  /**
   * Save profile changes
   */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validation
      if (!formData.prenom.trim() || !formData.nom.trim()) {
        toast({
          title: "Erreur",
          description: "Le prénom et le nom sont obligatoires",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      const updateData = {
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        full_name: `${formData.prenom.trim()} ${formData.nom.trim()}`.trim(),
        photo_profil_url: formData.photo_profil_url || null,
        avatar_url: formData.photo_profil_url || null, // Stocker aussi dans avatar_url pour compatibilité
      };

      // Add optional fields only if they exist
      if (formData.telephone) {
        updateData.telephone = formData.telephone.trim();
      }
      if (formData.poste) {
        updateData.poste = formData.poste.trim();
      }

      const sanitizedData = sanitizeFormData(updateData);

      if (profile?.id) {
        // Update existing profile
        const { error } = await supabase
          .from('utilisateurs')
          .update(sanitizedData)
          .eq('id', profile.id);

        if (error) {
          // Handle missing columns gracefully
          if (error.code === 'PGRST204' && error.message?.includes('column')) {
            logger.warn('Column not found, retrying without optional fields:', error.message);
            const requiredData = {
              prenom: sanitizedData.prenom,
              nom: sanitizedData.nom,
              full_name: sanitizedData.full_name,
              photo_profil_url: sanitizedData.photo_profil_url,
              avatar_url: sanitizedData.avatar_url || sanitizedData.photo_profil_url,
            };
            const { error: retryError } = await supabase
              .from('utilisateurs')
              .update(requiredData)
              .eq('id', profile.id);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }

        // Update auth metadata if possible
        const { error: authError } = await supabase.auth.updateUser({
          data: {
            full_name: updateData.full_name,
            photo_profil_url: updateData.photo_profil_url,
            avatar_url: updateData.avatar_url
          }
        });

        if (authError) {
          logger.warn('Could not update auth metadata:', authError);
        }
      } else {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('utilisateurs')
          .insert({
            auth_user_id: user.id,
            email: user.email,
            ...sanitizedData
          });

        if (insertError) throw insertError;
      }

      // Refresh profile in context
      await refreshProfile();

      toast({
        title: "Profil mis à jour avec succès",
        description: "Vos modifications ont été enregistrées.",
      });

      // Update initial data
      setInitialData({ ...formData });
    } catch (error) {
      logger.error('Error updating profile:', error);
      toast({
        title: "Une erreur est survenue",
        description: error.message || "Impossible de mettre à jour le profil. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600 text-sm">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  const isFormDirty = JSON.stringify(formData) !== JSON.stringify(initialData);
  const displayName = profile?.full_name || `${formData.prenom} ${formData.nom}`.trim() || user?.email || 'Utilisateur';
  const userRole = profile?.role?.slug || 'user';

  return (
    <>
      <Helmet>
        <title>Mon compte | Effinor Admin</title>
      </Helmet>

      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <AccountHeader 
          profile={profile}
          userRole={userRole}
          onBack={() => navigate('/dashboard')}
        />

        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6">
          {/* Hero Card */}
          <AccountHeroCard
            profile={profile}
            formData={formData}
            displayName={displayName}
            userRole={userRole}
            onAvatarClick={() => fileInputRef.current?.click()}
          />

          {/* Personal Information - 2 Columns Layout */}
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column: Photo Upload */}
              <AccountSectionCard
                title="Photo de profil"
                description="Téléversez une image pour personnaliser votre profil"
              >
                <div className="space-y-4">
                  {/* Avatar Preview */}
                  <div className="flex justify-center md:justify-start">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-full transition-transform hover:scale-105"
                      aria-label="Changer la photo de profil"
                    >
                      <UserAvatar 
                        user={profile || { ...formData, photo_profil_url: previewUrl || formData.photo_profil_url, full_name: displayName }} 
                        size="2xl"
                        className="ring-4 ring-slate-100 group-hover:ring-emerald-100 transition-all"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Upload className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  </div>

                  {/* Upload Controls */}
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="flex-1 text-sm"
                        aria-label="Sélectionner une photo"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingPhoto}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {uploadingPhoto ? 'Téléversement...' : 'Choisir'}
                      </Button>
                    </div>

                    {(previewUrl || formData.photo_profil_url) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemovePhoto}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Supprimer la photo
                      </Button>
                    )}

                    <Input
                      type="text"
                      name="photo_profil_url"
                      value={formData.photo_profil_url}
                      onChange={handleInputChange}
                      placeholder="Ou entrez une URL d'image"
                      className="text-sm"
                    />
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Formats acceptés : JPG, PNG, WEBP (max 5MB). 
                    L'image sera automatiquement compressée et redimensionnée à 800×800px max.
                  </p>
                </div>
              </AccountSectionCard>

              {/* Right Column: Personal Info */}
              <AccountSectionCard
                title="Informations personnelles"
                description="Vos coordonnées et informations de contact"
              >
                <div className="space-y-5">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AccountFieldGroup
                      label="Prénom"
                      htmlFor="prenom"
                      required
                    >
                      <Input
                        id="prenom"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        placeholder="Jean"
                        required
                        className="h-11 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        aria-invalid={!formData.prenom.trim() && formData.prenom !== initialData?.prenom}
                      />
                    </AccountFieldGroup>

                    <AccountFieldGroup
                      label="Nom"
                      htmlFor="nom"
                      required
                    >
                      <Input
                        id="nom"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        placeholder="Dupont"
                        required
                        className="h-11 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        aria-invalid={!formData.nom.trim() && formData.nom !== initialData?.nom}
                      />
                    </AccountFieldGroup>
                  </div>

                  {/* Email (read-only) */}
                  <AccountFieldGroup
                    label="Email"
                    htmlFor="email"
                    helpText="L'email ne peut pas être modifié depuis cette page"
                  >
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="h-11 bg-slate-50 text-slate-500 cursor-not-allowed"
                      aria-label="Email (non modifiable)"
                    />
                  </AccountFieldGroup>

                  {/* Phone */}
                  <AccountFieldGroup
                    label="Téléphone"
                    htmlFor="telephone"
                    helpText="Format : +33 6 12 34 56 78"
                  >
                    <Input
                      id="telephone"
                      name="telephone"
                      type="tel"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      placeholder="+33 6 12 34 56 78"
                      className="h-11 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </AccountFieldGroup>

                  {/* Job Title */}
                  <AccountFieldGroup
                    label="Fonction / Poste"
                    htmlFor="poste"
                    helpText="Votre fonction dans l'entreprise"
                  >
                    <Input
                      id="poste"
                      name="poste"
                      value={formData.poste}
                      onChange={handleInputChange}
                      placeholder="Commercial, Support, etc."
                      className="h-11 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </AccountFieldGroup>
                </div>
              </AccountSectionCard>
            </div>

            {/* Preferences Section */}
            <AccountSectionCard
              title="Préférences"
              description="Configurez vos préférences de notification"
              className="mb-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex-1">
                    <Label htmlFor="email-notifications" className="text-sm font-medium text-slate-900 cursor-pointer">
                      Recevoir les notifications par email
                    </Label>
                    <p className="text-xs text-slate-500 mt-1">
                      Vous recevrez des emails pour les nouvelles activités et mises à jour importantes
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    className="ml-4"
                    aria-label="Activer les notifications par email"
                  />
                </div>
              </div>
            </AccountSectionCard>

            {/* Actions Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-4 shadow-lg">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-slate-600">
                  {isFormDirty && (
                    <span className="text-amber-600">Vous avez des modifications non sauvegardées</span>
                  )}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {isFormDirty && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReset}
                      disabled={saving}
                      className="flex-1 sm:flex-initial"
                    >
                      Annuler
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={saving || !isFormDirty}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white flex-1 sm:flex-initial min-w-[180px]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default MonCompte;
