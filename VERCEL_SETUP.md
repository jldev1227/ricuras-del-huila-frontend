# 🚀 Configuración para Deploy en Vercel

## 📋 Problema Resuelto

El error de conexión a Supabase en Vercel se debe a que las funciones serverless crean múltiples conexiones que exceden el límite de Postgres. La solución es usar **Connection Pooling**.

---

## ✅ Pasos para Configurar

### 1. **Obtener las URLs de Supabase**

En tu dashboard de Supabase:

1. Ve a **Settings → Database**
2. En la sección **Connection String**, encontrarás dos URLs:

#### 📌 URL con Pooling (para queries en producción)
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

#### 📌 URL Directa (para migraciones)
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 2. **Configurar Variables en Vercel**

En tu proyecto de Vercel:

1. Ve a **Settings → Environment Variables**
2. Agrega las siguientes variables:

| Variable | Valor | Notas |
|----------|-------|-------|
| `DATABASE_URL` | URL con pooling (puerto 6543) + `?pgbouncer=true` | ✅ Para queries |
| `DIRECT_URL` | URL directa (puerto 5432) | ✅ Para migraciones |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[PROJECT-REF].supabase.co` | Storage |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Tu anon key | Storage |
| `JWT_SECRET` | Tu secret | Auth |
| `JWT_REFRESH_SECRET` | Tu refresh secret | Auth |
| `RESEND_API_KEY` | Tu Resend key | Emails |

**⚠️ IMPORTANTE:** Asegúrate de agregar `?pgbouncer=true` al final de `DATABASE_URL`

**Ejemplo de DATABASE_URL:**
```
postgresql://postgres.abcd1234:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### 3. **Regenerar Cliente de Prisma**

Después de actualizar el schema, ejecuta:

```bash
npx prisma generate
```

### 4. **Aplicar Migraciones (si es necesario)**

Las migraciones usarán automáticamente `DIRECT_URL`:

```bash
npx prisma migrate deploy
```

### 5. **Hacer Deploy**

```bash
git add .
git commit -m "fix: Configurar connection pooling para Supabase"
git push
```

O usa Vercel CLI:

```bash
vercel --prod
```

---

## 🔍 Verificar que Funciona

### Opción 1: Endpoint de Health Check

Crea un endpoint para verificar la conexión:

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";
import { verificarConexionDB } from "@/lib/prisma";

export async function GET() {
  const dbStatus = await verificarConexionDB();
  
  return NextResponse.json({
    status: dbStatus.success ? "ok" : "error",
    database: dbStatus.success ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
}
```

Luego visita: `https://tu-app.vercel.app/api/health`

### Opción 2: Logs de Vercel

1. Ve a tu proyecto en Vercel
2. Click en **Deployments**
3. Selecciona el deployment activo
4. Ve a **Functions**
5. Revisa los logs de cualquier función

**Busca errores como:**
- ❌ `too many connections`
- ❌ `connection timeout`
- ✅ Sin errores = funcionando correctamente

---

## 📊 Monitorear Conexiones en Supabase

Ejecuta esta query en Supabase SQL Editor:

```sql
SELECT 
  count(*) as total_connections,
  state,
  application_name
FROM pg_stat_activity 
WHERE datname = 'postgres'
GROUP BY state, application_name
ORDER BY total_connections DESC;
```

**Límites de conexiones por plan:**
- Free: 20 conexiones
- Pro: 50 conexiones  
- Team: 200 conexiones

---

## 🛠️ Troubleshooting

### Problema: "Too many connections"

**Solución:**
- ✅ Verifica que estés usando la URL con pooling (puerto 6543)
- ✅ Asegúrate de tener `?pgbouncer=true` en DATABASE_URL
- ✅ Reinicia el deployment en Vercel

### Problema: "Connection timeout"

**Solución:**
- ✅ Verifica que las credenciales sean correctas
- ✅ Revisa que Supabase esté activo (no pausado)
- ✅ Verifica la región del pooler

### Problema: Migraciones fallan

**Solución:**
- ✅ Usa DIRECT_URL para migraciones
- ✅ No uses `?pgbouncer=true` en DIRECT_URL
- ✅ Ejecuta migraciones localmente antes de deploy

---

## 📝 Checklist Final

Antes de hacer deploy, verifica:

- [ ] ✅ `DATABASE_URL` tiene puerto **6543** y `?pgbouncer=true`
- [ ] ✅ `DIRECT_URL` tiene puerto **5432** (sin pgbouncer)
- [ ] ✅ Variables configuradas en Vercel
- [ ] ✅ `npx prisma generate` ejecutado
- [ ] ✅ Schema actualizado con `directUrl`
- [ ] ✅ Prisma client optimizado (singleton pattern)
- [ ] ✅ No hay `$connect()` explícito en el código
- [ ] ✅ Logs en producción configurados a "error" solamente

---

## 🎯 Configuración Óptima

### prisma/schema.prisma
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooling
  directUrl = env("DIRECT_URL")        // Migraciones
}
```

### lib/prisma.ts
```typescript
// ✅ Singleton pattern
// ✅ No $connect() explícito
// ✅ $disconnect() solo en desarrollo
```

### Variables de Entorno
```bash
# Producción (Vercel)
DATABASE_URL="...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="...db.[PROJECT].supabase.co:5432/postgres"

# Desarrollo (Local)
DATABASE_URL="...db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="...db.[PROJECT].supabase.co:5432/postgres"
```

---

## 🚀 Resultado Esperado

Después de aplicar esta configuración:

- ✅ Sin errores de "too many connections"
- ✅ Deployment exitoso en Vercel
- ✅ API endpoints funcionando correctamente
- ✅ Queries rápidas y eficientes
- ✅ Conexiones manejadas por PgBouncer

---

**Última actualización:** Noviembre 2024  
**Autor:** Sistema de Gestión Ricuras del Huila
