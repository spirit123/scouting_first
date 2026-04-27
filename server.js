const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const db = require('./db');
const pkg = require('./package.json');

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

  // Serve sw.js dynamically with the package version baked in, so a version
  // bump auto-invalidates every phone's cache. Must be registered before the
  // static middleware so it wins precedence over the file on disk.
  const swTemplate = fs.readFileSync(path.join(__dirname, 'public', 'sw.js'), 'utf-8');
  const swBody = swTemplate.replace(/__VERSION__/g, pkg.version);
  app.get('/sw.js', (req, res) => {
    res.set('Content-Type', 'application/javascript');
    res.set('Cache-Control', 'no-cache');
    res.send(swBody);
  });

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
