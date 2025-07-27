#!/bin/bash

# Script de verificación de funcionalidad de registro de vehículos
echo "🚗 Verificando funcionalidad de registro de vehículos..."

# Verificar que los archivos principales existan
echo "📁 Verificando archivos principales..."

files=(
    "src/routes/RegistrarVehiculo/index.tsx"
    "src/routes/RegistrarVehiculo/License.tsx" 
    "src/routes/RegistrarVehiculo/PropertyCard.tsx"
    "src/routes/RegistrarVehiculo/Soat.tsx"
    "src/routes/RegistrarVehiculo/DocumentsRequired.tsx"
    "src/services/vehicles.ts"
    "src/types/DocumentTypes.ts"
    "src/types/PropertyCardTypes.ts"
    "src/types/SoatTypes.ts"
)

missing_files=()

for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
        echo "❌ Falta: $file"
    else
        echo "✅ Existe: $file"
    fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
    echo "✅ Todos los archivos principales están presentes"
else
    echo "❌ Faltan ${#missing_files[@]} archivo(s)"
    exit 1
fi

echo ""
echo "🔍 Verificando imports en archivos TypeScript..."

# Verificar imports problemáticos
grep -r "import.*from.*'@/'" src/routes/RegistrarVehiculo/ | head -10
echo ""

echo "📋 Verificando interfaces del backend..."
grep -A 5 "interface.*FormData" src/services/vehicles.ts | head -20
echo ""

echo "🎯 Verificando funciones principales..."
functions=(
    "getMyVehicle"
    "registerVehicle" 
    "uploadVehiclePhoto"
    "getDriverLicense"
    "registerDriverLicense"
    "uploadDriverLicensePhotos"
    "getPropertyCard"
    "registerPropertyCard"
    "uploadPropertyCardPhotos"
    "getSoat"
    "registerSoat"
    "uploadSoatPhotos"
    "fileToBase64"
)

for func in "${functions[@]}"; do
    if grep -q "export.*function $func" src/services/vehicles.ts; then
        echo "✅ Función exportada: $func"
    else
        echo "❌ Función faltante: $func"
    fi
done

echo ""
echo "🔧 Verificación completa"
echo "📝 Revisa los resultados arriba para identificar cualquier problema"
