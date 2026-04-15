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
# Optionally fetch fresh stats from TBA
if [ -n "$TBA_KEY" ]; then
  echo "=== Fetching team stats from The Blue Alliance ==="
  TBA_KEY="$TBA_KEY" node fetch-stats.js
fi

echo ""
echo "=== Seeding teams ==="
node seed-teams.js

echo ""
echo "============================================"
echo "  Update complete!"
echo "  Run: bash scripts/start.sh"
echo "============================================"
