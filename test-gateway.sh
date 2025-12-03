#!/bin/bash

# Script para verificar el API Gateway de Planty
# Ejecutar: ./test-gateway.sh

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo -e "  Test API Gateway - Planty"
echo -e "========================================${NC}"
echo ""

# Función para verificar un endpoint
test_endpoint() {
    local name=$1
    local url=$2

    echo -n "Testing $name..."
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null)

    if [ "$response" -eq 200 ]; then
        echo -e " ${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e " ${RED}✗ FAIL${NC} (HTTP $response)"
        return 1
    fi
}

# Verificar que Docker esté corriendo
echo -e "${YELLOW}1. Verificando Docker...${NC}"
if docker ps &> /dev/null; then
    echo -e "   ${GREEN}✓ Docker está corriendo${NC}"
else
    echo -e "   ${RED}✗ Docker no está corriendo${NC}"
    echo -e "   ${YELLOW}Por favor inicia Docker${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}2. Verificando contenedores de Planty...${NC}"

containers=(
    "planty-api-gateway"
    "planty-authentication"
    "planty-api-users"
    "planty-api-chatbot"
    "planty-api-orchard"
    "planty-mongodb"
)

all_running=true
for container in "${containers[@]}"; do
    if docker ps --filter "name=$container" --format "{{.Status}}" | grep -q "Up"; then
        echo -e "   ${GREEN}✓ $container${NC}"
    else
        echo -e "   ${RED}✗ $container (no está corriendo)${NC}"
        all_running=false
    fi
done

if [ "$all_running" = false ]; then
    echo ""
    echo -e "   ${YELLOW}Algunos contenedores no están corriendo.${NC}"
    echo -e "   ${YELLOW}Ejecuta: docker-compose up -d${NC}"
    echo ""
fi

echo ""
echo -e "${YELLOW}3. Testing endpoints del API Gateway...${NC}"

# Test API Gateway health
if test_endpoint "API Gateway Health" "http://localhost:3000/health"; then
    gateway_ok=true
else
    gateway_ok=false
fi

echo ""

if [ "$gateway_ok" = true ]; then
    echo -e "${YELLOW}4. Testing rutas principales...${NC}"
    echo -e "   ${GRAY}Las siguientes rutas están disponibles:${NC}"
    echo -e "   ${GRAY}• POST http://localhost:3000/api/auth/login${NC}"
    echo -e "   ${GRAY}• POST http://localhost:3000/api/auth/register${NC}"
    echo -e "   ${GRAY}• GET  http://localhost:3000/api/users/:id (requiere token)${NC}"
    echo -e "   ${GRAY}• POST http://localhost:3000/api/chat/message (requiere token)${NC}"
    echo -e "   ${GRAY}• GET  http://localhost:3000/api/orchards (requiere token)${NC}"

    echo ""
    echo -e "${GREEN}========================================"
    echo -e "  ✓ API Gateway está funcionando"
    echo -e "========================================${NC}"
    echo ""
    echo -e "${CYAN}Configuración para Flutter:${NC}"
    echo ""
    echo -e "  ${YELLOW}Emulador Android:${NC}"
    echo -e "  API_URL=http://10.0.2.2:3000/api"
    echo ""
    echo -e "  ${YELLOW}iOS Simulator:${NC}"
    echo -e "  API_URL=http://localhost:3000/api"
    echo ""
    echo -e "  ${YELLOW}Dispositivo físico:${NC}"

    # Obtener IP local (Linux/Mac)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        ip_address=$(ipconfig getifaddr en0 2>/dev/null)
    else
        # Linux
        ip_address=$(hostname -I | awk '{print $1}')
    fi

    if [ -n "$ip_address" ]; then
        echo -e "  API_URL=http://$ip_address:3000/api"
    else
        echo -e "  API_URL=http://TU_IP_LOCAL:3000/api"
        echo -e "  ${GRAY}(Ejecuta 'ifconfig' o 'ip addr' para obtener tu IP)${NC}"
    fi
else
    echo ""
    echo -e "${RED}========================================"
    echo -e "  ✗ API Gateway no responde"
    echo -e "========================================${NC}"
    echo ""
    echo -e "${YELLOW}Posibles soluciones:${NC}"
    echo "1. Verifica que Docker esté corriendo"
    echo "2. Ejecuta: docker-compose up -d"
    echo "3. Verifica los logs: docker logs planty-api-gateway"
    echo "4. Reinicia el Gateway: docker-compose restart api-gateway"
fi

echo ""
