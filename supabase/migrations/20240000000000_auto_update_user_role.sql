
-- Crear función para verificar documentos
CREATE OR REPLACE FUNCTION public.check_driver_documents()
RETURNS TRIGGER AS $$
DECLARE
    has_vehicle BOOLEAN;
    has_license BOOLEAN;
    has_soat BOOLEAN;
    has_property_card BOOLEAN;
    user_status TEXT;
BEGIN
    -- Obtener el estado actual del usuario
    SELECT status INTO user_status
    FROM public.user_profiles
    WHERE user_id = NEW.user_id;

    -- Solo proceder si el usuario es PASSENGER
    IF user_status = 'PASSENGER' THEN
        -- Verificar todos los documentos
        SELECT EXISTS (
            SELECT 1 FROM public.vehicles WHERE user_id = NEW.user_id
        ) INTO has_vehicle;

        SELECT EXISTS (
            SELECT 1 FROM public.driver_licenses WHERE user_id = NEW.user_id
        ) INTO has_license;

        SELECT EXISTS (
            SELECT 1 FROM public.soat_details WHERE user_id = NEW.user_id
        ) INTO has_soat;

        SELECT EXISTS (
            SELECT 1 FROM public.property_cards WHERE user_id = NEW.user_id
        ) INTO has_property_card;

        -- Si tiene todos los documentos, actualizar a DRIVER
        IF has_vehicle AND has_license AND has_soat AND has_property_card THEN
            UPDATE public.user_profiles
            SET status = 'DRIVER'
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear triggers para cada tabla de documentos
CREATE TRIGGER check_documents_after_vehicle_insert
    AFTER INSERT OR UPDATE ON public.vehicles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_driver_documents();

CREATE TRIGGER check_documents_after_license_insert
    AFTER INSERT OR UPDATE ON public.driver_licenses
    FOR EACH ROW
    EXECUTE FUNCTION public.check_driver_documents();

CREATE TRIGGER check_documents_after_soat_insert
    AFTER INSERT OR UPDATE ON public.soat_details
    FOR EACH ROW
    EXECUTE FUNCTION public.check_driver_documents();

CREATE TRIGGER check_documents_after_property_insert
    AFTER INSERT OR UPDATE ON public.property_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.check_driver_documents();
