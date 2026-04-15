#!/bin/bash
# ============================================
# FTC Scout — Update & Reset
# Pulls latest code, resets DB, reseeds teams
# ============================================

cd "$(dirname "$0")/.."

echo "=== Pulling latest code ==="
git pull

echo ""
echo "=== Resetting database ==="
rm -f data/scout.db

echo ""
echo "=== Installing dependencies ==="
npm install

echo ""
echo "=== Seeding teams ==="
node seed-teams.js

echo ""
echo "============================================"
echo "  Update complete!"
echo "  Run: bash scripts/start.sh"
echo "============================================"
