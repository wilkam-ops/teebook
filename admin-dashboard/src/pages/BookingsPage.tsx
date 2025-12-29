import { useEffect, useState } from 'react';
import api from '../services/api';
import './CommonPage.css';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const response = await api.get('/admin/bookings');
      setBookings(response.data);
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
          <h1>Réservations</h1>
          <p>Consultez toutes les réservations</p>
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Joueurs</th>
              <th>Invités</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking: any) => (
              <tr key={booking.id}>
                <td>{new Date(booking.createdAt).toLocaleDateString()}</td>
                <td><strong>{booking.playersCount}</strong></td>
                <td>{booking.guestPlayers.length}</td>
                <td><span className={`badge ${booking.status === 'confirmed' ? 'success' : 'warning'}`}>{booking.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}