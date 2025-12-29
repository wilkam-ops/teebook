const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3002;

// Servir le dashboard admin build sur /admin
app.use('/admin', express.static(path.join(__dirname, 'admin-dashboard/dist')));

// Pour les routes SPA du dashboard, toujours servir index.html
app.get('/admin*', (req, res, next) => {
  // Si c'est un fichier statique (avec extension), laissez express.static le gérer
  if (req.path.match(/\.[a-zA-Z0-9]+$/)) {
    return next();
  }
  // Sinon, servir index.html pour le routing côté client
  res.sendFile(path.join(__dirname, 'admin-dashboard/dist/index.html'));
});

// Proxy pour l'API backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8001',
  changeOrigin: true
}));

// Proxy pour l'application Expo (tout le reste)
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  ws: true
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📱 Mobile App: http://localhost:${PORT}/`);
  console.log(`🖥️  Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
});
