import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Loader2, ArrowLeft, Trash2, User, Mail, Phone, Building, Save, Info, MessageSquare, Clock, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';
import { logger } from '@/utils/logger';
import { sanitizeFormData } from '@/utils/sanitize';
import NotesTimeline from '@/components/NotesTimeline';
import { assignLead } from '@/lib/api/leads';

const statusConfig = {
  'Nouveau': { variant: 'default', color: 'bg-blue-500' },
  'En cours': { variant: 'secondary', color: 'bg-yellow-500' },
  'Signé': { variant: 'success', color: 'bg-green-500' },
  'Refusé': { variant: 'destructive', color: 'bg-red-500' },
  'Hors cible': { variant: 'outline', color: 'bg-gray-500' },
};

const TimelineItem = ({ icon, title, subtitle, date }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-grow">
      <p className="text-sm font-medium text-gray-800">{title}</p>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      <p className="text-xs text-gray-500 mt-1">{new Date(date).toLocaleString()}</p>
    </div>
  </div>
);

const renderEvent = (event) => {
  const actorName = event.actor_name ? `${event.actor_prenom} ${event.actor_name}` : 'Système';
  
  switch (event.event_type) {
    case 'status_changed':
      return (
        <TimelineItem 
          key={event.id}
          icon={<Edit2 className="w-5 h-5 text-blue-500"/>}
          title={`${actorName} a changé le statut de '${event.details.old}' à '${event.details.new}'.`}
          date={event.created_at}
        />
      );
    case 'note_added':
      return (
        <TimelineItem
          key={event.id}
          icon={<MessageSquare className="w-5 h-5 text-green-500"/>}
          title={`${actorName} a ajouté une note.`}
          date={event.created_at}
        />
      );
    case 'field_updated':
        const fields = event.details.fields_changed?.join(', ') || 'un champ';
        return (
            <TimelineItem
                key={event.id}
                icon={<Info className="w-5 h-5 text-yellow-600" />}
                title={`${actorName} a modifié : ${fields}.`}
                date={event.created_at}
            />
        );
    default:
      return (
         <TimelineItem
            key={event.id}
            icon={<Info className="w-5 h-5 text-gray-500" />}
            title={`Événement: ${event.event_type}`}
            date={event.created_at}
        />
      );
  }
};


const AdminLeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const { profile } = useUser();

  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [users, setUsers] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const leadPromise = supabase.from('leads').select('*').eq('id', id).single();
      const notesPromise = supabase.from('v_leads_notes').select('*').eq('lead_id', id).order('created_at', { ascending: false });
      const eventsPromise = supabase.from('v_leads_events').select('*').eq('lead_id', id).order('created_at', { ascending: false });
      const usersPromise = supabase.from('utilisateurs').select(`
        id, nom, prenom, email,
        role:roles!utilisateurs_role_id_fkey(slug)
      `);

      const [{ data: leadData, error: leadError }, { data: notesData, error: notesError }, { data: eventsData, error: eventsError }, { data: usersData, error: usersError }] = await Promise.all([leadPromise, notesPromise, eventsPromise, usersPromise]);
      
      if (leadError) throw leadError;
      if (notesError) throw notesError;
      if (eventsError) throw eventsError;
      if (usersError) throw usersError;

      setLead(leadData);
      setNotes(notesData);
      setEvents(eventsData);
      setUsers(usersData);

    } catch (error) {
      toast({ title: "Erreur", description: `Impossible de charger les données: ${error.message}`, variant: "destructive" });
      navigate('/leads');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const combined = [...notes, ...events]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setTimeline(combined);
  }, [notes, events]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLead(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = async (name, value) => {
    setLead(prev => ({ ...prev, [name]: value }));
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      const user = userResponse.user;

      const updatePayload = { 
        [name]: value,
        updated_by: user?.id ?? null
      };

      // Sanitize data before update
      const sanitizedUpdatePayload = sanitizeFormData(updatePayload);

      const { error } = await supabase.from('leads').update(sanitizedUpdatePayload).eq('id', id).select().single();
      if (error) throw error;
      toast({ title: "Mise à jour", description: `Le champ '${name}' a été mis à jour.` });
      fetchData(); // Refetch all data to update timeline
    } catch (error) {
      toast({ title: "Erreur", description: `La mise à jour du champ '${name}' a échoué.`, variant: "destructive" });
    }
  };
  
  const handleSave = async (field) => {
    try {
        const { data: userResponse } = await supabase.auth.getUser();
        const user = userResponse.user;

        const updatePayload = { 
            [field]: lead[field],
            updated_by: user?.id ?? null
        };

        // Sanitize data before update
        const sanitizedUpdatePayload = sanitizeFormData(updatePayload);

        const { error } = await supabase.from('leads').update(sanitizedUpdatePayload).eq('id', id);
        if (error) throw error;
        toast({ title: "Sauvegardé", description: `Le champ a été mis à jour.`});
        fetchData();
    } catch(error) {
        toast({ title: "Erreur", description: `La sauvegarde a échoué: ${error.message}`, variant: "destructive" });
    }
  };


  // Note: handleAddNote is deprecated - NotesTimeline component handles notes now
  // Keeping for backward compatibility but should not be used
  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const { data, error } = await supabase
        .from('notes_internes')
        .insert([{ 
          lead_id: id, 
          note: newNote.trim(), 
          auteur: profile?.full_name || profile?.email || authUser?.email || 'Admin'
        }])
        .select()
        .single();
      if (error) throw error;
      setNewNote('');
      toast({ title: 'Note ajoutée !' });
      fetchData();
    } catch (error) {
      logger.error('addNote error:', error);
      toast({ title: "Erreur", description: `Impossible d'ajouter la note: ${error.message}`, variant: "destructive" });
    }
  };
  
  const handleDeleteLead = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce lead ? Cette action est irréversible.")) return;
    try {
        // First delete related notes
        const { error: notesError } = await supabase
          .from('notes_internes')
          .delete()
          .eq('lead_id', id);
        
        // Check if notes deletion failed
        if (notesError) {
          throw new Error(`Erreur lors de la suppression des notes: ${notesError.message}`);
        }
        
        // Then delete the lead
        const { error: leadError } = await supabase
          .from('leads')
          .delete()
          .eq('id', id);
        
        // Check if lead deletion failed
        if (leadError) {
          throw new Error(`Erreur lors de la suppression du lead: ${leadError.message}`);
        }
        
        toast({ title: "Lead supprimé", description: "Le lead a été supprimé avec succès." });
        navigate('/leads');
    } catch(error) {
        logger.error('Error deleting lead:', error);
        toast({ 
          title: "Erreur", 
          description: `Impossible de supprimer le lead: ${error.message}`, 
          variant: "destructive" 
        });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-secondary-600" /></div>;
  }
  
  if (!lead) {
    return <div className="text-center p-10">Lead non trouvé. <Link to="/admin/leads" className="text-secondary-600">Retour à la liste</Link></div>;
  }

  return (
    <>
      <Helmet><title>Détail Lead: {lead.nom} | Effinor Admin</title></Helmet>
      <div>
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Link to="/leads"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <h1 className="text-3xl font-bold text-gray-900">{lead.nom}</h1>
            <Badge className={`${statusConfig[lead.statut]?.color || 'bg-gray-400'} text-white`}>{lead.statut || 'N/A'}</Badge>
          </div>
          <Button variant="destructive" onClick={handleDeleteLead}><Trash2 className="h-4 w-4 mr-2" /> Supprimer</Button>
        </div>

        {/* Informations Générales & Techniques (Full Width) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* General Info */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Informations Générales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoInput icon={User} label="Nom" name="nom" value={lead.nom} onChange={handleInputChange} onBlur={() => handleSave('nom')} />
                <InfoInput icon={Building} label="Société" name="societe" value={lead.societe} onChange={handleInputChange} onBlur={() => handleSave('societe')} />
                <InfoInput icon={Mail} label="Email" name="email" type="email" value={lead.email} onChange={handleInputChange} onBlur={() => handleSave('email')} />
                <InfoInput icon={Phone} label="Téléphone" name="telephone" value={lead.telephone} onChange={handleInputChange} onBlur={() => handleSave('telephone')} />
                <InfoInput icon={Info} label="Source" name="source" value={lead.source} onChange={handleInputChange} onBlur={() => handleSave('source')} />
                <div>
                   <label className="block text-sm font-medium text-gray-500 mb-1">Responsable</label>
                   <Select value={lead.responsable_id || ''} onValueChange={(value) => handleSelectChange('responsable_id', value)}>
                        <SelectTrigger><SelectValue placeholder="Assigner un responsable..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={null}>Non assigné</SelectItem>
                            {users.map(u => <SelectItem key={u.id} value={u.id}>{u.prenom} {u.nom}</SelectItem>)}
                        </SelectContent>
                   </Select>
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-500 mb-1">Commercial assigné</label>
                   <Select 
                     value={lead.commercial_assigne_id || ''} 
                     onValueChange={async (value) => {
                       try {
                         const { data: userResponse } = await supabase.auth.getUser();
                         const user = userResponse.user;
                         const result = await assignLead(id, value || null, user?.id || null);
                         if (result.success) {
                           setLead(prev => ({ ...prev, commercial_assigne_id: value || null }));
                           toast({ title: "Mise à jour", description: "Commercial assigné avec succès." });
                           fetchData();
                         } else {
                           throw new Error(result.error);
                         }
                       } catch (error) {
                         toast({ title: "Erreur", description: `Erreur lors de l'assignation: ${error.message}`, variant: "destructive" });
                       }
                     }}
                   >
                        <SelectTrigger><SelectValue placeholder="Assigner un commercial..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Non assigné</SelectItem>
                            {users
                              .filter(u => u.role?.slug === 'commercial' || !u.role) // Filtrer les commerciaux
                              .map(u => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.prenom} {u.nom} {u.email ? `(${u.email})` : ''}
                                </SelectItem>
                              ))}
                        </SelectContent>
                   </Select>
                </div>
              </div>
            </div>

            {/* Technical Info */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Informations Techniques</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoInput label="Puissance (kW)" name="puissance_electrique" type="number" value={lead.puissance_electrique} onChange={handleInputChange} onBlur={() => handleSave('puissance_electrique')} />
                    <InfoInput label="Surface (m²)" name="surface_m2" type="number" value={lead.surface_m2} onChange={handleInputChange} onBlur={() => handleSave('surface_m2')} />
                    <InfoInput label="Nombre de points lumineux" name="nombre_points_lumineux" type="number" value={lead.nombre_points_lumineux} onChange={handleInputChange} onBlur={() => handleSave('nombre_points_lumineux')} />
                    <InfoInput label="Hauteur Plafond (m)" name="hauteur_plafond" type="number" value={lead.hauteur_plafond} onChange={handleInputChange} onBlur={() => handleSave('hauteur_plafond')} />
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes techniques / Message</label>
                    <Textarea name="message" value={lead.message || ''} onChange={handleInputChange} onBlur={() => handleSave('message')} rows={4}/>
                </div>
            </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Status */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Statut</h2>
               <Select value={lead.statut || ''} onValueChange={(value) => handleSelectChange('statut', value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Définir un statut..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center">
                          <span className={`h-2 w-2 rounded-full mr-2 ${config.color}`}></span>
                          {status}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            
            {/* Historique */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4 flex items-center"><Clock className="w-5 h-5 mr-2" />Historique</h2>
                <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                    {timeline.length > 0 ? timeline.map(item =>
                        item.note // C'est une note
                        ? <TimelineItem 
                            key={`note-${item.id}`}
                            icon={<MessageSquare className="w-5 h-5 text-gray-700"/>}
                            title={`${item.author_prenom || ''} ${item.author_name || item.author_email || 'Utilisateur'} a écrit :`}
                            subtitle={`"${item.note}"`}
                            date={item.created_at}
                           />
                        : renderEvent(item) // C'est un événement
                    ) : <p className="text-gray-500">Aucun événement ou note pour ce lead.</p>}
                </div>
            </div>
        </div>

        {/* Notes Timeline Section - Full Width at bottom */}
        {lead && (
          <div className="mt-6">
            <NotesTimeline 
              leadId={lead.id}
              currentUser={profile?.full_name || profile?.email || authUser?.email || 'Admin'}
              title="Notes Internes"
            />
          </div>
        )}
      </div>
    </>
  );
};

const InfoInput = ({ icon: Icon, label, name, value, onChange, onBlur, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />}
            <Input id={name} name={name} type={type} value={value || ''} onChange={onChange} onBlur={onBlur} className={Icon ? 'pl-10' : ''} />
        </div>
    </div>
);

export default AdminLeadDetail;