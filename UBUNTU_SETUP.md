# Rockola 24 Jukebox - Ubuntu Linux Installation & Kiosk Guide

This guide describes how to run and deploy the **Rockola 24 / TouchTunes Jukebox** application on **Ubuntu Linux** (Desktop or Server 20.04, 22.04, 24.04 LTS).

---

## 0. Automated GitHub Actions CI/CD Workflow

The repository includes an automated GitHub Actions pipeline (`.github/workflows/build-ubuntu.yml`) that:
1. Validates TypeScript types and lints the code.
2. Compiles the production client bundle and standalone Linux Node.js server (`dist/server.cjs`).
3. Performs a headless smoke test verifying `/api/health` responsiveness.
4. Packages standalone release archives: `rockola24-ubuntu-x64.tar.gz` and `rockola24-ubuntu-x64.zip` with SHA256 checksums.
5. Uploads downloadable artifacts to the GitHub Actions run summary, and creates GitHub Releases automatically when pushing tags (e.g., `git tag v1.0.0 && git push --tags`).

---

## 1. Prerequisites (Ubuntu Linux)

Open a terminal on Ubuntu and install Node.js (v18 or v20 LTS) and Chromium:

```bash
# Update package list
sudo apt-get update

# Install curl and git if not present
sudo apt-get install -y curl git build-essential

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Chromium browser (for kiosk display)
sudo apt-get install -y chromium-browser
```

Verify the installations:
```bash
node -v   # Should show v20.x.x
npm -v    # Should show 10.x.x
```

---

## 2. Quick Start (Single Command)

### Option A: Complete System Installation (Service + Desktop Icon)
Run the auto-installer with sudo:
```bash
sudo ./install-ubuntu.sh
```
This automatically installs Node.js, configures `/opt/rockola-jukebox`, enables the systemd service, and adds desktop & autostart launchers.

### Option B: Local Runner & Kiosk
In the application directory:
```bash
./run-ubuntu.sh
```

This automated script will:
1. Verify Node.js and npm dependencies.
2. Build the production application bundle (`dist/` and `dist/server.cjs`).
3. Start the high-performance local server at `http://0.0.0.0:3000`.
4. Automatically detect your X11 / Wayland display and open **Chromium in full Kiosk mode** with sound enabled.

---

## 3. Manual Build & Run

If you prefer standard npm commands:

```bash
# 1. Install dependencies
npm install

# 2. Build production assets & server
npm run build

# 3. Start server
npm start
```
The jukebox will be available at `http://localhost:3000`.

---

## 4. Automatic Boot on Startup (Ubuntu systemd)

To make the Jukebox start automatically whenever the Ubuntu PC powers on:

1. Copy the project to `/opt/rockola-jukebox`:
```bash
sudo cp -r . /opt/rockola-jukebox
sudo chown -R $USER:$USER /opt/rockola-jukebox
```

2. Copy and enable the systemd service:
```bash
sudo cp rockola.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable rockola.service
sudo systemctl start rockola.service
```

Check service status:
```bash
sudo systemctl status rockola.service
```

---

## 5. Auto-Launch Fullscreen Chromium Kiosk on Ubuntu Login

To launch the kiosk browser upon user login on Ubuntu Desktop (GNOME / XFCE / Openbox):

Create `~/.config/autostart/rockola-kiosk.desktop`:
```ini
[Desktop Entry]
Type=Application
Name=Rockola Jukebox Kiosk
Exec=chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars --disable-pinch --overscroll-history-navigation=0 --autoplay-policy=no-user-gesture-required --app=http://localhost:3000
X-GNOME-Autostart-enabled=true
```

---

## 6. Hardware Button & Coin Acceptor Mapping (Linux)

When connecting arcade push-buttons, coin acceptors, or bill validators via USB keyboard encoders (such as I-PAC, Xin-Mo, or Zero Delay USB):

| Physical Arcade Control | Default Keyboard Key | Action in Jukebox |
|---|---|---|
| **Coin Drop / Bill Acceptor** | `5` or `C` | Inserts 1 Credit with coin clink sound |
| **Select / Play Track** | `Enter` or `Space` | Plays selected song |
| **Navigate Left** | `A` or `Left Arrow` | Rotates carousel left |
| **Navigate Right** | `D` or `Right Arrow` | Rotates carousel right |
| **Volume Up** | `+` or `=` | Increases master volume |
| **Volume Down** | `-` | Decreases master volume |
| **Mute / Unmute** | `M` | Toggles audio mute |
| **Service / Tech Menu** | `F2` or `Tab` | Opens operator configuration |
| **Fullscreen** | `F11` | Toggles native fullscreen |

---

## 7. Ubuntu Audio Optimization

Ensure your user belongs to the `audio` group for direct hardware access:
```bash
sudo usermod -aG audio $USER
```
If using ALSA or PipeWire/PulseAudio, verify your default audio sink:
```bash
pactl info
alsamixer
```
