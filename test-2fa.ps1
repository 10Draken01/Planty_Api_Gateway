# ============================================================================
# SCRIPT DE PRUEBA 2FA - Planty Authentication
# ============================================================================
# Este script prueba el flujo completo de autenticación 2FA
# ============================================================================

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3002"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PRUEBA DE AUTENTICACION 2FA - PLANTY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================================================
# PASO 1: REGISTRO DE USUARIO
# ============================================================================
Write-Host "[PASO 1] Registrando nuevo usuario..." -ForegroundColor Yellow

$registerData = @{
    name = "Usuario Test"
    email = "test-$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
    password = "password123"
} | ConvertTo-Json

Write-Host "`nDatos de registro:" -ForegroundColor Gray
Write-Host $registerData -ForegroundColor Gray

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" `
        -Method Post `
        -Body $registerData `
        -ContentType "application/json"

    Write-Host "`n✓ Registro exitoso!" -ForegroundColor Green
    Write-Host "Respuesta:" -ForegroundColor Gray
    $registerResponse | ConvertTo-Json | Write-Host -ForegroundColor White

    $userEmail = ($registerData | ConvertFrom-Json).email

    Write-Host "`n⚠️  IMPORTANTE: Revisa tu email para obtener el código OTP" -ForegroundColor Yellow
    Write-Host "Email enviado a: $userEmail" -ForegroundColor Cyan

} catch {
    Write-Host "`n✗ Error en registro:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalle: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# ============================================================================
# PASO 2: VERIFICAR OTP DE REGISTRO
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "[PASO 2] Verificación de OTP de Registro" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$otp = Read-Host "Ingresa el código OTP de 6 dígitos que recibiste por email"

$verifyData = @{
    email = $userEmail
    otp = $otp
} | ConvertTo-Json

Write-Host "`nVerificando OTP..." -ForegroundColor Gray

try {
    $verifyResponse = Invoke-RestMethod -Uri "$baseUrl/auth/verify-register-2fa" `
        -Method Post `
        -Body $verifyData `
        -ContentType "application/json"

    Write-Host "`n✓ Verificación exitosa!" -ForegroundColor Green
    Write-Host "Respuesta:" -ForegroundColor Gray
    $verifyResponse | ConvertTo-Json | Write-Host -ForegroundColor White

    $token = $verifyResponse.token
    if ($token) {
        Write-Host "`n✓ Token JWT obtenido" -ForegroundColor Green
        Write-Host "Token: $token" -ForegroundColor Gray
    }

} catch {
    Write-Host "`n✗ Error en verificación:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalle: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# ============================================================================
# PASO 3: LOGIN
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "[PASO 3] Login con 2FA" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$loginData = @{
    email = $userEmail
    password = "password123"
} | ConvertTo-Json

Write-Host "Iniciando sesión..." -ForegroundColor Gray

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json"

    Write-Host "`n✓ Login iniciado!" -ForegroundColor Green
    Write-Host "Respuesta:" -ForegroundColor Gray
    $loginResponse | ConvertTo-Json | Write-Host -ForegroundColor White

    $sessionId = $loginResponse.sessionId
    Write-Host "`n⚠️  IMPORTANTE: Revisa tu email para obtener el nuevo código OTP" -ForegroundColor Yellow
    Write-Host "SessionId: $sessionId" -ForegroundColor Cyan

} catch {
    Write-Host "`n✗ Error en login:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalle: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# ============================================================================
# PASO 4: VERIFICAR OTP DE LOGIN
# ============================================================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "[PASO 4] Verificación de OTP de Login" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$loginOtp = Read-Host "Ingresa el código OTP de 6 dígitos que recibiste por email"

$verifyLoginData = @{
    sessionId = $sessionId
    otp = $loginOtp
} | ConvertTo-Json

Write-Host "`nVerificando OTP de login..." -ForegroundColor Gray

try {
    $verifyLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/verify-login-2fa" `
        -Method Post `
        -Body $verifyLoginData `
        -ContentType "application/json"

    Write-Host "`n✓ Login completado exitosamente!" -ForegroundColor Green
    Write-Host "Respuesta:" -ForegroundColor Gray
    $verifyLoginResponse | ConvertTo-Json | Write-Host -ForegroundColor White

    $finalToken = $verifyLoginResponse.token
    if ($finalToken) {
        Write-Host "`n✓ Token JWT final obtenido" -ForegroundColor Green
        Write-Host "Token: $finalToken" -ForegroundColor Gray
    }

    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "¡PRUEBA COMPLETA EXITOSA!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green

} catch {
    Write-Host "`n✗ Error en verificación de login:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalle: $responseBody" -ForegroundColor Red
    }
    exit 1
}