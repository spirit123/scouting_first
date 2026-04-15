#!/bin/bash
# ============================================
# FTC Scout — Start Server
# Run on the master phone via Termux
# ============================================

cd "$(dirname "$0")/.."

# Acquire wake lock to prevent Android from killing us
echo "Acquiring wake lock..."
termux-wake-lock 2>/dev/null || true

# Try to detect hotspot IP
HOTSPOT_IP=""

# Grab any non-localhost IP from ifconfig
HOTSPOT_IP=$(ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -1)

if [ -n "$HOTSPOT_IP" ]; then
  echo "Detected IP: $HOTSPOT_IP"
fi

if [ -z "$HOTSPOT_IP" ]; then
  HOTSPOT_IP="0.0.0.0"
  echo "WARNING: Could not detect hotspot IP."
  echo "Make sure WiFi Hotspot is enabled."
  echo "Binding to all interfaces (0.0.0.0)"
fi

echo ""
echo "============================================"
echo "  FTC Scout Server Starting"
echo ""
echo "  Tell scouts to connect to your hotspot"
echo "  and open in their browser:"
echo ""
echo "    http://$HOTSPOT_IP:3000"
echo ""
echo "  Press Ctrl+C to stop"
echo "============================================"
echo ""

HOST="$HOTSPOT_IP" PORT=3000 node server.js
