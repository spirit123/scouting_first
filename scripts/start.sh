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
for iface in ap0 swlan0 wlan0 wlan1; do
  IP=$(ip addr show "$iface" 2>/dev/null | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)
  if [ -n "$IP" ]; then
    HOTSPOT_IP="$IP"
    echo "Detected IP: $HOTSPOT_IP (interface: $iface)"
    break
  fi
done

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
