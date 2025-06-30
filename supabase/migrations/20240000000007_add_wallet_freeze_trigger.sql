
-- Función para manejar el descongelamiento de fondos cuando se cancela un viaje
CREATE OR REPLACE FUNCTION handle_trip_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    trip_value numeric;
    guarantee_amount numeric;
    driver_wallet_id int;
BEGIN
    IF NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED' THEN
        -- Calcular el valor total del viaje
        trip_value := NEW.seats * NEW.price_per_seat;
        guarantee_amount := CEIL(trip_value * 0.15);
        
        -- Obtener el ID de la wallet del conductor
        SELECT w.id INTO driver_wallet_id
        FROM wallets w
        WHERE w.user_id = NEW.user_id;

        -- Descongelar el monto de garantía
        UPDATE wallets
        SET frozen_balance = frozen_balance - guarantee_amount
        WHERE id = driver_wallet_id;

        -- Registrar la transacción de descongelamiento
        INSERT INTO wallet_transactions (
            wallet_id,
            amount,
            transaction_type,
            status,
            detail,
            transaction_date
        ) VALUES (
            driver_wallet_id,
            guarantee_amount,
            'reembolso',
            'APPROVED',
            'Descongelamiento de garantía por cancelación de viaje',
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger para la cancelación de viajes
DROP TRIGGER IF EXISTS trip_cancellation_trigger ON trips;
CREATE TRIGGER trip_cancellation_trigger
    AFTER UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION handle_trip_cancellation();
