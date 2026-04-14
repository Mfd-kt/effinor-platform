import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

/**
 * Card "Prochaine Action" avec date/time picker, toggle rappel
 */
const NextAction = ({ lead, onSave }) => {
  const [action, setAction] = useState({
    date: lead.prochaine_action_date ? format(new Date(lead.prochaine_action_date), 'yyyy-MM-dd') : '',
    heure: lead.prochaine_action_heure || '',
    type: lead.prochaine_action_type || 'appel',
    description: lead.prochaine_action_description || '',
    rappel: lead.prochaine_action_rappel || false
  });
  const [saving, setSaving] = useState(false);

  const actionTypes = [
    { value: 'appel', label: 'Appel', icon: '📞' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'rdv', label: 'Rendez-vous', icon: '📅' },
    { value: 'tache', label: 'Tâche', icon: '✅' },
    { value: 'suivi', label: 'Suivi', icon: '👀' }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.(action);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-sky-500" />
            Prochaine Action
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </Label>
            <Input
              type="date"
              value={action.date}
              onChange={(e) => setAction(prev => ({ ...prev, date: e.target.value }))}
              className="w-full"
            />
          </div>

          {/* Time */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Heure
            </Label>
            <Input
              type="time"
              value={action.heure}
              onChange={(e) => setAction(prev => ({ ...prev, heure: e.target.value }))}
              className="w-full"
            />
          </div>

          {/* Type */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Type</Label>
            <Select
              value={action.type}
              onValueChange={(value) => setAction(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Description</Label>
            <Textarea
              value={action.description}
              onChange={(e) => setAction(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez l'action à effectuer..."
              rows={3}
              className="w-full resize-none"
            />
          </div>

          {/* Reminder Toggle */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
            <Label htmlFor="reminder" className="text-sm font-medium text-gray-700 cursor-pointer">
              Activer le rappel
            </Label>
            <Switch
              id="reminder"
              checked={action.rappel}
              onCheckedChange={(checked) => setAction(prev => ({ ...prev, rappel: checked }))}
            />
          </div>

          {/* Save Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              onClick={handleSave}
              disabled={saving || !action.date}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NextAction;



























