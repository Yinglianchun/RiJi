#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./deploy_remote.sh --host <ssh-host> [options]

Options:
  --host <host>           SSH host or IP. Required.
  --user <user>           SSH user. Default: root
  --remote-dir <path>     Remote install dir. Default: /opt/ai-diary
  --server-name <name>    nginx server_name. Default: same as --host
  --app-origin <url>      Public app origin used for VITE_API_URL. Default: http://<server-name>
  --mcp-bearer-token <t>  Bearer token required by remote MCP endpoints. Default: auto-generate
  --mcp-api-key <key>     Legacy alias for --mcp-bearer-token
  --skip-build            Skip local frontend build/upload of dist assets
  --help                  Show this help

Example:
  ./deploy_remote.sh \
    --host 203.0.113.10 \
    --user root \
    --server-name diary.example.com \
    --app-origin https://diary.example.com \
    --mcp-bearer-token 'change-me'
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

HOST=""
USER_NAME="root"
REMOTE_DIR="/opt/ai-diary"
SERVER_NAME=""
APP_ORIGIN=""
MCP_BEARER_TOKEN=""
SKIP_BUILD=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      HOST="${2:-}"
      shift 2
      ;;
    --user)
      USER_NAME="${2:-}"
      shift 2
      ;;
    --remote-dir)
      REMOTE_DIR="${2:-}"
      shift 2
      ;;
    --server-name)
      SERVER_NAME="${2:-}"
      shift 2
      ;;
    --app-origin)
      APP_ORIGIN="${2:-}"
      shift 2
      ;;
    --mcp-bearer-token)
      MCP_BEARER_TOKEN="${2:-}"
      shift 2
      ;;
    --mcp-api-key)
      MCP_BEARER_TOKEN="${2:-}"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ -z "${HOST}" ]]; then
  usage
  exit 1
fi

if [[ -z "${SERVER_NAME}" ]]; then
  SERVER_NAME="${HOST}"
fi

if [[ -z "${APP_ORIGIN}" ]]; then
  APP_ORIGIN="http://${SERVER_NAME}"
fi

if [[ -z "${MCP_BEARER_TOKEN}" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    MCP_BEARER_TOKEN="$(openssl rand -hex 24)"
  else
    MCP_BEARER_TOKEN="$(date +%s)-$RANDOM-$RANDOM"
  fi
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}/haven-diary"
SSH_TARGET="${USER_NAME}@${HOST}"
MCP_PUBLIC_BASE="${APP_ORIGIN%/}/mcp"

require_cmd ssh
require_cmd python
require_cmd tar

if [[ "${SKIP_BUILD}" -eq 0 ]]; then
  require_cmd npm
fi

echo ""
echo "== Haven的远程部署 =="
echo "SSH target   : ${SSH_TARGET}"
echo "Remote dir   : ${REMOTE_DIR}"
echo "Server name  : ${SERVER_NAME}"
echo "App origin   : ${APP_ORIGIN}"
echo "MCP base     : ${MCP_PUBLIC_BASE}"
echo ""

if [[ "${SKIP_BUILD}" -eq 0 ]]; then
  echo "[1/6] Building frontend locally..."
  (
    cd "${FRONTEND_DIR}"
    npm install
    VITE_API_URL="${APP_ORIGIN}" npm run build
  )
else
  echo "[1/6] Skipping local frontend build."
fi

echo "[2/6] Creating remote directories..."
ssh "${SSH_TARGET}" "sudo mkdir -p '${REMOTE_DIR}' '${REMOTE_DIR}/static' && sudo chown -R '${USER_NAME}':'${USER_NAME}' '${REMOTE_DIR}'"

echo "[3/6] Uploading application files..."
(
  cd "${SCRIPT_DIR}"
  tar -czf - \
    --exclude '.git' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude 'diary.db' \
    --exclude 'haven-diary/node_modules' \
    --exclude 'haven-diary/dist' \
    --exclude 'deploy_remote.sh' \
    . | ssh "${SSH_TARGET}" "tar -xzf - -C '${REMOTE_DIR}'"
)

if [[ "${SKIP_BUILD}" -eq 0 ]]; then
  (
    cd "${FRONTEND_DIR}"
    tar -czf - -C dist . | ssh "${SSH_TARGET}" "rm -rf '${REMOTE_DIR}/static'/* && tar -xzf - -C '${REMOTE_DIR}/static'"
  )
fi

echo "[4/6] Installing remote runtime and services..."
ssh "${SSH_TARGET}" "REMOTE_DIR='${REMOTE_DIR}' USER_NAME='${USER_NAME}' SERVER_NAME='${SERVER_NAME}' APP_ORIGIN='${APP_ORIGIN}' HOST='${HOST}' MCP_BEARER_TOKEN='${MCP_BEARER_TOKEN}' bash -s" <<'EOF'
set -Eeuo pipefail

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y python3 python3-venv python3-pip nginx
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y python3 python3-pip nginx
elif command -v yum >/dev/null 2>&1; then
  sudo yum install -y python3 python3-pip nginx
else
  echo "Unsupported package manager. Install python3, python3-venv and nginx manually." >&2
  exit 1
fi

cd "${REMOTE_DIR}"
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt

sudo tee /etc/systemd/system/ai-diary-api.service >/dev/null <<SERVICE
[Unit]
Description=Haven的日记后端
After=network.target

[Service]
Type=simple
User=${USER_NAME}
WorkingDirectory=${REMOTE_DIR}
ExecStart=${REMOTE_DIR}/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICE

sudo tee /etc/systemd/system/ai-diary-mcp.service >/dev/null <<SERVICE
[Unit]
Description=Haven的远程MCP
After=network.target ai-diary-api.service

[Service]
Type=simple
User=${USER_NAME}
WorkingDirectory=${REMOTE_DIR}
Environment=DIARY_API_URL=http://127.0.0.1:8000
Environment=MCP_HTTP_PORT=8080
Environment=MCP_BEARER_TOKEN=${MCP_BEARER_TOKEN}
Environment=MCP_ALLOWED_HOSTS=${SERVER_NAME},${SERVER_NAME}:*,${HOST},${HOST}:*
Environment=MCP_ALLOWED_ORIGINS=${APP_ORIGIN},http://${SERVER_NAME},https://${SERVER_NAME}
ExecStart=${REMOTE_DIR}/.venv/bin/uvicorn mcp_http_server:app --host 127.0.0.1 --port 8080
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable ai-diary-api ai-diary-mcp
sudo systemctl restart ai-diary-api ai-diary-mcp
EOF

echo "[5/6] Writing nginx config..."
ssh "${SSH_TARGET}" "SERVER_NAME='${SERVER_NAME}' REMOTE_DIR='${REMOTE_DIR}' bash -s" <<'EOF'
set -Eeuo pipefail

sudo tee /etc/nginx/sites-available/ai-diary >/dev/null <<NGINX
server {
    listen 80;
    server_name ${SERVER_NAME};

    root ${REMOTE_DIR}/static;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~ ^/(api|docs|openapi\.json|redoc|diaries) {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /mcp {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Authorization \$http_authorization;
        proxy_set_header Connection "";
        proxy_request_buffering off;
        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
NGINX

sudo ln -sfn /etc/nginx/sites-available/ai-diary /etc/nginx/sites-enabled/ai-diary
if [[ -f /etc/nginx/sites-enabled/default ]]; then
  sudo rm -f /etc/nginx/sites-enabled/default
fi
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl reload nginx || sudo systemctl restart nginx
EOF

echo "[6/6] Verifying services..."
ssh "${SSH_TARGET}" "sudo systemctl --no-pager --full status ai-diary-api ai-diary-mcp nginx | sed -n '1,80p'"

echo ""
echo "Deploy complete."
echo "Web app : ${APP_ORIGIN}"
echo "API     : ${APP_ORIGIN%/}/api"
echo "MCP     : ${MCP_PUBLIC_BASE}  (httpStream)"
echo "MCP SSE : ${MCP_PUBLIC_BASE}/sse"
echo "Token   : ${MCP_BEARER_TOKEN}"
echo ""
echo "Quick checks:"
echo "  curl ${APP_ORIGIN%/}/api"
echo "  curl ${MCP_PUBLIC_BASE}/info"
echo "  curl -H 'Authorization: Bearer ${MCP_BEARER_TOKEN}' ${MCP_PUBLIC_BASE}/health"
