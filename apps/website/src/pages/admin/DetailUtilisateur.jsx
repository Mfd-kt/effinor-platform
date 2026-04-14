import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, Save, KeyRound, UserMinus, UserPlus, Trash2, Upload, Camera, User, Mail, Phone, Briefcase, Building, Users, FileText, Calendar, Shield, AlertTriangle } from 'lucide-react';
import UserAvatar from '@/components/ui/UserAvatar';
import { updateUser, resetUserPassword, deleteUser } from '@/lib/api/utilisateurs';
import { AVAILABLE_PERMISSIONS } from '@/lib/api/roles';
import { validateEmail, validateFrenchPhone } from '@/utils/formUtils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
const DetailUtilisateur = () => {
  // Note: La vérification des permissions est gérée par RequireRole dans App.jsx
  // Pas besoin de double vérification ici
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const [currentProfile, setCurrentProfile] = useState(null);

  // Load current user's profile from utilisateurs table (for permission checks)
  useEffect(() => {
    const loadCurrentUserProfile = async () => {
      if (!authUser?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('utilisateurs')
          .select(`
            *,
            role:roles!utilisateurs_role_id_fkey(slug, label, nom)
          `)
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading current user profile:', error);
          return;
        }

        if (data) {
          setCurrentProfile(data);
        }
      } catch (error) {
        console.error('Error loading current user profile:', error);
      }
    };

    loadCurrentUserProfile();
  }, [authUser?.id]);
  
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    poste: '',
    departement: '',
    equipe: '',
    bio: '',
    statut: 'actif'
  });
  
  // Role state (separate from formData)
  const [roleId, setRoleId] = useState('');
  const [roleSlug, setRoleSlug] = useState('');
  const [permissions, setPermissions] = useState([]);
  
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Charger les rôles système
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('id, slug, label, description, permissions, is_system')
        .eq('is_system', true)
        .order('label', { ascending: true });

      if (rolesError) throw rolesError;
      setRoles(rolesData ?? []);

      // 2) Charger l'utilisateur avec role_id et relation role
      const { data: userData, error: userError } = await supabase
        .from('utilisateurs')
        .select(`
          id, prenom, nom, email, telephone, poste, departement, equipe, bio, statut, role_id, permissions,
          role:roles!utilisateurs_role_id_fkey(id, slug, label, nom)
        `)
        .eq('id', id)
        .single();

      if (userError) throw userError;

      setUser(userData);
      setFormData({
        prenom: userData.prenom || '',
        nom: userData.nom || '',
        email: userData.email || '',
        telephone: userData.telephone || '',
        poste: userData.poste || '',
        departement: userData.departement || '',
        equipe: userData.equipe || '',
        bio: userData.bio || '',
        statut: userData.statut || 'actif'
      });
      
      // Set role state
      setRoleId(userData.role_id || '');
      setRoleSlug(userData.role?.slug || '');
      setPermissions(Array.isArray(userData.permissions) ? userData.permissions : []);
    } catch (error) {
      console.error('Erreur chargement roles/utilisateur', error);
      const errorMessage = error.message || 'Impossible de charger les informations de l\'utilisateur.';
      setError(errorMessage);
      
      // Vérifier si c'est une erreur de colonne manquante ou table manquante
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        const missingColumn = error.message.match(/column "([^"]+)" does not exist/)?.[1];
        toast({
          variant: 'destructive',
          title: 'Erreur de structure',
          description: `La colonne "${missingColumn}" n'existe pas dans la table 'utilisateurs'. Veuillez la créer dans Supabase.`,
        });
      } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        toast({
          variant: 'destructive',
          title: 'Table manquante',
          description: 'La table "utilisateurs" n\'existe pas. Veuillez la créer dans Supabase.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'Type de fichier invalide',
          description: 'Utilisez JPG, PNG ou WebP.'
        });
        return;
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Fichier trop volumineux',
          description: 'Taille maximum: 2MB.'
        });
        return;
      }

      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const updates = {
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        telephone: formData.telephone?.trim() || null,
        poste: formData.poste?.trim() || null,
        departement: formData.departement?.trim() || null,
        equipe: formData.equipe?.trim() || null,
        bio: formData.bio?.trim() || null
      };

      const result = await updateUser(id, updates, photoFile);
      
      if (result.success) {
        toast({
          title: '✅ Informations mises à jour',
          description: 'Les modifications ont été enregistrées avec succès.'
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        loadData();
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour les informations.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRole = async () => {
    if (!user) return;
    if (!roleId) {
      toast({
        variant: 'destructive',
        title: 'Rôle manquant',
        description: "Choisis un rôle avant d'enregistrer.",
      });
      return;
    }

    setSaving(true);
    try {
      const updates = {
        role_id: roleId || null,
        permissions: permissions,
      };

      console.log('Mise à jour utilisateur:', user.id, updates);

      const { error } = await supabase
        .from('utilisateurs')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: '✅ Rôle mis à jour',
        description: "Le rôle de l'utilisateur a bien été enregistré.",
      });
      
      // Reload data to reflect changes
      loadData();
    } catch (error) {
      console.error('Erreur mise à jour rôle:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || "Impossible d'enregistrer le rôle.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    setResetPasswordDialogOpen(false);
    setSaving(true);
    try {
      const result = await resetUserPassword(id);
      setNewPassword(result.newPassword);
      toast({
        title: '✅ Mot de passe réinitialisé',
        description: 'Un nouveau mot de passe a été généré.'
      });
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de réinitialiser le mot de passe.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = formData.statut === 'actif' ? 'suspendu' : 'actif';
    setSaving(true);
    try {
      const result = await updateUser(id, { statut: newStatus });
      if (result.success) {
        toast({
          title: `✅ Utilisateur ${newStatus === 'actif' ? 'activé' : 'suspendu'}`,
          description: `Le statut a été mis à jour.`
        });
        loadData();
      }
    } catch (error) {
      console.error('Erreur changement statut:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de changer le statut.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteDialogOpen(false);
    setSaving(true);
    try {
      await deleteUser(id);
      toast({
        title: '✅ Utilisateur supprimé',
        description: 'L\'utilisateur a été supprimé avec succès.'
      });
      navigate('/utilisateurs');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'utilisateur.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (newRoleId) => {
    const selectedRole = roles.find((r) => r.id === newRoleId);
    if (!selectedRole) return;

    setRoleId(selectedRole.id);
    setRoleSlug(selectedRole.slug); // ex: 'commercial', 'admin', 'callcenter'
    setPermissions(Array.isArray(selectedRole.permissions) ? selectedRole.permissions : []);
  };

  const handlePermissionToggle = (permission) => {
    setPermissions(prev => {
      const currentPerms = prev || [];
      const newPerms = currentPerms.includes(permission)
        ? currentPerms.filter(p => p !== permission)
        : [...currentPerms, permission];
      return newPerms;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  if (!user && !loading && error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/admin/utilisateurs')}>
            Retour à la liste
          </Button>
          <Button variant="outline" onClick={fetchUser}>
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    const isUsersRoute = window.location.pathname.includes('/admin/users/');
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          {error ? 'Erreur de chargement' : 'Utilisateur introuvable'}
        </h1>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-2xl mx-auto">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        <div className="flex gap-4 justify-center">
          <Button 
            onClick={() => navigate('/utilisateurs')}
          >
            Retour à la liste
          </Button>
          {error && (
            <Button variant="outline" onClick={fetchUser}>
              Réessayer
            </Button>
          )}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Informations générales', icon: User },
    { id: 'role', label: 'Rôle & Permissions', icon: Shield },
    { id: 'activity', label: 'Activité', icon: Calendar },
    { id: 'danger', label: 'Zone dangereuse', icon: AlertTriangle }
  ];

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    const [resource] = perm.id.split('.');
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {});

  return (
    <>
      <Helmet>
        <title>{user.full_name || user.email} | Détail Utilisateur | Effinor Admin</title>
      </Helmet>

      <div className="admin-page p-4 md:p-8">
        {/* Header - Design Enterprise */}
        <div className="mb-8 fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/utilisateurs')}
            className="mb-6 text-gray-600 hover:text-gray-900 hover:bg-white/80 transition-all group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour à la liste
          </Button>
          
          {/* Profile Header Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-6">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                <div className="relative">
                  <UserAvatar 
                    user={photoPreview ? { ...user, photo_profil_url: photoPreview } : user} 
                    size="xl" 
                    className="ring-4 ring-white shadow-xl"
                  />
                  <label className="absolute bottom-0 right-0 bg-gradient-to-br from-secondary-500 to-secondary-600 text-white rounded-full p-2.5 cursor-pointer hover:from-secondary-600 hover:to-secondary-700 transition-all shadow-lg hover:shadow-xl hover:scale-110 active:scale-95">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 tracking-tight">
                  {user.full_name || `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email}
                </h1>
                <p className="text-gray-500 mb-4 flex items-center gap-2">
                  <span>{user.email}</span>
                  {user.telephone && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span>{user.telephone}</span>
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${formData.statut === 'actif' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-sm' 
                    : 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 shadow-sm'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${formData.statut === 'actif' ? 'bg-white animate-pulse' : 'bg-white'}`} />
                    {formData.statut || 'actif'}
                  </Badge>
                  {roleSlug && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-sm">
                      {roles.find(r => r.slug === roleSlug || r.id === roleId)?.label || roleSlug}
                    </Badge>
                  )}
                  {user.poste && (
                    <Badge variant="outline" className="border-gray-300 text-gray-700">
                      {user.poste}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {photoPreview && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">Nouvelle photo sélectionnée</p>
              <img src={photoPreview} alt="Preview" className="h-20 w-20 rounded-full object-cover" />
            </div>
          )}

          {newPassword && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">✅ Nouveau mot de passe généré</h4>
              <div className="bg-white rounded p-3 mb-2 font-mono text-lg text-center font-bold text-green-700">
                {newPassword}
              </div>
              <p className="text-xs text-green-700">
                ⚠️ Notez ce mot de passe ! Il sera envoyé à l'utilisateur par email.
              </p>
            </div>
          )}
        </div>

        {/* Tabs - Design Enterprise */}
        <div className="mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-5 py-3 rounded-lg font-medium whitespace-nowrap
                  transition-all duration-200 ease-out
                  ${activeTab === tab.id
                    ? 'bg-white text-secondary-600 shadow-md shadow-secondary-500/10 scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                  }
                `}
              >
                <tab.icon className={`h-4 w-4 transition-transform ${activeTab === tab.id ? 'scale-110' : ''}`} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-secondary-500 to-transparent rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6 fade-in">
          {/* Tab 1: Informations générales */}
          {activeTab === 'general' && (
            <Card className="enterprise-card">
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-xl font-bold text-gray-900">Informations générales</CardTitle>
                <CardDescription className="text-gray-600 mt-1">Modifiez les informations personnelles de l'utilisateur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="text-sm font-semibold text-gray-700">Prénom *</Label>
                    <Input
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => handleChange('prenom', e.target.value)}
                      placeholder="Jean"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-sm font-semibold text-gray-700">Nom *</Label>
                    <Input
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => handleChange('nom', e.target.value)}
                      placeholder="Dupont"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="h-11 bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                      <span>ℹ️</span>
                      L'email ne peut pas être modifié
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telephone" className="text-sm font-semibold text-gray-700">Téléphone</Label>
                    <Input
                      id="telephone"
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => handleChange('telephone', e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="poste" className="text-sm font-semibold text-gray-700">Poste</Label>
                    <Input
                      id="poste"
                      value={formData.poste}
                      onChange={(e) => handleChange('poste', e.target.value)}
                      placeholder="Chef de projet"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departement" className="text-sm font-semibold text-gray-700">Département</Label>
                    <Input
                      id="departement"
                      value={formData.departement}
                      onChange={(e) => handleChange('departement', e.target.value)}
                      placeholder="Commercial"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="equipe" className="text-sm font-semibold text-gray-700">Équipe</Label>
                    <Input
                      id="equipe"
                      value={formData.equipe}
                      onChange={(e) => handleChange('equipe', e.target.value)}
                      placeholder="Équipe Nord"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-semibold text-gray-700">Biographie</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Description de l'utilisateur..."
                    rows="4"
                    className="resize-none"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <Button
                    onClick={handleSaveGeneral}
                    disabled={saving}
                    className="bg-secondary-500 hover:bg-secondary-600 text-white h-11 px-6"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab 2: Rôle & Permissions */}
          {activeTab === 'role' && (
            <Card>
              <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle className="text-xl font-bold text-gray-900">Rôle & Permissions</CardTitle>
                <CardDescription className="text-gray-600 mt-1">Gérez le rôle et les permissions de l'utilisateur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={roleId || ''} onValueChange={handleRoleChange}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {roleSlug && roles.find(r => r.slug === roleSlug || r.id === roleId)?.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {roles.find(r => r.slug === roleSlug || r.id === roleId)?.description}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Permissions</Label>
                  <div className="mt-2 space-y-4 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                    {Object.entries(groupedPermissions).map(([resource, perms]) => (
                      <div key={resource} className="space-y-3">
                        <h4 className="font-bold text-sm text-gray-900 capitalize border-b border-gray-200 pb-2">{resource}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-2">
                          {perms.map((perm) => (
                            <label key={perm.id} className="flex items-center space-x-3 text-sm cursor-pointer p-2 rounded-lg hover:bg-white transition-colors group">
                              <input
                                type="checkbox"
                                checked={permissions?.includes(perm.id)}
                                onChange={() => handlePermissionToggle(perm.id)}
                                className="rounded"
                              />
                              <span>{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSaveRole}
                  disabled={saving}
                  className="bg-secondary-500 hover:bg-secondary-600"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer le rôle et les permissions
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tab 3: Activité */}
          {activeTab === 'activity' && (
            <Card>
              <CardHeader>
                <CardTitle>Activité</CardTitle>
                <CardDescription>Historique des connexions et actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Dernière connexion</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {user.derniere_connexion 
                        ? new Date(user.derniere_connexion).toLocaleString('fr-FR')
                        : 'Jamais connecté'}
                    </p>
                  </div>
                  
                  <div>
                    <Label>Date de création</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {user.created_at 
                        ? new Date(user.created_at).toLocaleString('fr-FR')
                        : '-'}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-500">
                      L'historique des actions sera disponible prochainement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab 4: Danger Zone */}
          {activeTab === 'danger' && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Zone dangereuse</CardTitle>
                <CardDescription>Actions irréversibles sur le compte utilisateur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold mb-2">Réinitialiser le mot de passe</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Génère un nouveau mot de passe temporaire pour cet utilisateur.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setResetPasswordDialogOpen(true)}
                      disabled={saving}
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Réinitialiser le mot de passe
                    </Button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold mb-2">
                      {formData.statut === 'actif' ? 'Suspendre' : 'Activer'} l'utilisateur
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {formData.statut === 'actif' 
                        ? 'L\'utilisateur ne pourra plus se connecter.'
                        : 'L\'utilisateur pourra à nouveau se connecter.'}
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleToggleStatus}
                      disabled={saving}
                      className={formData.statut === 'actif' ? 'border-yellow-500 text-yellow-600' : 'border-green-500 text-green-600'}
                    >
                      {formData.statut === 'actif' ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-2" />
                          Suspendre
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Activer
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-4 border-2 border-red-300 rounded-lg bg-red-50">
                    <h4 className="font-semibold text-red-900 mb-2">Supprimer l'utilisateur</h4>
                    <p className="text-sm text-red-800 mb-4">
                      Cette action est irréversible. L'utilisateur et son compte d'authentification seront supprimés définitivement.
                    </p>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer l'utilisateur
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur <strong>{user.full_name || user.email}</strong> ? Cette action est irréversible et supprimera également le compte d'authentification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <AlertDialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
            <AlertDialogDescription>
              Un nouveau mot de passe sera généré automatiquement pour {user.full_name || user.email}. Vous devrez le communiquer à l'utilisateur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              className="bg-secondary-500 hover:bg-secondary-600"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DetailUtilisateur;
