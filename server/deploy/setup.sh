#!/bin/bash
set -euo pipefail

echo "=== Legion API VPS Setup ==="

# Update system
apt update && apt upgrade -y

# Install Node 22
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt install -y nodejs
  echo "Node $(node -v) installed"
fi

# Install Claude Code CLI
if ! command -v claude &> /dev/null; then
  npm install -g @anthropic-ai/claude-code
  echo "Claude Code CLI installed"
fi

# Install pm2
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
  echo "pm2 installed"
fi

# Install Caddy
if ! command -v caddy &> /dev/null; then
  apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt update
  apt install -y caddy
  echo "Caddy installed"
fi

# Clone repo (if not already present)
REPO_DIR="/opt/legion"
if [ ! -d "$REPO_DIR" ]; then
  git clone https://github.com/consolecowboy0/Blog.git "$REPO_DIR"
else
  cd "$REPO_DIR" && git pull
fi

# Install server dependencies
cd "$REPO_DIR/server"
npm install

# Copy Caddyfile
cp "$REPO_DIR/server/deploy/Caddyfile" /etc/caddy/Caddyfile

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Run 'claude auth login' to authenticate with your Max subscription"
echo "  2. Create /opt/legion/server/.env (copy from .env.example)"
echo "  3. Start the API:  cd /opt/legion/server && pm2 start index.js --name legion-api"
echo "  4. Save pm2 config: pm2 save && pm2 startup"
echo "  5. Restart Caddy:  systemctl restart caddy"
echo "  6. Point api.dustinlanders.com DNS A record to this server's IP"
echo ""
