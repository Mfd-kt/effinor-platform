import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { createUserWithAuth } from '@/lib/api/utilisateurs';
import { getAllRoles } from '@/lib/api/roles';
import { validateEmail, validateFrenchPhone } from '@/utils/formUtils';

const ModalAjoutUtilisateur = ({ open, onOpenChange, onSuccess }) => {
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    role: 'lecture',
    permissions: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [roles, setRoles] = useState([]);
  const { toast } = useToast();

  // Charger les rôles depuis la base de données
  useEffect(() => {
    if (open) {
      loadRoles();
    }
  }, [open]);

  const loadRoles = async () => {
    try {
      const result = await getAllRoles();
      if (result.success) {
        setRoles(result.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      role: 'lecture',
      permissions: []
    });
    setErrors({});
    setTempPassword(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }

    // Si le rôle change, mettre à jour les permissions par défaut
    if (field === 'role') {
      const selectedRole = roles.find(r => r.nom === value);
      if (selectedRole) {
        setFormData(prev => ({
          ...prev,
          role: value,
          permissions: Array.isArray(selectedRole.permissions) ? selectedRole.permissions : []
        }));
      }
    }
  };

  const handlePermissionToggle = (permission) => {
    setFormData(prev => {
      const currentPerms = prev.permissions || [];
      const newPerms = currentPerms.includes(permission)
        ? currentPerms.filter(p => p !== permission)
        : [...currentPerms, permission];
      return { ...prev, permissions: newPerms };
    });
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.prenom?.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    
    if (!formData.nom?.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    
    if (!formData.email?.trim() || !validateEmail(formData.email)) {
      newErrors.email = 'Un email valide est requis';
    }
    
    if (formData.telephone && !validateFrenchPhone(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
    }
    
    if (!formData.role) {
      newErrors.role = 'Le rôle est requis';
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

    setLoading(true);

    try {
      const result = await createUserWithAuth(formData);
      
      setTempPassword(result.tempPassword);

      toast({
        title: '✅ Utilisateur créé avec succès !',
        description: `${result.profile.full_name} a été ajouté avec succès.`,
      });

      // Attendre 2 secondes avant de fermer pour que l'admin puisse voir le mot de passe
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }, 3000);

    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      
      // Détecter les erreurs spécifiques
      let errorMessage = error.message || 'Une erreur est survenue lors de la création de l\'utilisateur.';
      
      if (error.message?.includes('service_role') || error.message?.includes('JWT')) {
        errorMessage = 'Erreur d\'authentification Supabase Admin. La création d\'utilisateur nécessite une configuration serveur. Contactez le développeur.';
      } else if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        const missingColumn = error.message.match(/column "([^"]+)" does not exist/)?.[1];
        errorMessage = `La colonne "${missingColumn}" n'existe pas dans la table 'utilisateurs'. Veuillez la créer dans Supabase.`;
      } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        errorMessage = 'La table "utilisateurs" n\'existe pas. Veuillez la créer dans Supabase.';
      } else if (error.message?.includes('already registered')) {
        errorMessage = 'Cet email est déjà utilisé par un autre utilisateur.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Erreur de création',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.nom === formData.role);
  const currentRolePermissions = Array.isArray(selectedRole?.permissions) ? selectedRole.permissions : [];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !loading) {
        resetForm();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scale-in">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-bold text-gray-900">Ajouter un utilisateur</DialogTitle>
          <DialogDescription className="text-gray-600 mt-1.5">
            Créez un nouveau compte utilisateur avec authentification Supabase.
          </DialogDescription>
        </DialogHeader>

        {tempPassword && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-5 mb-6 shadow-lg shadow-green-500/10 fade-in">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">✓</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-green-900 mb-2 text-lg">Compte créé !</h4>
                <p className="text-sm text-green-800 mb-3 font-medium">
                  Mot de passe temporaire :
                </p>
                <div className="bg-white rounded-lg p-4 mb-3 font-mono text-xl text-center font-bold text-green-700 border-2 border-green-300 shadow-sm">
                  {tempPassword}
                </div>
                <p className="text-xs text-green-700 flex items-center gap-1">
                  <span className="text-base">⚠️</span>
                  Notez ce mot de passe ! Il sera envoyé à l'utilisateur par email.
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="prenom" className="text-sm font-semibold text-gray-700">Prénom *</Label>
              <Input
                id="prenom"
                value={formData.prenom}
                onChange={(e) => handleChange('prenom', e.target.value)}
                placeholder="Jean"
                className={`enterprise-input h-11 ${errors.prenom ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                disabled={loading}
              />
              {errors.prenom && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.prenom}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-semibold text-gray-700">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="Dupont"
                className={`enterprise-input h-11 ${errors.nom ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                disabled={loading}
              />
              {errors.nom && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.nom}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="jean.dupont@example.com"
              className={`enterprise-input h-11 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              disabled={loading}
            />
            {errors.email && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone" className="text-sm font-semibold text-gray-700">Téléphone</Label>
            <Input
              id="telephone"
              type="tel"
              value={formData.telephone}
              onChange={(e) => handleChange('telephone', e.target.value)}
              placeholder="06 12 34 56 78"
              className={`enterprise-input h-11 ${errors.telephone ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              disabled={loading}
            />
            {errors.telephone && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.telephone}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-semibold text-gray-700">Rôle *</Label>
            <Select value={formData.role} onValueChange={(value) => handleChange('role', value)} disabled={loading}>
              <SelectTrigger id="role" className={`enterprise-input h-11 ${errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                <SelectValue placeholder="Sélectionnez un rôle" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.nom} value={role.nom} className="cursor-pointer">
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-red-600 mt-1.5 font-medium">{errors.role}</p>}
            {selectedRole && Array.isArray(selectedRole.permissions) && selectedRole.permissions.length > 0 && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-1">Permissions:</p>
                <p className="text-xs text-gray-600">
                  {selectedRole.permissions.slice(0, 3).join(', ')}{selectedRole.permissions.length > 3 ? '...' : ''}
                </p>
              </div>
            )}
          </div>

          {formData.role === 'admin' && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <Label className="text-sm font-semibold mb-3 block">Permissions personnalisées</Label>
              <div className="space-y-2">
                {allPermissions.map((perm) => (
                  <div key={perm.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`perm-${perm.id}`}
                      checked={formData.permissions?.includes(perm.id)}
                      onCheckedChange={() => handlePermissionToggle(perm.id)}
                      disabled={loading}
                    />
                    <Label htmlFor={`perm-${perm.id}`} className="text-sm cursor-pointer">
                      {perm.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="pt-6 border-t border-gray-100 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
              className="h-11 px-6 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="enterprise-button enterprise-button-primary h-11 px-6 shadow-lg shadow-secondary-500/30"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer l'utilisateur
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalAjoutUtilisateur;

