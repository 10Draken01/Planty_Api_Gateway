# Script para verificar el API Gateway de Planty
# Ejecutar: .\test-gateway.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test API Gateway - Planty" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Función para verificar un endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url
    )

    Write-Host "Testing $Name..." -NoNewline
    try {
        $response = Invoke-RestMethod -Uri $Url -Method Get -TimeoutSec 5 -ErrorAction Stop
        Write-Host " [OK]" -ForegroundColor Green
        Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
        return $true
    }
    catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Verificar que Docker esté corriendo
Write-Host "1. Verificando Docker..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    $null = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Docker está corriendo" -ForegroundColor Green
        $dockerRunning = $true
    }
    else {
        Write-Host "   [X] Docker no está corriendo" -ForegroundColor Red
        Write-Host "   Por favor inicia Docker Desktop" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   [X] Error al verificar Docker" -ForegroundColor Red
}

if (-not $dockerRunning) {
    Write-Host ""
    Write-Host "No se puede continuar sin Docker corriendo." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Verificando contenedores de Planty..." -ForegroundColor Yellow

$containers = @(
    "planty-api-gateway",
    "planty-authentication",
    "planty-api-users",
    "planty-api-chatbot",
    "planty-api-orchard",
    "planty-mongodb"
)

$allRunning = $true
foreach ($container in $containers) {
    $status = docker ps --filter "name=$container" --format "{{.Status}}" 2>&1
    if ($status -match "Up") {
        Write-Host "   [OK] $container" -ForegroundColor Green
    }
    else {
        Write-Host "   [X] $container (no esta corriendo)" -ForegroundColor Red
        $allRunning = $false
    }
}

if (-not $allRunning) {
    Write-Host ""
    Write-Host "   Algunos contenedores no estan corriendo." -ForegroundColor Yellow
    Write-Host "   Ejecuta: docker-compose up -d" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "3. Testing endpoints del API Gateway..." -ForegroundColor Yellow

# Test API Gateway health
$gatewayOk = Test-Endpoint "API Gateway Health" "http://localhost:3000/health"

Write-Host ""

if ($gatewayOk) {
    Write-Host "4. Rutas disponibles..." -ForegroundColor Yellow

    Write-Host "   Las siguientes rutas estan disponibles:" -ForegroundColor Gray
    Write-Host "   - POST http://localhost:3000/api/auth/login" -ForegroundColor Gray
    Write-Host "   - POST http://localhost:3000/api/auth/register" -ForegroundColor Gray
    Write-Host "   - GET  http://localhost:3000/api/users/:id (requiere token)" -ForegroundColor Gray
    Write-Host "   - POST http://localhost:3000/api/chat/message (requiere token)" -ForegroundColor Gray
    Write-Host "   - GET  http://localhost:3000/api/orchards (requiere token)" -ForegroundColor Gray

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  [OK] API Gateway esta funcionando" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuracion para Flutter:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Emulador Android:" -ForegroundColor Yellow
    Write-Host "  API_URL=http://10.0.2.2:3000/api" -ForegroundColor White
    Write-Host ""
    Write-Host "  Desarrollo local:" -ForegroundColor Yellow
    Write-Host "  API_URL=http://localhost:3000/api" -ForegroundColor White
    Write-Host ""
    Write-Host "  Dispositivo fisico:" -ForegroundColor Yellow

    # Obtener IP local
    try {
        $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi*" -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
        if ($ipAddress) {
            Write-Host "  API_URL=http://$ipAddress:3000/api" -ForegroundColor White
        }
        else {
            Write-Host "  API_URL=http://TU_IP_LOCAL:3000/api" -ForegroundColor White
            Write-Host "  (Ejecuta 'ipconfig' para obtener tu IP)" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "  API_URL=http://TU_IP_LOCAL:3000/api" -ForegroundColor White
        Write-Host "  (Ejecuta 'ipconfig' para obtener tu IP)" -ForegroundColor Gray
    }
}
else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  [X] API Gateway no responde" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Posibles soluciones:" -ForegroundColor Yellow
    Write-Host "1. Verifica que Docker este corriendo" -ForegroundColor White
    Write-Host "2. Ejecuta: docker-compose up -d" -ForegroundColor White
    Write-Host "3. Verifica los logs: docker logs planty-api-gateway" -ForegroundColor White
    Write-Host "4. Reinicia el Gateway: docker-compose restart api-gateway" -ForegroundColor White
}

Write-Host ""
