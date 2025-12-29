# 🎯 TeeBook Dashboard Admin

Dashboard web d'administration pour TeeBook - Application de gestion de golf.

## 🚀 Démarrage

```bash
cd /app/admin-dashboard
yarn install
yarn dev
```

Le dashboard sera accessible sur **http://localhost:3001**

## 🔐 Connexion

**Identifiants admin:**
- Email: `admin@ivoirgolf.com`
- Mot de passe: `admin123`

## 📊 Fonctionnalités

### ✅ Tableau de bord
- Vue d'ensemble avec statistiques (users, bookings, subscriptions, competitions)
- KPIs visuels avec icônes colorées
- Actions rapides

### ✅ Gestion des parcours
- Liste complète des parcours
- Création de nouveaux parcours
- Modification et suppression

### ✅ Gestion des créneaux
- Création de créneaux horaires
- Attribution à un parcours
- Gestion des places disponibles

### ✅ Gestion des compétitions
- Création de compétitions/tournois
- Définition des paramètres (places, droit de jeu, date)
- Visualisation des participants

### ✅ Gestion des abonnements
- Attribution d'abonnements aux utilisateurs
- Gestion des dates de validité
- Statut actif/expiré

### ✅ Gestion des utilisateurs
- Liste complète des utilisateurs
- Visualisation des profils
- Gestion du statut actif/inactif

### ✅ Réservations
- Consultation de toutes les réservations
- Filtrage et recherche
- Statuts (confirmé/annulé)

## 🎨 Stack Technique

- **React 18** avec TypeScript
- **Vite** pour le build ultra-rapide
- **React Router** pour la navigation
- **Axios** pour les appels API
- **Lucide React** pour les icônes
- **CSS modules** pour le styling

## 📁 Structure

```
src/
├── components/
│   ├── Layout.tsx          # Layout principal avec sidebar
│   └── Layout.css
├── pages/
│   ├── LoginPage.tsx       # Authentification
│   ├── DashboardPage.tsx   # Tableau de bord
│   ├── CoursesPage.tsx     # Gestion parcours
│   ├── TeeTimesPage.tsx    # Gestion créneaux
│   ├── CompetitionsPage.tsx# Gestion compétitions
│   ├── SubscriptionsPage.tsx# Gestion abonnements
│   ├── UsersPage.tsx       # Gestion utilisateurs
│   └── BookingsPage.tsx    # Consultation réservations
├── contexts/
│   └── AuthContext.tsx     # Gestion authentification
├── services/
│   └── api.ts              # Configuration Axios
└── App.tsx                 # App principale
```

## 🔗 API Backend

Le dashboard communique avec le backend FastAPI sur **http://localhost:8001/api**

Endpoints utilisés:
- `/auth/login` - Connexion admin
- `/admin/dashboard` - Statistiques
- `/admin/users` - Liste utilisateurs
- `/admin/bookings` - Toutes les réservations
- `/admin/subscriptions` - Tous les abonnements
- `/courses` - CRUD parcours
- `/tee-times` - CRUD créneaux
- `/competitions` - CRUD compétitions
- `/subscriptions` - CRUD abonnements

## 🎨 Design

- **Couleur principale:** #10b981 (Vert golf)
- **Sidebar:** Navigation avec icônes
- **Tables:** Design moderne avec actions
- **Modals:** Formulaires de création/modification
- **Responsive:** S'adapte aux différentes tailles d'écran

## 📝 TODO / Améliorations futures

- [ ] Ajout de graphiques (recharts)
- [ ] Filtres avancés sur les tables
- [ ] Export Excel/PDF
- [ ] Notifications en temps réel
- [ ] Dark mode
- [ ] Multi-langue

## 🐛 Troubleshooting

**Problème de connexion API:**
- Vérifier que le backend tourne sur le port 8001
- Vérifier le fichier `.env` : `VITE_API_URL=http://localhost:8001/api`

**Erreur 401:**
- Token JWT expiré, se reconnecter

**Erreur 403:**
- Compte non-admin, utiliser les identifiants admin

## 👨‍💻 Développement

```bash
# Installer les dépendances
yarn install

# Développement
yarn dev

# Build production
yarn build

# Preview production
yarn preview
```

---

**TeeBook Dashboard Admin** - Gestion professionnelle de votre golf 🏌️‍♂️
