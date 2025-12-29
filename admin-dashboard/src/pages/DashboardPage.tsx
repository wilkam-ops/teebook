import { useEffect, useState } from 'react';
import { Users, Calendar, CreditCard, Trophy } from 'lucide-react';
import api from '../services/api';
import './DashboardPage.css';

interface Stats {
  totalUsers: number;
  totalBookings: number;
  activeSubscriptions: number;
  upcomingCompetitions: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Chargement...</div>;
  }

  const cards = [
    { icon: Users, label: 'Utilisateurs', value: stats?.totalUsers || 0, color: '#10b981' },
    { icon: Calendar, label: 'Réservations', value: stats?.totalBookings || 0, color: '#3b82f6' },
    { icon: CreditCard, label: 'Abonnements actifs', value: stats?.activeSubscriptions || 0, color: '#f59e0b' },
    { icon: Trophy, label: 'Compétitions à venir', value: stats?.upcomingCompetitions || 0, color: '#8b5cf6' },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Tableau de bord</h1>
        <p>Vue d'ensemble de TeeBook</p>
      </div>

      <div className="stats-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${card.color}20` }}>
                <Icon size={24} style={{ color: card.color }} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="quick-actions">
        <h2>Actions rapides</h2>
        <div className="actions-grid">
          <a href="/courses" className="action-card">
            <span>🏌️ Gérer les parcours</span>
          </a>
          <a href="/tee-times" className="action-card">
            <span>⏰ Gérer les créneaux</span>
          </a>
          <a href="/competitions" className="action-card">
            <span>🏆 Gérer les compétitions</span>
          </a>
          <a href="/subscriptions" className="action-card">
            <span>💳 Gérer les abonnements</span>
          </a>
        </div>
      </div>
    </div>
  );
}