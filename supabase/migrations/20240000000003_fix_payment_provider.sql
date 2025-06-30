
-- Primero, eliminar la restricción existente si existe
ALTER TABLE payment_gateways DROP CONSTRAINT IF EXISTS payment_gateways_provider_check;

-- Agregar la nueva restricción para el campo provider
ALTER TABLE payment_gateways 
ADD CONSTRAINT payment_gateways_provider_check 
CHECK (provider IN ('WOMPI', 'STRIPE', 'PAYPAL'));

-- Asegurarnos que el campo provider tenga un valor por defecto
ALTER TABLE payment_gateways 
ALTER COLUMN provider SET DEFAULT 'WOMPI';

-- Actualizar el comentario de la columna
COMMENT ON COLUMN payment_gateways.provider IS 'Proveedor de pago: WOMPI, STRIPE, PAYPAL';
