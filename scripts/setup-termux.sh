#!/bin/bash
# ============================================
# FTC Scout — Termux Setup Script
# Run once on the master Android phone
# ============================================
# Prerequisites:
# 1. Install Termux from F-Droid (NOT Play Store)
#    https://f-droid.org/en/packages/com.termux/
# 2. Open Termux and run:
#    curl -o setup.sh <URL> && bash setup.sh
#    OR copy this script and run: bash setup-termux.sh

set -e

echo "=== FTC Scout — Termux Setup ==="
echo ""

# Update packages
echo "[1/4] Updating Termux packages..."
pkg update -y && pkg upgrade -y

# Install Node.js
echo "[2/4] Installing Node.js..."
pkg install -y nodejs-lts

# Grant storage access (will prompt for permission)
echo "[3/4] Setting up storage access..."
termux-setup-storage || true

# Install dependencies
echo "[4/4] Installing app dependencies..."
cd "$(dirname "$0")/.."
npm install

# Seed database
echo ""
echo "Seeding team database..."
node seed-teams.js

echo ""
echo "============================================"
echo "  Setup complete!"
echo ""
echo "  To start the server:"
echo "    cd $(pwd)"
echo "    bash scripts/start.sh"
echo ""
echo "  IMPORTANT: Before starting, do these in Android Settings:"
echo "    1. Settings > Apps > Termux > Battery > Unrestricted"
echo "    2. Turn on WiFi Hotspot"
echo "============================================"
