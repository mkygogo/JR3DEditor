#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p deploy/ssl
if [ -f test.shjrinfo.com_nginx.zip ] && [ ! -f deploy/ssl/test.shjrinfo.com_bundle.pem ]; then
  unzip -o test.shjrinfo.com_nginx.zip -d deploy/ssl >/dev/null
  cp deploy/ssl/test.shjrinfo.com_nginx/test.shjrinfo.com_bundle.pem deploy/ssl/
  cp deploy/ssl/test.shjrinfo.com_nginx/test.shjrinfo.com.key deploy/ssl/
fi
docker compose -f docker-compose.prod.yml up -d --build
