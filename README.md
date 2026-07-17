# WowSmart

Aplicacion SaaS para catalogo digital, punto de venta, gestion comercial y pagos de suscripcion.

## Requisitos

- Node.js 20+
- Cuenta y proyecto en Supabase
- Variables de entorno configuradas

## Configuracion local

1. Instala dependencias:

```bash
npm install
```

2. Copia `.env.example` a `.env` y completa los valores.

3. Ejecuta el servidor de desarrollo:

```bash
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Produccion

En produccion estas variables son obligatorias:

- `NODE_ENV=production`
- `USE_SUPABASE_DB=true`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPERADMIN_EMAIL`
- `SUPERADMIN_PASSWORD`
- `SUPERADMIN_SESSION_SECRET`

Build:

```bash
npm run build
```

Start:

```bash
npm start
```

## Supabase

Antes de activar `USE_SUPABASE_DB=true`, ejecuta en el SQL Editor de Supabase:

1. `supabase/migrations/20240101000000_initial_schema.sql`
2. `supabase/migrations/20260717000000_production_hardening.sql`

La segunda migracion corrige politicas RLS recursivas comunes en `profiles`, agrega columnas usadas por la app y prepara tablas auxiliares.

## Seguridad

- Las credenciales de SuperAdmin se validan en el servidor y no deben usar prefijo `VITE_`.
- El servidor falla al iniciar en produccion si faltan variables criticas.
- `SUPERADMIN_SESSION_SECRET` debe ser un valor largo, aleatorio y privado.
- `RESEND_API_KEY` es opcional; si falta, el envio de correos queda simulado.

## Verificacion

```bash
npm run lint
npm run build
```
