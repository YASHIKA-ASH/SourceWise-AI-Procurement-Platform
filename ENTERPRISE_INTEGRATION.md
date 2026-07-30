# SourceWise Enterprise Integration

This update adds authentication, authorization, caching, object storage, deployment, and monitoring without removing the existing procurement, Neon PostgreSQL, ChromaDB, or Gemini features.

## Included capabilities

### JWT authentication and RBAC

- Argon2 password hashing.
- Short-lived JWT access tokens.
- Rotating refresh tokens stored as hashed identifiers in PostgreSQL.
- Redis-backed access-token revocation and login rate limiting.
- Roles: `viewer`, `analyst`, `manager`, and `admin`.
- One-time initial administrator creation from environment variables.
- Database-backed audit events for mutating API requests.

Role policy:

| Action | Viewer | Analyst | Manager | Admin |
|---|---:|---:|---:|---:|
| Read dashboards, products, suppliers, BOMs | Yes | Yes | Yes | Yes |
| Run scenarios and AI analysis | No | Yes | Yes | Yes |
| Create or change procurement master data | No | No | Yes | Yes |
| Upload/delete S3 documents | No | No | Yes | Yes |
| Manage users and inspect audit events | No | No | No | Yes |

### Redis caching

- Cache-aside caching for dashboard and supplier-recommendation endpoints.
- Automatic cache invalidation after successful procurement writes.
- Graceful database fallback if Redis is temporarily unavailable.
- Login rate limiting and access-token denylisting.

### Amazon S3

- Presigned POST uploads so large files do not pass through the FastAPI process.
- Presigned downloads with short expiration times.
- PostgreSQL metadata records for uploaded procurement documents.
- Product-specific S3 object prefixes.
- IAM-role-compatible Boto3 configuration; static AWS credentials are not required on EC2.

### EC2 and CloudWatch

- Production backend and frontend Dockerfiles.
- Nginx reverse proxy and security headers.
- Production Docker Compose file with a private Redis service.
- Amazon Linux 2023 bootstrap script.
- systemd service for automatic startup after reboot.
- JSON application logs with request IDs, user IDs, response status, and duration.
- CloudWatch agent configuration for application logs and EC2 CPU, memory, disk, and network metrics.

## Important files

```text
backend/app/config.py                 Central environment configuration
backend/app/security.py               Password hashing and JWT creation/validation
backend/app/dependencies.py           Authentication and RBAC dependencies
backend/app/cache.py                  Redis cache, rate limiting, and token denylist
backend/app/models_enterprise.py      Users, refresh tokens, S3 documents, audit events
backend/app/routers/auth.py           Login, refresh, logout, and current-user APIs
backend/app/routers/users.py          Admin user-management APIs
backend/app/routers/storage.py        S3 presigned upload/download APIs
backend/app/routers/admin.py          Audit and infrastructure APIs
backend/app/observability.py          JSON logging, request IDs, and audit middleware
backend/app/routers/health.py         Liveness and dependency-readiness checks
frontend/src/AuthGate.jsx             Secure login screen and session control
frontend/src/api.js                    Automatic JWT and refresh-token handling
frontend/src/s3Upload.js               Browser-to-S3 upload helper
deploy/                                EC2, IAM, systemd, and CloudWatch files
```

## Local setup

### 1. Update `backend/.env`

Keep the existing Neon and Gemini values. Add:

```env
ENVIRONMENT=development
JWT_SECRET_KEY=replace-with-a-generated-secret
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
INITIAL_ADMIN_EMAIL=admin@yourcompany.com
INITIAL_ADMIN_PASSWORD=replace-with-a-strong-password
INITIAL_ADMIN_NAME=SourceWise Administrator
REDIS_URL=redis://localhost:6379/0
CACHE_TTL_SECONDS=300
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-sourcewise-bucket
S3_KEY_PREFIX=sourcewise
```

Generate a JWT secret:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

After the first administrator is created, remove `INITIAL_ADMIN_PASSWORD` from `.env` and restart. Existing users are preserved.

### 2. Install backend dependencies

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python scripts\init_enterprise.py
python -m fastapi dev app/main.py
```

### 3. Start Redis locally

With Docker installed:

```powershell
docker run --name sourcewise-redis -p 6379:6379 -d redis:7.4-alpine
```

The backend remains usable if Redis is unavailable, but caching, rate limiting, and immediate access-token revocation will operate in degraded mode.

### 4. Start the frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` and sign in using the initial administrator account.

## Authentication endpoints

```text
GET  /auth/status
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
GET  /users
POST /users
PATCH /users/{user_id}
```

All existing procurement and AI routes now require a Bearer access token.

## S3 browser upload flow

1. Call `POST /files/presign-upload`.
2. Upload the file directly to the returned S3 URL and fields.
3. Call `POST /files/complete` to verify the S3 object and save metadata.
4. Call `GET /files/{document_id}/download` when a temporary download URL is needed.

The frontend helper `uploadProcurementDocument(file, productId)` performs all three upload steps. Apply `deploy/s3-cors.json` to the bucket after replacing the production-domain placeholder.

## Production EC2 deployment

1. Launch an Amazon Linux 2023 EC2 instance.
2. Attach an IAM role containing `CloudWatchAgentServerPolicy` and the customized `deploy/iam-s3-policy.json`.
3. Allow inbound ports 22 and 80 in the security group. Use HTTPS through an Application Load Balancer or a TLS-enabled reverse proxy before real production use.
4. Copy the project to `/opt/sourcewise`.
5. Run:

```bash
cd /opt/sourcewise
sudo bash deploy/ec2-bootstrap.sh
cp deploy/.deploy.env.example .deploy.env
# Edit backend/.env and .deploy.env.
sudo bash deploy/install-services.sh /opt/sourcewise
```

Check services:

```bash
sudo systemctl status sourcewise
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a status
docker compose --env-file .deploy.env -f docker-compose.production.yml ps
```

## CloudWatch data

- Application log group: `/sourcewise/backend`
- EC2 system log group: `/sourcewise/ec2/system`
- Metrics namespace: `SourceWise/EC2`
- Every API response includes an `X-Request-ID` header that can be matched with JSON logs and audit events.

## Production security checklist

- Use an EC2 IAM role instead of putting AWS access keys in `.env`.
- Store secrets in AWS Systems Manager Parameter Store or Secrets Manager.
- Put the application behind HTTPS.
- Restrict the EC2 security group and do not expose Redis publicly.
- Disable demo seeding with `SEED_DEMO_DATA=false`.
- Use a dedicated S3 bucket with Block Public Access enabled.
- Configure database backups and Neon access controls.
- Rotate the JWT secret using a planned session-expiration process.
- Set CloudWatch alarms for unhealthy instances, high CPU/memory, repeated 5xx responses, and authentication failures.
