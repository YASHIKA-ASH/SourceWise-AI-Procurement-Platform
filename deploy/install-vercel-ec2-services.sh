#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-/opt/sourcewise}"
cd "$PROJECT_ROOT"

for required in backend/.env .deploy.env docker-compose.vercel-ec2.yml deploy/Caddyfile; do
  if [[ ! -f "$required" ]]; then
    echo "Missing $PROJECT_ROOT/$required" >&2
    exit 1
  fi
done

sudo cp deploy/sourcewise-vercel-ec2.service /etc/systemd/system/sourcewise.service
sudo systemctl daemon-reload
sudo systemctl enable --now sourcewise.service

sudo cp deploy/cloudwatch-agent-vercel-ec2.json /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-agent.json
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-agent.json

sudo systemctl status sourcewise.service --no-pager
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a status

echo
printf 'Backend health URL: https://%s/health\n' "$(grep '^API_DOMAIN=' .deploy.env | cut -d= -f2-)"
