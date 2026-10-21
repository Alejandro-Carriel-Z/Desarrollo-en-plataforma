# Despliegue de SecureGuard en Render + PostgreSQL (paso a paso)

**Versión:** 8.0.0 · **Fecha:** 20/10/2026

La plataforma se publica en **Render**: un Web Service de Node para la API y la interfaz, y una base **Render Postgres**. Todo está descrito en `render.yaml`, en la **raíz del repositorio** (Render busca el Blueprint ahí). Ese archivo apunta a `rootDir: SEMANA 8`.

## Límites del plan gratuito (según la documentación de Render, octubre 2026)
- **El Web Service free se duerme** tras 15 minutos sin tráfico. El siguiente acceso tarda **cerca de 1 minuto** en despertarlo. Hay 750 horas gratis al mes.
- **Postgres free expira 30 días después de crearse.** Después hay 14 días de gracia para pasar a un plan pago; si no, se borran los datos. Solo se permite **una** base free por cuenta y el límite es 1 GB.
- El plan free **no tiene Shell ni one-off jobs**. Por eso las migraciones y el seed corren dentro del `startCommand` (`npm run start:prod`). El seed es idempotente.
- El rollback del plan free solo permite volver a los **dos despliegues anteriores**.
- El disco es efímero, pero eso no afecta: los datos viven en Postgres y los logs en el panel.
- Fuentes: https://render.com/docs/free, https://render.com/docs/blueprint-spec

> **Plan para la defensa:** crea la base **pocos días antes** de la evaluación para que no expire. Abre la URL 2 minutos antes de grabar para que el servicio despierte.

## 0. Antes de publicar
1. En `SEMANA 8/`, ejecuta `npm run verificar`. ESLint y Jest deben quedar en verde.
2. Verifica que el commit esté en `main` (`git log -1`).
3. Genera los secretos **en tu PC** y no los guardes en el repositorio:
   - `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` genera el `JWT_SECRET`. Tiene que ser hexadecimal de 64 caracteres; el `generateValue` de Render produce base64, que la app no acepta.
   - Prepara tres claves para las cuentas demo, de 12 caracteres o más.

## 1. Opción A (recomendada): Blueprint
1. Entra en https://dashboard.render.com e inicia sesión con GitHub.
2. Haz clic en **New → Blueprint**, conecta el repositorio `Alejandro-Carriel-Z/Desarrollo-en-plataforma` y elige la rama `main`.
3. Render lee `render.yaml` y muestra lo que va a crear:
   - **secureguard**: web, runtime node, plan free, rootDir `SEMANA 8`, build `npm ci`, start `npm run start:prod`, health check `/api/salud`.
   - **secureguard-db**: Postgres 16, plan free. Su `connectionString` interna se pasa a la app como `DATABASE_URL`.
4. Render pide las variables marcadas `sync: false`:
   | Variable | Valor |
   |---|---|
   | `JWT_SECRET` | el hex de 64 caracteres |
   | `CORS_ORIGINS` | `https://secureguard.onrender.com`. Ajústalo si Render asigna otro nombre y vuelve a desplegar |
   | `SEED_ANALISTA_PASSWORD`, `SEED_SUPERVISOR_PASSWORD`, `SEED_ADMIN_PASSWORD` | tus claves demo |
   El Blueprint ya fija `NODE_ENV=production`, `HTTPS_ENABLED=false`, `TRUST_PROXY=true`, `LOG_LEVEL=info` y `NODE_VERSION=22`. `PORT` lo inyecta Render.
5. Pulsa **Apply**. Render crea la base, construye (`npm ci`, que ejecuta `prisma generate`) y arranca. El arranque hace, en orden:
   1. `prisma migrate deploy`, que aplica `20261021020229_init_postgres`.
   2. `node src/seed.js`, que crea o actualiza las 3 cuentas. Si faltan las claves, solo avisa y no crea nada.
   3. `node server.js`.
6. En **Logs** debe aparecer `"mensaje":"servidor iniciado"` con `"entorno":"production"`. Guarda la captura como evidencia.

## 2. Opción B: manual (Web Service + Postgres)
1. Ve a **New → Postgres**, ponle el nombre `secureguard-db`, la versión 16, el plan **Free** y la misma región que usarás para el servicio. Cuando esté creada, copia la **Internal Database URL**.
2. Ve a **New → Web Service** y elige el repositorio. Configura:
   - **Root Directory:** `SEMANA 8`
   - **Runtime:** Node
   - **Build:** `npm ci`
   - **Start:** `npm run start:prod`
   - **Plan:** Free
   - **Health Check Path** (en *Advanced*): `/api/salud`
3. En **Environment**, crea las mismas variables de la tabla anterior y además:
   - `DATABASE_URL`: la Internal URL de la base.
   - `NODE_ENV=production`, `HTTPS_ENABLED=false`, `TRUST_PROXY=true`, `LOG_LEVEL=info`, `NODE_VERSION=22`.
4. Pulsa **Create Web Service**.

> `DATABASE_SSL=true` solo hace falta si conectas con la **External URL**, por ejemplo desde tu PC. La interna, dentro de la misma región, no lo necesita.

## 3. Seed (cuentas demo)
- **Automático:** las claves `SEED_*` en las variables bastan. Cada arranque ejecuta el seed. Para **cambiar o rotar** una clave, edita la variable y haz **Manual Deploy**.
- **Desde tu PC** (opcional): copia la **External Database URL**, y en PowerShell ejecuta:
  `$env:DATABASE_URL="<external url>"; $env:DATABASE_SSL="true"; $env:NODE_ENV="production"; $env:SEED_ANALISTA_PASSWORD="..."; ...; npm run seed`.
  Cierra la terminal al terminar para que los valores no queden en la sesión.
- El Shell del panel y los one-off jobs solo existen en los planes pagos.

## 4. Verificar producción
```powershell
$env:BASE_URL="https://secureguard.onrender.com"; npm run smoke
# opcional, con una cuenta demo:
$env:SMOKE_CORREO="analista@secureguard.edu"; $env:SMOKE_PASSWORD="<clave demo>"; npm run smoke
```
Después recorre `CHECKLIST_EVIDENCIAS.md`: login, CRUD por rol, cierre lógico, el bloqueo 429 tras 5 intentos, **Manual Deploy → Restart service** y comprobación de que los datos persisten.

## 5. Etiquetar la versión entregada
```powershell
git tag -a v8.0.0 -m "Entrega final Unidad 8"; git push origin v8.0.0
```
`/api/salud` muestra `commit`, que sale de `RENDER_GIT_COMMIT`. Debe coincidir con el commit de la etiqueta.

## 6. Reversión
- **Rollback:** entra en **Events** (o *Deploys*), elige un despliegue anterior y pulsa **Rollback**. En el plan free solo están disponibles los dos últimos.
- **Corrección con trazabilidad:** `git revert <commit>; git push`. El `autoDeployTrigger: commit` redespliega solo.
- **Datos:** antes de un cambio de esquema, respalda desde tu PC con `pg_dump "<external url>" > respaldo.sql`; el plan free no tiene respaldos automáticos. Las migraciones son aditivas y revertir el código no borra columnas.
- **Ventana de observación:** durante 15 minutos después de cada despliegue revisa Logs (errores 5xx, avisos de rate limit) y `/api/salud`.

## 7. Después de la evaluación
- Rota `JWT_SECRET`; los tokens activos quedan inválidos.
- Rota las claves demo y redespliega.
- Si el servicio ya no se usará, borra la base, o déjala expirar si no tiene datos que conservar.

## Desarrollo local con PostgreSQL
```powershell
docker run -d --name postgres-secureguard -e POSTGRES_USER=secureguard -e POSTGRES_PASSWORD=<tu_clave> -e POSTGRES_DB=secureguard -p 5432:5432 postgres:16
# .env: DATABASE_URL="postgresql://secureguard:<tu_clave>@localhost:5432/secureguard"
npm install; npm run cert; npm run migrate; npm run seed; npm start
```
Con todo en contenedores: `docker compose up -d --build` (app + postgres:16); abre `http://localhost:8080`.
