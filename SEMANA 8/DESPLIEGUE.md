# Despliegue de SecureGuard en Railway (paso a paso)

Opción recomendada: **Railway**. Tiene MySQL administrado en el mismo proyecto, construye con el `Dockerfile`, entrega HTTPS automático y usa el health check de `railway.json`. Hay crédito de prueba gratuito; revisa el límite vigente en tu cuenta.

## 0. Antes de publicar
1. En `SEMANA 8/`: `npm run verificar` (lint + tests) debe quedar en verde.
2. Verifica que el commit esté subido a `main` y anota su hash.
3. Genera los secretos **en tu PC** y no los pegues en ningún archivo del repo:
   - `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` → `JWT_SECRET`
   - Tres claves para las cuentas demo (mínimo 12 caracteres).

## 1. Crear el proyecto
1. Entra en https://railway.com e inicia sesión con GitHub.
2. Haz clic en **New Project → Deploy from GitHub repo** y elige `Alejandro-Carriel-Z/Desarrollo-en-plataforma`.
3. En el servicio creado, abre **Settings → Source → Root Directory** y escribe `SEMANA 8`. Railway detecta `Dockerfile` y `railway.json`.
4. En el mismo proyecto, ve a **+ New → Database → MySQL**.

## 2. Variables del servicio web (pestaña Variables)
| Nombre | Valor |
|---|---|
| `DATABASE_URL` | `${{MySQL.MYSQL_URL}}` (referencia a la base de Railway) |
| `JWT_SECRET` | el hex de 64 caracteres que generaste |
| `NODE_ENV` | `production` |
| `HTTPS_ENABLED` | `false` |
| `TRUST_PROXY` | `true` |
| `LOG_LEVEL` | `info` |
| `SEED_ANALISTA_PASSWORD` / `SEED_SUPERVISOR_PASSWORD` / `SEED_ADMIN_PASSWORD` | tus claves demo |

No definas `PORT`: Railway lo inyecta solo.

## 3. Dominio y primer despliegue
1. Ve a **Settings → Networking → Generate Domain**. Obtienes `https://<nombre>.up.railway.app`.
2. Agrega esa URL en `CORS_ORIGINS`.
3. Railway construye la imagen y, al arrancar, `npm run start:prod` aplica `prisma migrate deploy` antes de iniciar el servidor.
4. En **Deploy Logs** debe verse `"mensaje":"servidor iniciado"` con `"entorno":"production"`. Esto es una evidencia.

## 4. Crear los usuarios demo (una sola vez)
Instala la CLI con `npm i -g @railway/cli`. Después ejecuta `railway login`, `railway link` (elige el proyecto y el servicio) y `railway run npm run seed`.
Otra opción es el botón de comando o shell del servicio en el panel, si tu plan lo ofrece.

> Nota: `railway run` ejecuta en tu PC con las variables del servicio. Si la base solo es accesible por la red interna, usa en su lugar `DATABASE_URL=${{MySQL.MYSQL_PUBLIC_URL}}` de forma temporal o el shell del panel.

## 5. Verificar producción
```powershell
$env:BASE_URL="https://<nombre>.up.railway.app"; npm run smoke
```
Opcional: `$env:SMOKE_CORREO="analista@secureguard.edu"; $env:SMOKE_PASSWORD="<clave demo>"`.
Después recorre a mano el `CHECKLIST_EVIDENCIAS.md`: login, CRUD, roles, reinicio (botón **Restart**) y persistencia.

## 6. Etiquetar la versión entregada
```powershell
git tag -a v8.0.0 -m "Entrega final Unidad 8"; git push origin v8.0.0
```
El commit que muestra `/api/salud` debe coincidir con la etiqueta.

## 7. Reversión
- Para volver a una versión anterior, abre **Deployments → despliegue estable anterior → Redeploy**.
- Para corregir con trazabilidad, usa `git revert <commit>` y `git push`; Railway redespliega solo.
- Antes de cambios de esquema, respalda con `mysqldump` usando la URL pública de la base.

## 8. Después de la evaluación
Cambia las claves demo y `JWT_SECRET`, que invalida los tokens activos. Si el servicio ya no se usará, borra los datos de demostración o elimina el proyecto.

## Alternativa: Render + MySQL externo
Render no tiene MySQL gratuito. Crea una base MySQL gratuita en Aiven o TiDB Cloud y usa `DATABASE_SSL=true`. En Render crea un **Web Service** de tipo Docker con Root Directory `SEMANA 8`, Health Check Path `/api/salud` y las mismas variables. El plan free se suspende por inactividad, así que el primer acceso tarda unos 50 s; explícalo en la defensa.
