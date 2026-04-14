import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import UserTableRow from '@/components/admin/UserTableRow';
import { PlusCircle, Loader2, Users } from 'lucide-react';
import { deleteUser } from '@/lib/api/utilisateurs';

const AdminUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');
  const [userToDelete, setUserToDelete] = useState(null);

  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    logger.log("Chargement des utilisateurs...");
    setLoading(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('utilisateurs')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      logger.log(`Utilisateurs chargés: ${data.length}`);
      setAllUsers(data || []);
    } catch (err) {
      logger.error("Erreur lors du chargement des utilisateurs:", err);
      setError("Impossible de charger la liste des utilisateurs. Veuillez réessayer.");
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeleteRequest = (userId, userName) => {
    setUserToDelete({ id: userId, name: userName });
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const result = await deleteUser(userToDelete.id);
      
      if (result.success) {
        toast({
          title: "Utilisateur supprimé",
          description: `L'utilisateur ${userToDelete.name} a été supprimé avec succès (profil et compte d'authentification).`,
          variant: "success",
        });
        // Re-fetch users after deletion
        loadUsers();
      } else {
        throw new Error('La suppression a échoué');
      }
    } catch (deleteError) {
      toast({
        title: "Échec de la suppression",
        description: `L'utilisateur ${userToDelete.name} n'a pas pu être supprimé: ${deleteError.message || 'Erreur inconnue'}`,
        variant: "destructive",
      });
      logger.error("Erreur de suppression:", deleteError);
    }
    
    setUserToDelete(null);
  };
  
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      const roleMatch = roleFilter === 'all' || user.role === roleFilter;
      const term = searchTerm.toLowerCase();
      const searchMatch = !term ||
        (user.full_name?.toLowerCase().includes(term)) ||
        (user.email?.toLowerCase().includes(term)) ||
        (user.prenom?.toLowerCase().includes(term)) ||
        (user.nom?.toLowerCase().includes(term)) ||
        (user.poste?.toLowerCase().includes(term)) ||
        (user.departement?.toLowerCase().includes(term));
      
      return roleMatch && searchMatch;
    });
  }, [allUsers, searchTerm, roleFilter]);

  const filterButtons = [
    { label: 'Tous', value: 'all' },
    { label: 'Super Admin', value: 'super_admin' },
    { label: 'Admin', value: 'admin' },
    { label: 'Commercial', value: 'commercial' },
    { label: 'Technicien', value: 'technicien' },
  ];

  return (
    <>
      <Helmet><title>Gestion des Utilisateurs | Effinor Admin</title></Helmet>
      <div className="admin-page">
        <div className="page-header">
          <div>
            <h1><Users className="inline-block mr-2" size={32}/> Utilisateurs</h1>
            <p>Gérer les membres de l'équipe et leurs permissions.</p>
          </div>
          <Link to="/admin/users/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Inviter un utilisateur
            </Button>
          </Link>
        </div>

        <div className="filters-bar">
          <div className="search-box">
            <input
              type="text"
              id="search-users"
              placeholder="🔍 Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            {filterButtons.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setRoleFilter(value)}
                className={`filter-btn ${roleFilter === value ? 'active' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Département</th>
                <th>Équipe</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="users-tbody">
              {loading ? (
                <tr><td colSpan="6" className="text-center p-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-secondary-500" /></td></tr>
              ) : error ? (
                <tr><td colSpan="6" className="text-center p-8 text-red-600">{error}</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-8 text-gray-500">Aucun utilisateur trouvé.</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <UserTableRow key={user.id} user={user} onDelete={handleDeleteRequest} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur <strong>{userToDelete?.name}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminUsers;