#!/bin/sh
set -eu

cat > /usr/share/nginx/html/config.js <<EOF
window.DASHBOARD_CONFIG = {
  engineApiBaseUrl: "${ENGINE_API_BASE_URL:-http://localhost:8080}"
};
EOF
