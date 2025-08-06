-- Verificar la estructura de la tabla user_profiles
-- Este script ayuda a identificar problemas con la tabla user_profiles

-- 1. Verificar si la tabla existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
);

-- 2. Ver la estructura de la tabla
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar cuántos registros hay en user_profiles
SELECT COUNT(*) as total_profiles FROM user_profiles;

-- 4. Ver algunos registros de ejemplo
SELECT user_id, first_name, last_name, phone_number, average_rating, photo_user 
FROM user_profiles 
LIMIT 5;

-- 5. Verificar si hay user_ids de trips que no tengan profile
SELECT t.user_id, t.id as trip_id
FROM trips t
LEFT JOIN user_profiles up ON t.user_id = up.user_id
WHERE up.user_id IS NULL
AND t.status = 'active'
LIMIT 10;

-- 6. Verificar si hay datos de conductores con nombres vacíos
SELECT user_id, first_name, last_name, 
       COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') as full_name
FROM user_profiles 
WHERE (first_name IS NULL OR first_name = '') 
   OR (last_name IS NULL OR last_name = '')
LIMIT 10;
