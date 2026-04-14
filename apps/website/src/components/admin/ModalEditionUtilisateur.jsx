import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, KeyRound } from 'lucide-react';
import { getUserById, updateUser, resetUserPassword, ROLES } from '@/lib/api/utilisateurs';
import { getAllRoles } from '@/lib/api/roles';
import { validateEmail, validateFrenchPhone } from '@/utils/formUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const ModalEditionUtilisateur = ({ open, onOpenChange, userId, onSuccess }) => {
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    role: 'lecture',
    statut: 'actif'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState(null);
  const [roles, setRoles] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId) {
      fetchUser();
      loadRoles();
    } else {
      resetForm();
    }
  }, [open, userId]);

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

  const fetchUser = async () => {
    setFetching(true);
    try {
      const result = await getUserById(userId);
      if (result.success && result.data) {
        setFormData({
          prenom: result.data.prenom || '',
          nom: result.data.nom || '',
          telephone: result.data.telephone || '',
          role: result.data.role || 'lecture',
          statut: result.data.statut || 'actif'
        });
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les informations de l\'utilisateur.'
      });
    } finally {
      setFetching(false);
    }
  };

  const resetForm = () => {
    setFormData({
      prenom: '',
      nom: '',
      telephone: '',
      role: 'lecture',
      statut: 'actif'
    });
    setErrors({});
    setNewPassword(null);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.prenom?.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }
    
    if (!formData.nom?.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    
    if (formData.telephone && !validateFrenchPhone(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
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
      const updates = {
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        telephone: formData.telephone?.trim() || null,
        role: formData.role,
        statut: formData.statut
      };

      const result = await updateUser(userId, updates);
      
      toast({
        title: '✅ Utilisateur mis à jour !',
        description: 'Les modifications ont été enregistrées avec succès.',
      });

      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la mise à jour.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetPasswordOpen(false);
    setLoading(true);

    try {
      const result = await resetUserPassword(userId);
      setNewPassword(result.newPassword);

      toast({
        title: '✅ Mot de passe réinitialisé !',
        description: 'Un nouveau mot de passe a été généré.',
      });

    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de réinitialiser le mot de passe.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-secondary-500" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen && !loading) {
          resetForm();
        }
        onOpenChange(isOpen);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scale-in">
          <DialogHeader className="pb-4 border-b border-gray-100">
            <DialogTitle className="text-2xl font-bold text-gray-900">Modifier l'utilisateur</DialogTitle>
            <DialogDescription className="text-gray-600 mt-1.5">
              Mettez à jour les informations de l'utilisateur. L'email ne peut pas être modifié.
            </DialogDescription>
          </DialogHeader>

          {newPassword && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-5 mb-6 shadow-lg shadow-green-500/10 fade-in">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">✓</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-green-900 mb-2 text-lg">Mot de passe réinitialisé !</h4>
                  <p className="text-sm text-green-800 mb-3 font-medium">
                    Nouveau mot de passe généré :
                  </p>
                  <div className="bg-white rounded-lg p-4 mb-3 font-mono text-xl text-center font-bold text-green-700 border-2 border-green-300 shadow-sm">
                    {newPassword}
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

            <div className="grid grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold text-gray-700">Rôle *</Label>
                <Select value={formData.role} onValueChange={(value) => handleChange('role', value)} disabled={loading}>
                  <SelectTrigger id="role" className="enterprise-input h-11">
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                  <SelectContent className="enterprise-input">
                    {Object.entries(ROLES).map(([key, role]) => (
                      <SelectItem key={key} value={key} className="cursor-pointer">
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut" className="text-sm font-semibold text-gray-700">Statut *</Label>
                <Select value={formData.statut} onValueChange={(value) => handleChange('statut', value)} disabled={loading}>
                  <SelectTrigger id="statut" className="enterprise-input h-11">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif" className="cursor-pointer">Actif</SelectItem>
                    <SelectItem value="suspendu" className="cursor-pointer">Suspendu</SelectItem>
                    <SelectItem value="parti" className="cursor-pointer">Parti</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-5 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetPasswordOpen(true)}
                disabled={loading}
                className="w-full h-11 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Réinitialiser le mot de passe
              </Button>
            </div>

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
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <span>Enregistrer</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir réinitialiser le mot de passe de cet utilisateur ? Un nouveau mot de passe sera généré automatiquement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetPassword} className="bg-secondary-500 hover:bg-secondary-600">
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ModalEditionUtilisateur;

