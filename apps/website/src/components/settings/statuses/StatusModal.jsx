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
import { createStatus, updateStatus } from '@/lib/api/statuses';

const StatusModal = ({ open, onOpenChange, status, table, onSuccess }) => {
  const needsCode = table === 'lead_statuses';
  
  const [formData, setFormData] = useState({
    code: '',
    slug: '',
    label: '',
    description: '',
    color: 'gray',
    is_default: false,
    is_active: true,
    order_index: 0
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!status;

  useEffect(() => {
    if (open) {
      if (status) {
        setFormData({
          code: status.code || '',
          slug: status.slug || '',
          label: status.label || '',
          description: status.description || '',
          color: status.color || 'gray',
          is_default: status.is_default || false,
          is_active: status.is_active !== undefined ? status.is_active : true,
          order_index: status.pipeline_order || status.order_index || 0
        });
      } else {
        resetForm();
      }
    }
  }, [open, status]);

  const resetForm = () => {
    setFormData({
      code: '',
      slug: '',
      label: '',
      description: '',
      color: 'gray',
      is_default: false,
      is_active: true,
      order_index: 0
    });
    setErrors({});
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (needsCode) {
      if (!formData.code?.trim()) {
        newErrors.code = 'Le code est requis';
      } else if (!/^[A-Z0-9_]+$/.test(formData.code.trim())) {
        newErrors.code = 'Le code doit contenir uniquement des lettres majuscules, chiffres et underscores';
      }
    } else {
      if (!formData.slug?.trim()) {
        newErrors.slug = 'Le slug est requis';
      } else if (!/^[a-z0-9_-]+$/.test(formData.slug.trim())) {
        newErrors.slug = 'Le slug doit contenir uniquement des lettres minuscules, chiffres, tirets et underscores';
      }
    }
    
    if (!formData.label?.trim()) {
      newErrors.label = 'Le label est requis';
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
      const payload = {
        label: formData.label.trim(),
        color: formData.color,
        is_default: formData.is_default,
        order_index: parseInt(formData.order_index) || 0
      };

      // Add table-specific fields
      if (needsCode) {
        payload.code = formData.code.trim().toUpperCase();
      } else {
        payload.slug = formData.slug.trim();
        payload.description = formData.description?.trim() || null;
        payload.is_active = formData.is_active;
      }

      let result;
      if (isEditing) {
        // For editing, don't allow slug/code change if it's a system status (only for non-lead_statuses)
        if (!needsCode && status.is_system) {
          delete payload.slug;
        }
        result = await updateStatus(table, status.id, payload);
      } else {
        result = await createStatus(table, payload);
      }

      if (result.success) {
        toast({
          title: isEditing ? 'Statut mis à jour' : 'Statut créé',
          description: `Le statut "${formData.label}" a été ${isEditing ? 'mis à jour' : 'créé'} avec succès.`
        });
        onSuccess();
      } else {
        throw new Error(result.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving status:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder le statut.'
      });
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    { value: 'gray', label: 'Gris' },
    { value: 'blue', label: 'Bleu' },
    { value: 'green', label: 'Vert' },
    { value: 'yellow', label: 'Jaune' },
    { value: 'red', label: 'Rouge' },
    { value: 'orange', label: 'Orange' },
    { value: 'purple', label: 'Violet' },
    { value: 'slate', label: 'Ardoise' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier le statut' : 'Créer un nouveau statut'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifiez les informations du statut ci-dessous.'
              : 'Remplissez les informations pour créer un nouveau statut.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="label">
                Label <span className="text-red-500">*</span>
              </Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => handleChange('label', e.target.value)}
                placeholder="Ex: Nouveau lead"
                disabled={loading}
              />
              {errors.label && (
                <p className="text-sm text-red-600">{errors.label}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={needsCode ? 'code' : 'slug'}>
                {needsCode ? 'Code' : 'Slug'} (nom technique) <span className="text-red-500">*</span>
              </Label>
              <Input
                id={needsCode ? 'code' : 'slug'}
                value={needsCode ? formData.code : formData.slug}
                onChange={(e) => handleChange(needsCode ? 'code' : 'slug', needsCode ? e.target.value.toUpperCase() : e.target.value.toLowerCase())}
                placeholder={needsCode ? "Ex: NOUVEAU" : "Ex: nouveau-lead"}
                disabled={loading || (isEditing && !needsCode && status.is_system)}
              />
              {errors[needsCode ? 'code' : 'slug'] && (
                <p className="text-sm text-red-600">{errors[needsCode ? 'code' : 'slug']}</p>
              )}
              {isEditing && !needsCode && status.is_system && (
                <p className="text-xs text-gray-500">Le slug d'un statut système ne peut pas être modifié.</p>
              )}
            </div>
          </div>

          {!needsCode && (
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Description du statut..."
                rows={3}
                disabled={loading}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">Couleur</Label>
              <Select
                value={formData.color}
                onValueChange={(value) => handleChange('color', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      {color.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_index">
                {needsCode ? 'Ordre pipeline' : 'Ordre d\'affichage'}
              </Label>
              <Input
                id="order_index"
                type="number"
                value={formData.order_index}
                onChange={(e) => handleChange('order_index', parseInt(e.target.value) || 0)}
                min="0"
                disabled={loading}
                placeholder={needsCode ? "Ex: 10, 20, 30..." : "Ex: 0, 1, 2..."}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => handleChange('is_default', checked)}
                disabled={loading}
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Définir comme statut par défaut
              </Label>
            </div>

            {!needsCode && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked)}
                  disabled={loading}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Statut actif
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onOpenChange}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#22C55E] hover:bg-[#16a34a] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                isEditing ? 'Enregistrer' : 'Créer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StatusModal;

