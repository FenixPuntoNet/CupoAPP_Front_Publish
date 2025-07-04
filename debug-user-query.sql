-- Query de debugging para verificar el estado del usuario
-- Ejecutar esto en Supabase SQL Editor

-- 1. Verificar si el usuario existe en auth.users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'karina@gmail.com';

-- 2. Verificar si el usuario existe en public.users (tabla custom)
SELECT 
    id,
    status,
    created_at,
    updated_at,
    deactivation_date,
    scheduled_deletion_date
FROM public.users 
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'karina@gmail.com'
);

-- 3. Si hay múltiples registros, mostrar todos
SELECT 
    u.id,
    u.email,
    p.status,
    p.deactivation_date,
    p.scheduled_deletion_date,
    p.created_at as profile_created,
    u.created_at as auth_created
FROM auth.users u
LEFT JOIN public.users p ON u.id = p.id
WHERE u.email = 'karina@gmail.com';

-- 4. Ver todos los usuarios con pending_deletion para contexto
SELECT 
    u.email,
    p.status,
    p.deactivation_date,
    p.scheduled_deletion_date
FROM public.users p
JOIN auth.users u ON p.id = u.id
WHERE p.status = 'pending_deletion'
ORDER BY p.deactivation_date DESC
LIMIT 10;
