#!/bin/bash
# ==============================================================================
# Rockola 24 Digital Jukebox - Ubuntu Linux Auto-Installer
# ==============================================================================
# Installs Rockola 24 as a system service and desktop application on Ubuntu.
# ==============================================================================

set -e

INSTALL_DIR="/opt/rockola-jukebox"
CURRENT_USER="${SUDO_USER:-$USER}"

echo "🎵 Installing Rockola 24 Jukebox on Ubuntu Linux..."

# Ensure running with sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script with sudo:"
    echo "   sudo ./install-ubuntu.sh"
    exit 1
fi

# 1. Install system prerequisites
echo "📦 Installing system packages (curl, chromium-browser)..."
apt-get update -qq
apt-get install -y -qq curl chromium-browser build-essential

# 2. Check or install Node.js 20 LTS if missing
if ! command -v node &> /dev/null; then
    echo "⚙️ Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi

echo "✅ Node.js: $(node -v)"

# 3. Create install destination directory
echo "📂 Copying files to $INSTALL_DIR ..."
mkdir -p "$INSTALL_DIR"
cp -r ./* "$INSTALL_DIR/"

# Set user permissions
chown -R "$CURRENT_USER:$CURRENT_USER" "$INSTALL_DIR"

# 4. Install npm production dependencies inside /opt/rockola-jukebox
cd "$INSTALL_DIR"
sudo -u "$CURRENT_USER" npm install --omit=dev

# If dist doesn't exist, build it
if [ ! -f "dist/server.cjs" ]; then
    echo "🔨 Compiling production build..."
    sudo -u "$CURRENT_USER" npm run build
fi

# 5. Install systemd service
if [ -f "$INSTALL_DIR/rockola.service" ]; then
    echo "⚙️ Configuring systemd service..."
    sed -i "s|User=ubuntu|User=$CURRENT_USER|g" "$INSTALL_DIR/rockola.service"
    sed -i "s|WorkingDirectory=/opt/rockola-jukebox|WorkingDirectory=$INSTALL_DIR|g" "$INSTALL_DIR/rockola.service"
    cp "$INSTALL_DIR/rockola.service" /etc/systemd/system/rockola.service
    systemctl daemon-reload
    systemctl enable rockola.service
    systemctl restart rockola.service
    echo "✅ Service 'rockola.service' started and enabled on boot!"
fi

# 6. Install desktop shortcut for current user
USER_HOME=$(eval echo "~$CURRENT_USER")
DESKTOP_DIR="$USER_HOME/Desktop"
AUTOSTART_DIR="$USER_HOME/.config/autostart"

if [ -f "$INSTALL_DIR/rockola.desktop" ]; then
    mkdir -p "$DESKTOP_DIR"
    mkdir -p "$AUTOSTART_DIR"
    cp "$INSTALL_DIR/rockola.desktop" "$DESKTOP_DIR/"
    cp "$INSTALL_DIR/rockola.desktop" "$AUTOSTART_DIR/"
    chown -R "$CURRENT_USER:$CURRENT_USER" "$DESKTOP_DIR/rockola.desktop" "$AUTOSTART_DIR/rockola.desktop"
    chmod +x "$DESKTOP_DIR/rockola.desktop"
    echo "✅ Desktop & Autostart shortcuts installed!"
fi

echo "========================================================"
echo "🎉 Rockola 24 Jukebox successfully installed on Ubuntu!"
echo "   - Web URL: http://localhost:3000"
echo "   - Service Status: sudo systemctl status rockola"
echo "   - Restart Service: sudo systemctl restart rockola"
echo "   - Stop Service: sudo systemctl stop rockola"
echo "========================================================"
