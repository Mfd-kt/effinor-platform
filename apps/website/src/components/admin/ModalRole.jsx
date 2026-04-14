import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { createRole, updateRole, AVAILABLE_PERMISSIONS } from '@/lib/api/roles';

const ModalRole = ({ open, onOpenChange, role, onSuccess }) => {
  const [formData, setFormData] = useState({
    nom: '',
    label: '',
    description: '',
    color: 'gray',
    permissions: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!role;

  useEffect(() => {
    if (open) {
      if (role) {
        setFormData({
          nom: role.nom || '',
          label: role.label || '',
          description: role.description || '',
          color: role.color || 'gray',
          permissions: Array.isArray(role.permissions) ? role.permissions : []
        });
      } else {
        resetForm();
      }
    }
  }, [open, role]);

  const resetForm = () => {
    setFormData({
      nom: '',
      label: '',
      description: '',
      color: 'gray',
      permissions: []
    });
    setErrors({});
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
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

  const handleSelectAll = (resource) => {
    const resourcePermissions = AVAILABLE_PERMISSIONS
      .filter(p => p.id.startsWith(resource))
      .map(p => p.id);

    setFormData(prev => {
      const currentPerms = prev.permissions || [];
      const allSelected = resourcePermissions.every(p => currentPerms.includes(p));
      
      if (allSelected) {
        // Deselect all
        return { ...prev, permissions: currentPerms.filter(p => !resourcePermissions.includes(p)) };
      } else {
        // Select all
        const newPerms = [...currentPerms];
        resourcePermissions.forEach(p => {
          if (!newPerms.includes(p)) newPerms.push(p);
        });
        return { ...prev, permissions: newPerms };
      }
    });
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.nom?.trim()) {
      newErrors.nom = 'Le nom du rôle (slug) est requis';
    } else if (!/^[a-z0-9_-]+$/.test(formData.nom.trim())) {
      newErrors.nom = 'Le nom doit contenir uniquement des lettres minuscules, chiffres, tirets et underscores';
    }
    
    if (!formData.label?.trim()) {
      newErrors.label = 'Le label est requis';
    }
    
    if (formData.permissions.length === 0 && !formData.permissions.includes('all')) {
      newErrors.permissions = 'Au moins une permission est requise';
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
      const roleData = {
        nom: formData.nom.trim().toLowerCase(),
        label: formData.label.trim(),
        description: formData.description?.trim() || null,
        color: formData.color,
        permissions: formData.permissions,
        is_system: false // Les rôles créés via l'interface ne sont pas système
      };

      if (isEditing) {
        const result = await updateRole(role.id, roleData);
        if (result.success) {
          toast({
            title: '✅ Rôle mis à jour',
            description: `Le rôle "${roleData.label}" a été mis à jour avec succès.`
          });
        }
      } else {
        const result = await createRole(roleData);
        if (result.success) {
          toast({
            title: '✅ Rôle créé',
            description: `Le rôle "${roleData.label}" a été créé avec succès.`
          });
        }
      }

      resetForm();
      onOpenChange(false);
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error('Erreur sauvegarde rôle:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la sauvegarde.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Grouper les permissions par ressource
  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    const parts = perm.id.split('.');
    const resource = parts.length > 1 ? parts[0] : 'general';
    
    if (!acc[resource]) {
      acc[resource] = {
        label: resource === 'general' ? 'Général' : resource.charAt(0).toUpperCase() + resource.slice(1),
        permissions: []
      };
    }
    acc[resource].permissions.push(perm);
    return acc;
  }, {});

  const colorOptions = [
    { value: 'red', label: 'Rouge', color: 'bg-red-500' },
    { value: 'blue', label: 'Bleu', color: 'bg-blue-500' },
    { value: 'green', label: 'Vert', color: 'bg-green-500' },
    { value: 'yellow', label: 'Jaune', color: 'bg-yellow-500' },
    { value: 'purple', label: 'Violet', color: 'bg-purple-500' },
    { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { value: 'gray', label: 'Gris', color: 'bg-gray-500' }
  ];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !loading) {
        resetForm();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le rôle' : 'Créer un rôle'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifiez les informations du rôle et ses permissions.'
              : 'Créez un nouveau rôle avec des permissions personnalisées.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom">Nom du rôle (slug) *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => handleChange('nom', e.target.value)}
                placeholder="commercial_nord"
                disabled={isEditing && role?.is_system}
                className={errors.nom ? 'border-red-500' : ''}
              />
              {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Utilisez uniquement des lettres minuscules, chiffres, tirets et underscores
              </p>
            </div>

            <div>
              <Label htmlFor="label">Label (nom d'affichage) *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => handleChange('label', e.target.value)}
                placeholder="Commercial Nord"
                className={errors.label ? 'border-red-500' : ''}
              />
              {errors.label && <p className="text-xs text-red-500 mt-1">{errors.label}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Description du rôle..."
              rows="3"
            />
          </div>

          <div>
            <Label htmlFor="color">Couleur du badge</Label>
            <Select value={formData.color} onValueChange={(value) => handleChange('color', value)}>
              <SelectTrigger id="color">
                <SelectValue placeholder="Sélectionnez une couleur" />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${option.color}`}></div>
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Permissions *</Label>
            {errors.permissions && <p className="text-xs text-red-500 mb-2">{errors.permissions}</p>}
            <div className="mt-2 border rounded-lg p-4 max-h-96 overflow-y-auto space-y-4">
              {Object.entries(groupedPermissions).map(([resource, group]) => (
                <div key={resource} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm text-gray-700 capitalize">{group.label}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectAll(resource)}
                      className="text-xs"
                    >
                      {group.permissions.every(p => formData.permissions.includes(p.id))
                        ? 'Tout désélectionner'
                        : 'Tout sélectionner'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-4">
                    {group.permissions.map((perm) => (
                      <label key={perm.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <Checkbox
                          checked={formData.permissions.includes(perm.id)}
                          onCheckedChange={() => handlePermissionToggle(perm.id)}
                          disabled={loading}
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-secondary-500 hover:bg-secondary-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEditing ? 'Enregistrement...' : 'Création...'}
                </>
              ) : (
                <>
                  {isEditing ? 'Enregistrer' : 'Créer le rôle'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalRole;




























