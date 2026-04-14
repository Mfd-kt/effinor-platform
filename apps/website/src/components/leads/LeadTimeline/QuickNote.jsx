import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';

/**
 * Note rapide avec textarea, markdown support, preview notes récentes, auto-save
 */
const QuickNote = ({ leadId, onAddNote, recentNotes = [] }) => {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const debouncedNote = useDebounce(note, 2000); // Auto-save after 2 seconds

  // Auto-save on debounced note change
  useEffect(() => {
    if (debouncedNote && debouncedNote.length > 0) {
      // TODO: Auto-save to draft
      console.log('Auto-saving draft note:', debouncedNote);
    }
  }, [debouncedNote]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    
    setSaving(true);
    try {
      await onAddNote?.(note);
      setNote('');
    } catch (error) {
      console.error('Error adding note:', error);
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Note Rapide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Textarea */}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ajoutez une note rapide... (markdown supporté)"
            rows={4}
            className="w-full resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleAddNote();
              }
            }}
          />

          {/* Action Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              className="w-full bg-sky-500 hover:bg-sky-600 text-white"
              onClick={handleAddNote}
              disabled={saving || !note.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Ajout...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Ajouter Note
                </>
              )}
            </Button>
          </motion.div>

          {/* Recent Notes Preview */}
          {recentNotes.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Notes récentes</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {recentNotes.slice(0, 3).map((note, index) => (
                  <div
                    key={index}
                    className="p-2 bg-gray-50 rounded text-xs text-gray-600 line-clamp-2"
                  >
                    {note.content || note.note || note.description}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default QuickNote;

