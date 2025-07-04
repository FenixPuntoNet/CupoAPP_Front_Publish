#!/bin/bash

# Script para debuggear el usuario específico karina@gmail.com
# Ejecutar después de desplegar el worker actualizado

echo "🔍 Testing debug endpoint for karina@gmail.com..."

# Reemplaza YOUR_WORKER_URL con la URL real de tu worker
WORKER_URL="https://auth-worker.kngsdata.workers.dev"

# Test 1: Debug del usuario específico
echo "📊 Testing /auth/debug-user endpoint..."

curl -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:5176" \
  -d '{
    "email": "karina@gmail.com",
    "password": "Veolia2020"
  }' \
  "${WORKER_URL}/auth/debug-user" \
  | python3 -m json.tool

echo ""
echo "🏥 Testing health check..."

curl -X GET "${WORKER_URL}/health" | python3 -m json.tool

echo ""
echo "✅ Debug tests completed!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Revisar el output del debug para ver en qué tabla está el usuario"
echo "2. Verificar el status actual (debería ser 'pending_deletion')"
echo "3. Confirmar si el worker está buscando en la tabla correcta"
echo "4. Probar la recuperación de cuenta después del análisis"
