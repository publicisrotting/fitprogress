#!/bin/bash

echo "=========================================="
echo "      FitProgress Launcher (macOS/Linux)"
echo "=========================================="
echo ""

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "[WARNING] node_modules not found!"
    echo "Starting automatic setup..."
    bash setup.sh
fi

echo "Updating IP Configuration..."
node scripts/update-ip.js

# Get Local IP
LOCAL_IP=$(node scripts/get-ip.js)
echo "Detected IP: $LOCAL_IP"

echo ""
echo "Starting Backend and Frontend..."

# Open new terminal for Backend & Frontend
osascript -e "tell application \"Terminal\" to do script \"cd \\\"$PWD\\\" && npm run dev\""

echo ""
echo "Starting Mobile App..."
echo "(Ensure your phone is on the same Wi-Fi)"

# Open new terminal for Mobile App (Expo Go)
osascript -e "tell application \"Terminal\" to do script \"cd \\\"$PWD/mobile\\\" && export REACT_NATIVE_PACKAGER_HOSTNAME=$LOCAL_IP && npx expo start --tunnel --clear\""

echo ""
echo "=========================================="
echo "      All Services Started!"
echo "=========================================="
echo "1. Server and Client running in one window."
echo "2. Mobile bundler running in another window."
echo ""
echo "Scan the QR code in the Mobile window with Expo Go."
echo ""
