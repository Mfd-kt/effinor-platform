import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Trash2 } from 'lucide-react';

const UserTableRow = ({ user, onDelete }) => {
  const navigate = useNavigate();

  const getAvatarUrl = () => {
    if (user.photo_profil || user.avatar_url) {
      return user.photo_profil || user.avatar_url;
    }
    const name = user.full_name || `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email || 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
  };

  const getFullName = () => {
    return user.full_name || `${user.prenom || ''} ${user.nom || ''}`.trim() || user.email;
  };

  const roleBadges = {
    super_admin: 'badge-purple',
    admin: 'badge-blue',
    commercial: 'badge-green',
    technicien: 'badge-orange',
    viewer: 'badge-gray',
  };

  const statusBadges = {
    actif: 'badge-success',
    conge: 'badge-warning',
    suspendu: 'badge-danger',
    parti: 'badge-gray',
  };

  const handleView = () => navigate(`/admin/utilisateurs/${user.id}`);
  const handleEdit = () => navigate(`/admin/utilisateurs/${user.id}`);
  const handleDelete = () => {
    if (user.role?.slug !== 'super_admin') {
      onDelete(user.id, getFullName());
    }
  };

  return (
    <tr>
      <td>
        <div className="user-cell">
          <img src={getAvatarUrl()} alt={`Avatar de ${getFullName()}`} className="user-avatar" />
          <div className="user-info">
            <div className="user-name">{getFullName()}</div>
            <div className="user-email">{user.email}</div>
            {user.poste && <div className="user-poste">{user.poste}</div>}
          </div>
        </div>
      </td>
      <td><span className={`badge ${roleBadges[user.role?.slug || ''] || 'badge-gray'}`}>{user.role?.label || user.role?.nom || user.role?.slug || 'N/A'}</span></td>
      <td>{user.departement || '-'}</td>
      <td>{user.equipe || '-'}</td>
      <td>
        <span className={`badge ${statusBadges[user.statut_emploi] || (user.active ? 'badge-success' : 'badge-gray')}`}>
          {user.statut_emploi || (user.active ? 'actif' : 'inactif')}
        </span>
      </td>
      <td>
        <div className="actions">
          <button onClick={handleView} className="btn-icon" title="Voir"><Eye size={18} /></button>
          <button onClick={handleEdit} className="btn-icon" title="Modifier"><Edit size={18} /></button>
          {user.role !== 'super_admin' && (
            <button onClick={handleDelete} className="btn-icon btn-danger" title="Supprimer"><Trash2 size={18} className="text-red-600" /></button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default UserTableRow;