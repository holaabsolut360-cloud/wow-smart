-- WowSmart · 2026-11-16
-- Corrige el registro de empresas nuevas: el onboarding guarda
-- subscription_status = 'Prueba Gratuita' (15 días de prueba), pero en producción
-- existe un CHECK companies_subscription_status_check (creado fuera de las
-- migraciones del repo) que no acepta ese valor.
--
-- Valores que escribe o lee el código (server.ts, src/types.ts):
--   'Activa', 'Prueba Gratuita', 'Pendiente', 'Suspendida', 'Vencida'
--
-- PASO 0 (solo lectura, ejecutar primero y revisar):
--   SELECT conname, convalidated, pg_get_constraintdef(oid)
--     FROM pg_constraint WHERE conrelid = 'public.companies'::regclass AND contype = 'c';
--   SELECT subscription_status, count(*) FROM public.companies GROUP BY 1 ORDER BY 2 DESC;
--   Si aparece algún valor distinto de los 5 de arriba, agrégalo a la lista
--   antes de correr el PASO 1 (si no, el ADD CONSTRAINT falla y no cambia nada).

-- PASO 1 (en una sola transacción: si algo falla, no se aplica nada)
BEGIN;
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_subscription_status_check;
ALTER TABLE public.companies
  ADD CONSTRAINT companies_subscription_status_check
  CHECK (subscription_status IS NULL OR subscription_status IN
    ('Activa', 'Prueba Gratuita', 'Pendiente', 'Suspendida', 'Vencida'));
COMMIT;

-- PASO 2 (verificación, solo lectura):
--   SELECT pg_get_constraintdef(oid) FROM pg_constraint
--    WHERE conname = 'companies_subscription_status_check';
