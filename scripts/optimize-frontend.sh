#!/bin/bash

# 🚀 Script de optimización de performance para CupoApp Frontend

echo "🚀 Iniciando optimización de performance del frontend..."

# Limpiar cache y node_modules
echo "🧹 Limpiando cache..."
rm -rf node_modules/.vite
rm -rf dist
npm ci

echo "📦 Analizando dependencias..."
npx depcheck --ignore-bin-package --skip-missing

echo "🔧 Optimizando build..."
# Build con optimizaciones máximas
NODE_ENV=production npm run build

echo "📊 Analizando bundle size..."
npx vite-bundle-analyzer dist

echo "🚀 Ejecutando optimizaciones finales..."

# Comprimir assets adicionales
if command -v gzip &> /dev/null; then
    echo "📦 Comprimiendo assets con gzip..."
    find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -k {} \;
fi

if command -v brotli &> /dev/null; then
    echo "📦 Comprimiendo assets con brotli..."
    find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec brotli -k {} \;
fi

echo "✅ Optimización completada!"
echo "📈 Próximos pasos:"
echo "   1. Implementar Service Worker para cache"
echo "   2. Configurar CDN para assets estáticos"
echo "   3. Habilitar HTTP/2"
echo "   4. Configurar lazy loading de imágenes"
