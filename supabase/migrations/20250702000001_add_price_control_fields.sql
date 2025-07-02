-- Agregar campos para controlar límites de precio y alertas
ALTER TABLE assumptions ADD COLUMN price_limit_percentage DECIMAL(5,2) DEFAULT 50.00;
ALTER TABLE assumptions ADD COLUMN alert_threshold_percentage DECIMAL(5,2) DEFAULT 20.00;

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN assumptions.price_limit_percentage IS 'Porcentaje máximo de variación permitida sobre el precio sugerido (ej: 50 = ±50%)';
COMMENT ON COLUMN assumptions.alert_threshold_percentage IS 'Porcentaje a partir del cual se muestran alertas (ej: 20 = alertas si >20% o <-20%)';

-- Actualizar el registro existente con los valores por defecto
UPDATE assumptions SET 
    price_limit_percentage = 50.00,
    alert_threshold_percentage = 20.00
WHERE id = 1;
