#!/bin/bash
# ==============================================================================
# Rockola 24 / TouchTunes Jukebox - Ubuntu Linux Launcher
# ==============================================================================
# This script installs dependencies, builds the production server, starts the
# Node.js backend on port 3000, and optionally launches Chromium in Kiosk mode.
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "========================================================"
echo "🎵 Rockola 24 Digital Jukebox - Ubuntu Linux Setup"
echo "========================================================"

# 1. Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    echo "👉 To install Node.js on Ubuntu, run:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Detected Node.js: $NODE_VERSION"

# 2. Check npm dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# 3. Build production bundle if dist doesn't exist
if [ ! -f "dist/server.cjs" ]; then
    echo "⚙️ Building production bundle..."
    npm run build
fi

# 4. Start the server in the background or foreground
export NODE_ENV=production
export PORT=3000

echo "🚀 Starting Rockola Jukebox Server on http://0.0.0.0:3000 ..."
node dist/server.cjs &
SERVER_PID=$!

# Trap exit signals to cleanly shut down the server
cleanup() {
    echo "🛑 Stopping Rockola Jukebox..."
    kill "$SERVER_PID" 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# Wait a brief moment for server to listen
sleep 2

# Check if server is responding
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Server is healthy and running on port 3000!"
else
    echo "⚠️ Waiting for server initialization..."
    sleep 2
fi

# 5. Launch Kiosk Browser if a display is available (X11 / Wayland)
APP_URL="http://localhost:3000"

if [ -n "$DISPLAY" ] || [ -n "$WAYLAND_DISPLAY" ]; then
    echo "🖥️ Display detected. Launching in Kiosk mode..."

    CHROME_FLAGS=(
        "--kiosk"
        "--incognito"
        "--noerrdialogs"
        "--disable-infobars"
        "--disable-pinch"
        "--overscroll-history-navigation=0"
        "--autoplay-policy=no-user-gesture-required"
        "--check-for-update-interval=31536000"
        "--app=$APP_URL"
    )

    if command -v chromium-browser &> /dev/null; then
        echo "Launching Chromium..."
        chromium-browser "${CHROME_FLAGS[@]}"
    elif command -v google-chrome &> /dev/null; then
        echo "Launching Google Chrome..."
        google-chrome "${CHROME_FLAGS[@]}"
    elif command -v chromium &> /dev/null; then
        echo "Launching Chromium..."
        chromium "${CHROME_FLAGS[@]}"
    else
        echo "ℹ️ Neither Chromium nor Google Chrome found in PATH."
        echo "👉 Install Chromium on Ubuntu via: sudo apt-get install -y chromium-browser"
        echo "👉 Or open your browser and navigate to: $APP_URL"
        wait "$SERVER_PID"
    fi
else
    echo "ℹ️ Headless or terminal-only environment detected."
    echo "👉 Jukebox is running at: http://localhost:3000"
    echo "👉 Press Ctrl+C to stop."
    wait "$SERVER_PID"
fi
