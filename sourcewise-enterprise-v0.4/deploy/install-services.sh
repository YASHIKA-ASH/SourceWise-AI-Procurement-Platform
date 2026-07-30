#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="${1:-/opt/sourcewise}"
cd "$PROJECT_ROOT"

if [[ ! -f backend/.env ]]; then
  echo "Missing $PROJECT_ROOT/backend/.env" >&2
  exit 1
fi
if [[ ! -f .deploy.env ]]; then
  echo "Missing $PROJECT_ROOT/.deploy.env containing REDIS_PASSWORD" >&2
  exit 1
fi

sudo cp deploy/sourcewise.service /etc/systemd/system/sourcewise.service
sudo systemctl daemon-reload
sudo systemctl enable --now sourcewise.service

sudo cp deploy/cloudwatch-agent-config.json /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-agent.json
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-agent.json

sudo systemctl status sourcewise.service --no-pager
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a status
