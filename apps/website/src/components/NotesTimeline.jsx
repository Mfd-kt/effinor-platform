import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { sanitizeFormData } from '@/utils/sanitize';
import UserAvatar from '@/components/common/UserAvatar';
import { getAllUsers } from '@/lib/api/utilisateurs';
import { useUser } from '@/contexts/UserContext';

/**
 * Reusable Notes Timeline Component
 * 
 * @component
 * @param {string} leadId - UUID of the lead (nullable)
 * @param {string} commandeId - UUID of the commande/order (nullable)
 * @param {string} currentUser - Current user name/identifier
 * @param {string} title - Optional custom title (default: "Notes Internes")
 * @example
 * // For leads
 * <NotesTimeline leadId={lead.id} currentUser={user.name} />
 * 
 * // For orders
 * <NotesTimeline commandeId={order.id} currentUser={user.name} />
 */
export default function NotesTimeline({ 
  leadId, 
  commandeId, 
  currentUser = 'Admin',
  title = 'Notes Internes'
}) {
  const { toast } = useToast();
  const { profile } = useUser();
  const [notes, setNotes] = useState([]);
  const [users, setUsers] = useState([]); // Cache des utilisateurs
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (leadId || commandeId) {
      fetchNotes();
    }
  }, [leadId, commandeId]);

  // Charger tous les utilisateurs une fois pour le cache (avec photos de profil)
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const result = await getAllUsers();
        if (result.success && result.data) {
          setUsers(result.data);
        } else {
          // Fallback: charger directement depuis Supabase avec tous les champs
          const { data, error } = await supabase
            .from('utilisateurs')
            .select('id, prenom, nom, email, full_name, photo_profil_url, avatar_url, auth_user_id');
          if (!error && data) {
            logger.log('[NotesTimeline] Utilisateurs chargés (fallback):', data.length);
            setUsers(data);
          } else if (error) {
            logger.error('[NotesTimeline] Erreur fallback chargement users:', error);
          }
        }
      } catch (error) {
        logger.error('Error loading users:', error);
        // Fallback: charger directement depuis Supabase
        try {
          const { data, error } = await supabase
            .from('utilisateurs')
            .select('id, prenom, nom, email, full_name, photo_profil_url, avatar_url, auth_user_id');
          if (!error && data) {
            logger.log('[NotesTimeline] Utilisateurs chargés (fallback 2):', data.length);
            setUsers(data);
          } else if (error) {
            logger.error('[NotesTimeline] Erreur fallback 2 chargement users:', error);
          }
        } catch (fallbackError) {
          logger.error('Fallback user loading failed:', fallbackError);
        }
      }
    };
    loadUsers();
  }, []);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      // Select required columns from notes_internes table
      // Note: La table notes_internes utilise 'auteur' (texte) et non 'user_id'
      let query = supabase
        .from('notes_internes')
        .select('id, lead_id, commande_id, auteur, note, created_at')
        .order('created_at', { ascending: false });
      
      logger.log('[NotesTimeline] Chargement notes pour:', { leadId, commandeId });

      // Filter by lead_id or commande_id
      if (leadId) {
        query = query.eq('lead_id', leadId);
      } else if (commandeId) {
        query = query.eq('commande_id', commandeId);
      } else {
        // No ID provided, return empty
        setNotes([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query;

      if (error) {
        logger.error('❌ Erreur chargement notes:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        console.error('Full fetch error:', error);

        // If table doesn't exist or RLS error, log but don't break
        if (error.message?.includes('relation "public.notes_internes" does not exist')) {
          logger.warn('⚠️ Table notes_internes n\'existe pas encore');
          toast({
            title: "Table manquante",
            description: "La table 'notes_internes' n'existe pas encore. Veuillez la créer dans Supabase SQL Editor.",
            variant: "destructive"
          });
          setNotes([]);
          setLoading(false);
          return;
        }

        throw error;
      }

      logger.log(`✅ ${data?.length || 0} note(s) chargée(s)`, data);
      setNotes(data || []);
    } catch (error) {
      logger.error('❌ Erreur chargement notes (catch):', {
        error: error.message,
        details: error.details,
        hint: error.hint
      });
      console.error('Full error:', error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les notes: ${error.message || 'Erreur inconnue'}. Vérifiez que la table 'notes_internes' existe dans Supabase.`,
        variant: "destructive"
      });
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez écrire une note avant d'envoyer.",
        variant: "destructive"
      });
      return;
    }

    if (!leadId && !commandeId) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter une note: aucun ID associé.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      // Sanitize note content
      const sanitizedNote = sanitizeFormData({ note: newNote.trim() }).note;

      // Store author info as JSON string for better user matching
      const authorInfo = profile ? {
        full_name: profile.full_name || `${profile.prenom || ''} ${profile.nom || ''}`.trim(),
        email: profile.email || '',
        prenom: profile.prenom || '',
        nom: profile.nom || '',
        photo_profil_url: profile.photo_profil_url || null,
        id: profile.id
      } : {
        full_name: typeof currentUser === 'string' ? currentUser : (currentUser?.full_name || 'Admin'),
        email: currentUser?.email || '',
      };

      // Use 'note' column
      const noteData = {
        note: sanitizedNote,  // ✅ Use 'note' column
        auteur: JSON.stringify(authorInfo), // Store as JSON for better matching
        ...(leadId && { lead_id: leadId }),
        ...(commandeId && { commande_id: commandeId })
      };

      logger.log('📝 Inserting note:', { ...noteData, note: '[sanitized]' });

      const { data, error } = await supabase
        .from('notes_internes')
        .insert([noteData])
        .select()
        .single();

      if (error) {
        logger.error('❌ Erreur Supabase insertion note:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          noteData: { ...noteData, note: '[sanitized]' }
        });
        console.error('Full error object:', error);

        // If table doesn't exist, show helpful error
        if (error.message?.includes('relation "public.notes_internes" does not exist')) {
          toast({
            title: "Table manquante",
            description: "La table 'notes_internes' n'existe pas. Veuillez l'exécuter dans Supabase SQL Editor.",
            variant: "destructive"
          });
          return;
        }

        throw error;
      }

      logger.log('✅ Note ajoutée avec succès:', data.id);
      setNewNote('');
      await fetchNotes(); // Refresh notes

      toast({
        title: "Note ajoutée",
        description: "La note a été enregistrée avec succès."
      });
    } catch (error) {
      logger.error('❌ Erreur ajout note (catch):', {
        error: error.message,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      console.error('Full error object:', error);
      toast({
        title: "Erreur",
        description: `Impossible d'ajouter la note: ${error.message || 'Erreur inconnue'}`,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !sending) {
      e.preventDefault();
      handleAddNote();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '-';
    try {
      return new Date(timestamp).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return timestamp;
    }
  };

  // Trouver l'utilisateur correspondant à une note
  const getUserForNote = (note) => {
    if (!note || !note.auteur) {
      return {
        nom: 'Admin',
        prenom: '',
        email: '',
        full_name: 'Admin',
        photo_profil_url: null
      };
    }

    // Extraire auteur (peut être string, JSON string, ou objet)
    let auteurValue = note.auteur;
    
    // Si auteur est un JSON string, le parser
    if (typeof auteurValue === 'string') {
      // Essayer de parser comme JSON
      try {
        const parsed = JSON.parse(auteurValue);
        if (parsed && typeof parsed === 'object') {
          auteurValue = parsed;
        }
      } catch (e) {
        // Pas un JSON, garder comme string
      }
    }
    
    // Si auteur est maintenant un objet, extraire les infos
    if (typeof auteurValue === 'object' && auteurValue !== null) {
      // PRIORITÉ 1: Chercher par ID si disponible
      if (auteurValue.id) {
        const userById = users.find(u => u.id === auteurValue.id);
        if (userById) return userById;
      }
      
      // PRIORITÉ 2: Chercher par email
      if (auteurValue.email) {
        const userByEmail = users.find(u => u.email === auteurValue.email);
        if (userByEmail) return userByEmail;
      }
      
      // PRIORITÉ 3: Chercher par full_name
      const fullName = auteurValue.full_name || auteurValue.fullName || auteurValue.name || '';
      if (fullName) {
        const userByName = users.find(u => 
          u.full_name === fullName ||
          `${u.prenom || ''} ${u.nom || ''}`.trim() === fullName
        );
        if (userByName) return userByName;
      }
      
      // Si on a les infos dans auteurValue, les utiliser directement
      const prenom = auteurValue.prenom || auteurValue.firstName || '';
      const nom = auteurValue.nom || auteurValue.lastName || '';
      const email = auteurValue.email || '';
      
      // Si on a full_name mais pas prenom/nom, splitter full_name
      let finalPrenom = prenom;
      let finalNom = nom;
      if (!finalPrenom && !finalNom && fullName) {
        const nameParts = fullName.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          finalPrenom = nameParts[0];
          finalNom = nameParts.slice(1).join(' ');
        } else if (nameParts.length === 1) {
          finalPrenom = nameParts[0];
          finalNom = '';
        }
      }
      
      return {
        prenom: finalPrenom || email?.split('@')[0] || '',
        nom: finalNom || '',
        email: email || '',
        full_name: fullName || `${finalPrenom} ${finalNom}`.trim() || email || 'Utilisateur',
        photo_profil_url: auteurValue.photo_profil_url || auteurValue.photo || auteurValue.avatar_url || null
      };
    }
    
    // Si auteur est une string, chercher dans users
    if (typeof auteurValue === 'string') {
      // Chercher par email
      const userByEmail = users.find(u => u.email === auteurValue);
      if (userByEmail) return userByEmail;
      
      // Chercher par nom complet
      const userByName = users.find(u => {
        const fullName = `${u.prenom || ''} ${u.nom || ''}`.trim();
        return fullName === auteurValue || u.full_name === auteurValue;
      });
      if (userByName) return userByName;
      
      // Si c'est un email, extraire le nom
      if (auteurValue.includes('@')) {
        const namePart = auteurValue.split('@')[0];
        return {
          email: auteurValue,
          prenom: namePart,
          nom: '',
          full_name: namePart,
          photo_profil_url: null
        };
      }
      
      // Sinon utiliser la string comme nom
      return {
        prenom: auteurValue,
        nom: '',
        email: '',
        full_name: auteurValue,
        photo_profil_url: null
      };
    }
    
    // Fallback
    return {
      nom: 'Admin',
      prenom: '',
      email: '',
      full_name: 'Admin',
      photo_profil_url: null
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-secondary-500" />
          {title}
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Historique de communication interne
        </p>
      </div>

      {/* Add new note form */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-3">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ajouter une note interne... (Enter pour envoyer, Shift+Enter pour nouvelle ligne)"
            className="flex-1 min-h-20 resize-none"
            rows="3"
            disabled={sending || !leadId && !commandeId}
          />
          <Button
            onClick={handleAddNote}
            disabled={sending || !newNote.trim() || (!leadId && !commandeId)}
            className="bg-secondary-500 hover:bg-secondary-600 text-white whitespace-nowrap"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Envoyer
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Appuyez sur <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Entrée</kbd> pour envoyer, <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Shift+Entrée</kbd> pour une nouvelle ligne
        </p>
      </div>

      {/* Timeline of notes */}
      <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-secondary-500 mr-3" />
            <span className="text-gray-600">Chargement des notes...</span>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="font-medium mb-1">Aucune note pour le moment</p>
            <p className="text-sm text-gray-400">Ajoutez la première note ci-dessus</p>
          </div>
        ) : (
          notes.map((note) => {
            const noteUser = getUserForNote(note);
            
            logger.log('[NotesTimeline] Note user:', { 
              noteId: note.id, 
              auteur: note.auteur, 
              noteUser,
              usersCount: users.length 
            });
            
            // Construire le nom d'affichage de manière robuste
            let displayName = 'Admin';
            if (noteUser.prenom && noteUser.nom) {
              displayName = `${noteUser.prenom} ${noteUser.nom}`.trim();
            } else if (noteUser.full_name) {
              displayName = noteUser.full_name;
            } else if (noteUser.prenom) {
              displayName = noteUser.prenom;
            } else if (noteUser.email) {
              displayName = noteUser.email.split('@')[0];
            } else if (note.auteur) {
              // Essayer d'extraire quelque chose d'utile de auteur
              try {
                const parsed = typeof note.auteur === 'string' ? JSON.parse(note.auteur) : note.auteur;
                if (parsed && parsed.full_name) {
                  displayName = parsed.full_name;
                } else {
                  displayName = typeof note.auteur === 'string' ? note.auteur : 'Utilisateur';
                }
              } catch (e) {
                displayName = typeof note.auteur === 'string' ? note.auteur : 'Utilisateur';
              }
            }
            
            return (
              <div 
                key={note.id} 
                className="flex gap-4 border-l-4 border-secondary-500 pl-4 py-3 hover:bg-gray-50 transition-colors rounded-r"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <UserAvatar 
                    user={{
                      ...noteUser,
                      photo_profil_url: noteUser.photo_profil_url || noteUser.avatar_url || null,
                      full_name: displayName || noteUser.full_name || `${noteUser.prenom || ''} ${noteUser.nom || ''}`.trim() || noteUser.email || 'Utilisateur'
                    }} 
                    size="md"
                    className="ring-1 ring-gray-200"
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-sm text-gray-900">
                        {displayName}
                      </span>
                      {noteUser.email && noteUser.email !== displayName && (
                        <span className="text-xs text-gray-500">
                          {noteUser.email}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTimestamp(note.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {note.note || '(Note vide)'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
