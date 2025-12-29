import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, MapPin, Clock, Trophy, CreditCard, Users, Calendar, LogOut } from 'lucide-react';
import './Layout.css';

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/courses', icon: MapPin, label: 'Parcours' },
  { path: '/tee-times', icon: Clock, label: 'Créneaux' },
  { path: '/competitions', icon: Trophy, label: 'Compétitions' },
  { path: '/subscriptions', icon: CreditCard, label: 'Abonnements' },
  { path: '/users', icon: Users, label: 'Utilisateurs' },
  { path: '/bookings', icon: Calendar, label: 'Réservations' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">🏌️</div>
          <h1>TeeBook Admin</h1>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.firstName[0]}{user?.lastName[0]}</div>
            <div>
              <div className="user-name">{user?.firstName} {user?.lastName}</div>
              <div className="user-role">Administrateur</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}