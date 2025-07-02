-- Script para ejecutar en la consola SQL de Supabase
-- Agregar campos para controlar porcentajes de precio y alertas

-- Verificar si la tabla assumptions existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'assumptions'
);

-- Si la tabla existe, agregar los campos si no existen ya
DO $$
BEGIN
    -- Agregar price_limit_percentage si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assumptions' 
        AND column_name = 'price_limit_percentage'
    ) THEN
        ALTER TABLE assumptions ADD COLUMN price_limit_percentage DECIMAL(5,2) DEFAULT 50.00;
    END IF;
    
    -- Agregar alert_threshold_percentage si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assumptions' 
        AND column_name = 'alert_threshold_percentage'
    ) THEN
        ALTER TABLE assumptions ADD COLUMN alert_threshold_percentage DECIMAL(5,2) DEFAULT 20.00;
    END IF;
END $$;

-- Insertar valores por defecto si no existen registros
INSERT INTO assumptions (
    urban_price_per_km, 
    interurban_price_per_km, 
    fee_percentage, 
    price_limit_percentage, 
    alert_threshold_percentage,
    created_at,
    updated_at
)
SELECT 1500, 2000, 15.00, 50.00, 20.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM assumptions LIMIT 1);

-- Verificar los datos
SELECT * FROM assumptions;
