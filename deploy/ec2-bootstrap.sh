#!/usr/bin/env bash
set -euo pipefail

# Run on an Amazon Linux 2023 EC2 instance after attaching an IAM role with
# CloudWatchAgentServerPolicy and the project-specific S3 policy.

sudo yum update -y
sudo yum install -y docker git amazon-cloudwatch-agent curl
sudo systemctl enable --now docker
sudo usermod -a -G docker ec2-user

if ! docker compose version >/dev/null 2>&1; then
  ARCH="$(uname -m)"
  case "$ARCH" in
    x86_64) COMPOSE_ARCH="x86_64" ;;
    aarch64|arm64) COMPOSE_ARCH="aarch64" ;;
    *) echo "Unsupported architecture: $ARCH" >&2; exit 1 ;;
  esac
  COMPOSE_VERSION="$(curl -fsSL https://api.github.com/repos/docker/compose/releases/latest | awk -F '"' '/tag_name/ {print $4; exit}')"
  sudo mkdir -p /usr/local/lib/docker/cli-plugins
  sudo curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-${COMPOSE_ARCH}" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

sudo mkdir -p /opt/sourcewise/logs
sudo chown -R ec2-user:ec2-user /opt/sourcewise

echo "EC2 prerequisites installed. Copy the project to /opt/sourcewise, configure backend/.env and .deploy.env, then run deploy/install-services.sh."
