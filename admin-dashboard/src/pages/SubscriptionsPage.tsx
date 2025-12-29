import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import './CommonPage.css';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ userId: '', type: '', startDate: '', endDate: '', status: 'active' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, userRes] = await Promise.all([api.get('/admin/subscriptions'), api.get('/admin/users')]);
      setSubscriptions(subRes.data);
      setUsers(userRes.data);
    } catch (error) {
      alert('Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/subscriptions', formData);
      setShowModal(false);
      loadData();
      alert('Abonnement créé!');
    } catch (error) {
      alert('Erreur');
    }
  };

  if (loading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Abonnements</h1>
          <p>Gérez les abonnements des membres</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} /> Nouvel abonnement
        </button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((sub: any) => (
              <tr key={sub.id}>
                <td><strong>{sub.type}</strong></td>
                <td>{sub.startDate}</td>
                <td>{sub.endDate}</td>
                <td><span className={`badge ${sub.status === 'active' ? 'success' : 'warning'}`}>{sub.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nouvel abonnement</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Utilisateur *</label>
                <select value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value})} required>
                  <option value="">Sélectionnez</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Type *</label>
                <input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Date de début *</label>
                <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Date de fin *</label>
                <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Annuler</button>
                <button type="submit" className="btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}