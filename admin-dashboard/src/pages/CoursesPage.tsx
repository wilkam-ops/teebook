import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';
import './CommonPage.css';

interface Course {
  id: string;
  name: string;
  description?: string;
  holesCount: number;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', holesCount: 18 });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data);
    } catch (error) {
      alert('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/courses', formData);
      setShowModal(false);
      setFormData({ name: '', description: '', holesCount: 18 });
      loadCourses();
      alert('Parcours créé avec succès!');
    } catch (error) {
      alert('Erreur lors de la création');
    }
  };

  if (loading) return <div className="page-loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Parcours</h1>
          <p>Gérez les parcours de golf</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={20} /> Nouveau parcours
        </button>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th>Trous</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.id}>
                <td><strong>{course.name}</strong></td>
                <td>{course.description || '-'}</td>
                <td>{course.holesCount}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon"><Edit2 size={16} /></button>
                    <button className="btn-icon danger"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Nouveau parcours</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom du parcours *</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>Nombre de trous *</label>
                <input
                  type="number"
                  value={formData.holesCount}
                  onChange={e => setFormData({...formData, holesCount: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" className="btn-primary">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}