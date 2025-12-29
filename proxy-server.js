const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3002;

// Servir le dashboard admin build sur /admin
app.use('/admin', express.static(path.join(__dirname, 'admin-dashboard/dist')));

// Rediriger /admin vers /admin/index.html si c'est une route du dashboard
app.get('/admin/*', (req, res) => {
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
