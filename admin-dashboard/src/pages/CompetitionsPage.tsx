import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import './CommonPage.css';

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', date: '', maxParticipants: 32, entryFee: 0 });

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      const response = await api.get('/competitions');
      setCompetitions(response.data);
    } catch (error) {
      alert('Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/competitions', formData);
      setShowModal(false);
      loadCompetitions();
      alert('Compétition créée!');
    } catch (error) {
      alert('Erreur');
    }
  };

  if (loading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Compétitions</h1>
          <p>Gérez les compétitions et tournois</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} /> Nouvelle compétition
        </button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Date</th>
              <th>Participants</th>
              <th>Droit de jeu</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {competitions.map((comp: any) => (
              <tr key={comp.id}>
                <td><strong>{comp.name}</strong></td>
                <td>{comp.date}</td>
                <td>{comp.participants.length} / {comp.maxParticipants}</td>
                <td>{comp.entryFee} FCFA</td>
                <td><span className="badge success">{comp.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nouvelle compétition</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom *</label>
                <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Participants max</label>
                <input type="number" value={formData.maxParticipants} onChange={e => setFormData({...formData, maxParticipants: parseInt(e.target.value)})} />
              </div>
              <div className="form-group">
                <label>Droit de jeu (FCFA)</label>
                <input type="number" value={formData.entryFee} onChange={e => setFormData({...formData, entryFee: parseInt(e.target.value)})} />
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