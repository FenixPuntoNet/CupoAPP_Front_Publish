-- Crear tabla assumptions para controlar variables de configuración de la plataforma
CREATE TABLE assumptions (
    id SERIAL PRIMARY KEY,
    
    -- Variables de precio por km
    urban_price_per_km DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    interurban_price_per_km DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Porcentaje de fee por cupo
    fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    -- Campos de auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentarios para documentar la tabla
COMMENT ON TABLE assumptions IS 'Tabla para controlar variables de configuración de la plataforma';
COMMENT ON COLUMN assumptions.urban_price_per_km IS 'Precio promedio por kilómetro en zonas urbanas';
COMMENT ON COLUMN assumptions.interurban_price_per_km IS 'Precio promedio por kilómetro en zonas interurbanas';
COMMENT ON COLUMN assumptions.fee_percentage IS 'Porcentaje de comisión que se cobra por cupo (0-100)';

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_assumptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar updated_at
CREATE TRIGGER update_assumptions_updated_at_trigger
    BEFORE UPDATE ON assumptions
    FOR EACH ROW
    EXECUTE FUNCTION update_assumptions_updated_at();

-- Insertar configuración inicial por defecto (solo un registro que siempre se usa)
INSERT INTO assumptions (
    urban_price_per_km,
    interurban_price_per_km,
    fee_percentage
) VALUES (
    2500.00,  -- $2,500 por km urbano (ejemplo)
    3000.00,  -- $3,000 por km interurbano (ejemplo)
    10.00     -- 10% de fee (ejemplo)
);

-- RLS (Row Level Security) - Solo lectura para la aplicación
ALTER TABLE assumptions ENABLE ROW LEVEL SECURITY;

-- Política para lectura (todos pueden leer la configuración)
CREATE POLICY "Everyone can read assumptions" ON assumptions
    FOR SELECT USING (true);
