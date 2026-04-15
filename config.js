const path = require('path');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || '0.0.0.0',
  dbPath: path.join(__dirname, 'data', 'scout.db'),
  uploadsDir: path.join(__dirname, 'uploads'),
  teamsFile: path.join(__dirname, '2025gal_team_list.csv'),
  maxFileSize: 10 * 1024 * 1024, // 10MB per file
};
