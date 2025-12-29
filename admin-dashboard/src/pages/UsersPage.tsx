import { useEffect, useState } from 'react';
import api from '../services/api';
import './CommonPage.css';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      alert('Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Utilisateurs</h1>
          <p>Gérez les utilisateurs de l'application</p>
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Index</th>
              <th>Rôle</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user.id}>
                <td><strong>{user.firstName} {user.lastName}</strong></td>
                <td>{user.email}</td>
                <td>{user.handicapIndex || '-'}</td>
                <td><span className="badge success">{user.role}</span></td>
                <td><span className={`badge ${user.isActive ? 'success' : 'warning'}`}>{user.isActive ? 'Actif' : 'Inactif'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}