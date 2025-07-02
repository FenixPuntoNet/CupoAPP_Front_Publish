-- Agregar campos para controlar porcentajes de precio y alertas
ALTER TABLE assumptions 
ADD COLUMN price_limit_percentage DECIMAL(5,2) DEFAULT 50.00,
ADD COLUMN alert_threshold_percentage DECIMAL(5,2) DEFAULT 20.00;

-- Comentarios para documentar los campos
COMMENT ON COLUMN assumptions.price_limit_percentage IS 'Porcentaje máximo de variación permitida del precio sugerido (ej: 50 = ±50%)';
COMMENT ON COLUMN assumptions.alert_threshold_percentage IS 'Porcentaje para mostrar alertas de precio (ej: 20 = alerta si está ±20% del sugerido)';

-- Insertar valores por defecto si no existen registros
INSERT INTO assumptions (price_per_km_urban, price_per_km_interurban, fee_percentage, price_limit_percentage, alert_threshold_percentage)
SELECT 1500, 2000, 15.00, 50.00, 20.00
WHERE NOT EXISTS (SELECT 1 FROM assumptions LIMIT 1);
