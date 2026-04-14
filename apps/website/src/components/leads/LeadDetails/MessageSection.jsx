import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const MessageSection = ({ lead, onUpdate, autoSave }) => {
  const handleMessageChange = (e) => {
    onUpdate('message', e.target.value);
    if (autoSave) {
      autoSave('message', e.target.value);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full gap-1.5">
        <Label htmlFor="message">Message du client</Label>
        <Textarea
          id="message"
          placeholder="Aucun message laissé par le client."
          value={lead.message || ''}
          onChange={handleMessageChange}
          className="min-h-[150px]"
        />
      </div>
    </div>
  );
};

export default MessageSection;

