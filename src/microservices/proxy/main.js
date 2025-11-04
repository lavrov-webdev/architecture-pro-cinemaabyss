const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const PORT = process.env.PORT || 8000;
const MONOLITH_URL = process.env.MONOLITH_URL || 'http://localhost:8080';
const MOVIES_SERVICE_URL = process.env.MOVIES_SERVICE_URL || 'http://localhost:8081';
const EVENTS_SERVICE_URL = process.env.EVENTS_SERVICE_URL || 'http://localhost:8082';
const GRADUAL_MIGRATION = process.env.GRADUAL_MIGRATION === 'true';
const MOVIES_MIGRATION_PERCENT = parseInt(process.env.MOVIES_MIGRATION_PERCENT || '0', 10);

console.log('Proxy Service Configuration:');
console.log(`  PORT: ${PORT}`);
console.log(`  MONOLITH_URL: ${MONOLITH_URL}`);
console.log(`  MOVIES_SERVICE_URL: ${MOVIES_SERVICE_URL}`);
console.log(`  EVENTS_SERVICE_URL: ${EVENTS_SERVICE_URL}`);
console.log(`  GRADUAL_MIGRATION: ${GRADUAL_MIGRATION}`);
console.log(`  MOVIES_MIGRATION_PERCENT: ${MOVIES_MIGRATION_PERCENT}%`);

const monolithProxy = createProxyMiddleware({
  target: MONOLITH_URL,
  changeOrigin: true,
  onError: (err, _, res) => {
    console.error(`  -> Error proxying to Monolith:`, err.message);
    res.status(500).json({ error: 'Monolith Service unavailable' });
  }
});

const moviesServiceProxy = createProxyMiddleware({
  target: MOVIES_SERVICE_URL,
  changeOrigin: true,
  onError: (err, _, res) => {
    console.error(`  -> Error proxying to Movies Service:`, err.message);
    res.status(500).json({ error: 'Movies Service unavailable' });
  }
});

const eventsServiceProxy = createProxyMiddleware({
  target: EVENTS_SERVICE_URL,
  changeOrigin: true,
  onError: (err, _, res) => {
    console.error(`  -> Error proxying to Events Service:`, err.message);
    res.status(500).json({ error: 'Events Service unavailable' });
  }
});

app.use((req, _, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/events', (req, res, next) => {
  console.log(`  -> Proxying to Events Service: ${EVENTS_SERVICE_URL}${req.url}`);
  eventsServiceProxy(req, res, next);
});

app.use('/api/movies', (req, res, next) => {
  if (GRADUAL_MIGRATION && Math.random() * 100 < MOVIES_MIGRATION_PERCENT) {
    console.log(`  -> Proxying to Movies Service (migration): ${MOVIES_SERVICE_URL}${req.url}`);
    moviesServiceProxy(req, res, next);
  } else {
    console.log(`  -> Proxying to Monolith: ${MONOLITH_URL}${req.url}`);
    monolithProxy(req, res, next);
  }
});

app.use('/', (req, res, next) => {
  console.log(`  -> Proxying to Monolith: ${MONOLITH_URL}${req.url}`);
  monolithProxy(req, res, next);
});

app.listen(PORT, () => {
  console.log(`\n🚀 Proxy Service is running on port ${PORT}`);
  console.log(`   Ready to route requests!\n`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

