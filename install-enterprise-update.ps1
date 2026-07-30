param(
    [string]$ProjectRoot = "$env:USERPROFILE\Downloads\procurement-intelligence-starter\procurement-intelligence",
    [switch]$SkipDependencies
)

$ErrorActionPreference = "Stop"
$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Assert-ProjectRoot {
    param([string]$Path)
    if (!(Test-Path "$Path\backend\app\main.py") -or !(Test-Path "$Path\frontend\src\App.jsx")) {
        throw "Project not found at '$Path'. Pass -ProjectRoot with the folder containing backend and frontend."
    }
}

function Copy-Tree {
    param([string]$Source, [string]$Destination)
    if (Test-Path $Source) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
        Copy-Item "$Source\*" $Destination -Recurse -Force
    }
}

Assert-ProjectRoot $ProjectRoot

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $ProjectRoot "_enterprise_backup_$timestamp"
New-Item -ItemType Directory -Path $backup -Force | Out-Null

$filesToBackup = @(
    "backend\app\main.py",
    "backend\app\database.py",
    "backend\app\routers\analysis.py",
    "backend\app\services\ai_copilot.py",
    "backend\requirements.txt",
    "backend\.env.example",
    "frontend\src\api.js",
    "frontend\src\main.jsx",
    "frontend\src\index.css",
    ".gitignore"
)

foreach ($relative in $filesToBackup) {
    $source = Join-Path $ProjectRoot $relative
    if (Test-Path $source) {
        $target = Join-Path $backup $relative
        New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
        Copy-Item $source $target -Force
    }
}

Copy-Tree "$PackageRoot\backend" "$ProjectRoot\backend"
Copy-Tree "$PackageRoot\frontend" "$ProjectRoot\frontend"
Copy-Tree "$PackageRoot\deploy" "$ProjectRoot\deploy"
Copy-Tree "$PackageRoot\logs" "$ProjectRoot\logs"

foreach ($file in @("docker-compose.production.yml", "ENTERPRISE_INTEGRATION.md", ".gitignore")) {
    if (Test-Path "$PackageRoot\$file") {
        Copy-Item "$PackageRoot\$file" "$ProjectRoot\$file" -Force
    }
}

$envPath = "$ProjectRoot\backend\.env"
if (!(Test-Path $envPath)) {
    Copy-Item "$ProjectRoot\backend\.env.example" $envPath
    Write-Warning "Created backend/.env from the example. Restore your Neon and Gemini values before starting."
}

$envLines = @(Get-Content -LiteralPath $envPath -ErrorAction SilentlyContinue)
if (-not ($envLines -match '^\s*JWT_SECRET_KEY\s*=')) {
    $bytes = New-Object byte[] 48
    [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    $secret = [Convert]::ToBase64String($bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=')
    Add-Content -LiteralPath $envPath -Value "`nJWT_SECRET_KEY=$secret"
    Add-Content -LiteralPath $envPath -Value "ACCESS_TOKEN_EXPIRE_MINUTES=30"
    Add-Content -LiteralPath $envPath -Value "REFRESH_TOKEN_EXPIRE_DAYS=7"
}

$defaults = @{
    "ENVIRONMENT" = "development"
    "REDIS_URL" = "redis://localhost:6379/0"
    "CACHE_TTL_SECONDS" = "300"
    "AWS_REGION" = "ap-south-1"
    "S3_KEY_PREFIX" = "sourcewise"
}
$envLines = @(Get-Content -LiteralPath $envPath -ErrorAction SilentlyContinue)
foreach ($name in $defaults.Keys) {
    if (-not ($envLines -match "^\s*$name\s*=")) {
        Add-Content -LiteralPath $envPath -Value "$name=$($defaults[$name])"
    }
}

if (-not $SkipDependencies) {
    $python = "$ProjectRoot\backend\.venv\Scripts\python.exe"
    if (Test-Path $python) {
        & $python -m pip install -r "$ProjectRoot\backend\requirements.txt"
    }
    else {
        Write-Warning "backend/.venv was not found. Create it and install requirements manually."
    }
}

Write-Host ""
Write-Host "SourceWise enterprise files installed successfully." -ForegroundColor Green
Write-Host "Backup: $backup"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Open $envPath"
Write-Host "2. Add INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD"
Write-Host "3. Configure S3_BUCKET_NAME and keep the existing Neon/Gemini values"
Write-Host "4. Start Redis: docker run --name sourcewise-redis -p 6379:6379 -d redis:7.4-alpine"
Write-Host "5. Run from backend: python scripts\init_enterprise.py"
Write-Host "6. Start backend and frontend normally"
