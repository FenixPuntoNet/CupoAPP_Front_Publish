#!/bin/bash

# Script para aplicar la migración de moderación de contenido
echo "🔄 Aplicando migración de moderación de contenido..."

# Verificar si existe la URL de la base de datos
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL no está configurada"
    echo "Por favor, configura la variable de entorno DATABASE_URL con la URL de tu base de datos PostgreSQL"
    exit 1
fi

# Ejecutar la migración
echo "📊 Ejecutando migración..."
psql $DATABASE_URL -f supabase/migrations/20250107_content_moderation.sql

if [ $? -eq 0 ]; then
    echo "✅ Migración aplicada exitosamente"
    echo ""
    echo "📋 Tablas creadas:"
    echo "   - content_reports (reportes de contenido)"
    echo "   - user_blocks (bloqueos de usuarios)"
    echo "   - user_warnings (advertencias de usuarios)"
    echo "   - user_suspensions (suspensiones de usuarios)"
    echo "   - moderation_logs (logs de moderación)"
    echo "   - filtered_messages (mensajes filtrados)"
    echo ""
    echo "🔐 Políticas de seguridad RLS habilitadas"
    echo "📈 Índices de performance creados"
    echo "🔧 Funciones y triggers configurados"
else
    echo "❌ Error al aplicar la migración"
    exit 1
fi
