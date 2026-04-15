const express = require('express');
const path = require('path');
const config = require('./config');
const db = require('./db');

const apiTeams = require('./routes/api-teams');
const apiEntries = require('./routes/api-photos');
const apiSync = require('./routes/api-sync');
const apiExport = require('./routes/api-export');
const apiStatus = require('./routes/api-status');
const apiScouts = require('./routes/api-scouts');

async function start() {
  await db.init();

  const app = express();
  app.use(express.json());

  // Serve static PWA files
  app.use(express.static(path.join(__dirname, 'public')));

  // API routes
  app.use('/api/teams', apiTeams);
  app.use('/api/entries', apiEntries);
  app.use('/api/sync', apiSync);
  app.use('/api/export', apiExport);
  app.use('/api/status', apiStatus);
  app.use('/api/scouts', apiScouts);

  // SPA fallback — serve index.html for all non-API, non-static routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  });

  const server = app.listen(config.port, config.host, () => {
    console.log(`\n=== FTC Scout Server ===`);
    console.log(`Running on http://${config.host}:${config.port}`);
    console.log(`Tell scouts to open: http://${config.host === '0.0.0.0' ? '<your-ip>' : config.host}:${config.port}`);
    console.log(`Press Ctrl+C to stop\n`);
  });

  // Graceful shutdown
  function shutdown() {
    console.log('\nShutting down...');
    db.persist();
    db.close();
    server.close(() => {
      console.log('Server stopped.');
      process.exit(0);
    });
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
