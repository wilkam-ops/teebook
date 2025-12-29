import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../services/api';
import './CommonPage.css';

export default function TeeTimesPage() {
  const [teeTimes, setTeeTimes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ courseId: '', date: '', time: '', maxSlots: 4 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [timeRes, courseRes] = await Promise.all([api.get('/tee-times'), api.get('/courses')]);
      setTeeTimes(timeRes.data);
      setCourses(courseRes.data);
    } catch (error) {
      alert('Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tee-times', formData);
      setShowModal(false);
      loadData();
      alert('Créneau créé!');
    } catch (error) {
      alert('Erreur');
    }
  };

  if (loading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Créneaux de départ</h1>
          <p>Gérez les créneaux horaires</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} /> Nouveau créneau
        </button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Heure</th>
              <th>Places</th>
              <th>Disponibles</th>
            </tr>
          </thead>
          <tbody>
            {teeTimes.map((tt: any) => (
              <tr key={tt.id}>
                <td>{tt.date}</td>
                <td><strong>{tt.time}</strong></td>
                <td>{tt.maxSlots}</td>
                <td><span className="badge success">{tt.availableSlots}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nouveau créneau</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Parcours *</label>
                <select value={formData.courseId} onChange={e => setFormData({...formData, courseId: e.target.value})} required>
                  <option value="">Sélectionnez</option>
                  {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Heure *</label>
                <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Places max</label>
                <input type="number" value={formData.maxSlots} onChange={e => setFormData({...formData, maxSlots: parseInt(e.target.value)})} />
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