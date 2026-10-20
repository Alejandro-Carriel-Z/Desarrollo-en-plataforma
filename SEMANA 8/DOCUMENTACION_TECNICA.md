# SecureGuard — Documentación técnica (Unidad 8)

| Campo | Valor |
|---|---|
| Proyecto | SecureGuard: plataforma de gestión de incidentes de seguridad |
| Autor | Alejandro David Carriel Zambrano — PUCE, Desarrollo en Plataformas |
| Versión | 8.0.0 (etiqueta sugerida `v8.0.0`) |
| Fecha | 19 de octubre de 2026 |
| Repositorio | https://github.com/Alejandro-Carriel-Z/Desarrollo-en-plataforma (carpeta `SEMANA 8/`) |
| URL de producción | `https://<tu-servicio>.up.railway.app` (completar tras desplegar) |

## 1. Problema y usuarios
Un equipo SOC necesita registrar, clasificar y dar seguimiento a incidentes de seguridad de forma trazable. Hay tres perfiles: **analista** (registra y consulta), **supervisor** (cambia el estado del incidente) y **administrador** (reemplaza o elimina registros). La plataforma ofrece una interfaz web y una API REST protegida.

## 2. Requisitos cubiertos
| Requisito del Reto 4 | Implementación | Evidencia |
|---|---|---|
| CRUD persistente | Prisma 7 + MySQL (`Incidente`), modelo en `src/models/incidentes.model.js` | Crear, reiniciar el servicio y volver a consultar |
| Autenticación | `POST /api/auth/login`, JWT HS256 de 2 h (`src/security/token.js`) | Login correcto / 401 |
| Autorización | `exigirToken` y `exigirRol` en el servidor (`src/security/rol.js`) | 401 sin token, 403 con rol insuficiente |
| Validación | allowlist y reglas en `src/validation/incidentes.js` | 400 con datos incorrectos |
| HTTPS | Local: certificado autofirmado. Producción: TLS del proxy del hosting, redirección HTTP→HTTPS y HSTS | Candado del navegador y `curl -I` |
| Configuración por entorno | `src/config/env.js`, `.env.example`, variables del panel | Log de inicio, falla clara si falta una variable |
| Logs | `src/middleware/logger.js`: JSON por línea con nivel, ruta, código, duración y `requestId`; oculta claves y tokens | Captura de logs del hosting |
| Health check | `GET /api/salud`: proceso + `SELECT 1` a la base, versión y commit | 200 / 503 |
| Pruebas finales | Jest + supertest (unitarias e integración HTTP), ESLint, `npm run smoke` contra la URL | Salida de consola |

## 3. Arquitectura
Patrón MVC por capas: el cliente (HTML, CSS y JS con módulos: modelo, vista y controlador) llama a la API Express del mismo origen (`/api`). Las rutas pasan por middleware (cabeceras de seguridad, CORS, logger, JSON con límite de 20 kb, token y rol), los controladores coordinan HTTP, la validación filtra datos y el modelo accede a MySQL mediante Prisma.

```mermaid
flowchart LR
    U[Usuario: navegador] -- HTTPS --> P[Proxy TLS del hosting<br/>Railway]
    P -- HTTP interno --> A[Express app<br/>src/app.js]
    subgraph API[SecureGuard API Node 22]
        A --> M1[Cabeceras de seguridad + CORS]
        M1 --> M2[Logger JSON + requestId]
        M2 --> R1[/api/auth/]
        M2 --> R2[/api/incidentes/]
        M2 --> H[/api/salud/]
        R2 --> T[exigirToken JWT] --> RO[exigirRol] --> C[Controlador] --> V[Validación] --> MO[Modelo Prisma]
        R1 --> CA[auth.controller + bcrypt]
    end
    MO --> DB[(MySQL 8<br/>Incidente, Usuario)]
    CA --> DB
    H --> DB
    A --> L[[Logs del hosting / logs/app.log]]
```

Flujo de una operación (crear incidente): el navegador envía `POST /api/incidentes` con `Authorization: Bearer <token>`. `exigirToken` verifica la firma y el vencimiento y que el usuario siga activo; `exigirRol("analista","admin")` revisa el rol; `validarCreacion` aplica la allowlist; el modelo inserta en una transacción y genera el código `INC-###`; la respuesta es `201` y el logger registra método, ruta, estado y duración.

## 4. Estructura
```
SEMANA 8/
├── server.js                 # arranque: valida entorno, HTTPS local o HTTP tras proxy, apagado ordenado
├── src/
│   ├── app.js                # app Express (exportada para pruebas con supertest)
│   ├── config/env.js         # configuración por entorno y validación de variables
│   ├── controllers/          # auth e incidentes
│   ├── routes/               # /api/auth y /api/incidentes
│   ├── models/               # acceso a datos (Prisma)
│   ├── validation/           # reglas de entrada y allowlist
│   ├── security/             # hash bcrypt, token JWT, middleware de rol
│   ├── middleware/           # logger estructurado y manejo de errores
│   ├── lib/prisma.js         # cliente Prisma con adaptador MariaDB (lee DATABASE_URL)
│   └── seed.js               # usuarios de demostración (claves por variable en producción)
├── prisma/                   # schema.prisma y migraciones versionadas
├── public/                   # interfaz web (index, detalle, css, js)
├── tests/                    # Jest: validación, modelo e integración HTTP
├── scripts/                  # smoke.js (prueba productiva) y medir-red.js
├── Dockerfile, docker-compose.yml, .dockerignore, railway.json
└── *.md                      # documentación, manual, presentación, guion, evidencias
```

## 5. Variables de entorno
Los valores reales nunca se escriben en el repositorio; se muestran solo nombres.

| Variable | Obligatoria | Uso |
|---|---|---|
| `NODE_ENV` | sí en producción | `development`, `production` o `test` |
| `PORT` | la inyecta el hosting | Puerto de escucha |
| `DATABASE_URL` | sí | `mysql://USUARIO:CLAVE@HOST:PUERTO/BASE` |
| `DATABASE_SSL` | no | `true` si la base exige TLS |
| `JWT_SECRET` | sí | 64 caracteres hexadecimales |
| `HTTPS_ENABLED` | no | `true` local (certs/), `false` detrás del proxy |
| `TRUST_PROXY` | no | `true` en Railway/Render (activa la redirección a HTTPS) |
| `CORS_ORIGINS` | no | Orígenes extra separados por coma |
| `LOG_LEVEL`, `LOG_FILE` | no | Nivel mínimo y archivo opcional de logs |
| `SEED_ANALISTA_PASSWORD`, `SEED_SUPERVISOR_PASSWORD`, `SEED_ADMIN_PASSWORD` | en producción | Claves de las cuentas de demostración |

Si falta `DATABASE_URL` o `JWT_SECRET`, o el secreto no tiene el formato correcto, el proceso registra un error y termina **antes** de aceptar tráfico.

## 6. Modelo de datos
- `Incidente`: id, codigo (único, `INC-###`), titulo, descripcion, severidad, prioridad, estado (por defecto "En investigación"), tipo, fecha, reportante, createdAt.
- `Usuario`: id, nombre, correo (único), password (hash bcrypt), rol, activo, createdAt.
- Migraciones: `20261007040417_init` y `20261007044322_usuarios`. En producción se aplican con `prisma migrate deploy`, que nunca borra datos.

## 7. API
| Método y ruta | Rol | Respuestas |
|---|---|---|
| `GET /api/salud` | público | 200 base conectada / 503 |
| `POST /api/auth/login` | público | 200 token / 401 |
| `GET /api/incidentes?severidad=&prioridad=&estado=` | todos | 200 / 401 |
| `GET /api/incidentes/:id` | todos | 200 / 404 |
| `POST /api/incidentes` | analista, admin | 201 / 400 / 403 |
| `PATCH /api/incidentes/:id` (solo `estado`) | supervisor, admin | 200 / 400 / 403 / 404 |
| `PUT /api/incidentes/:id` | admin | 200 / 400 / 403 / 404 |
| `DELETE /api/incidentes/:id` | admin | 200 / 403 / 404 |

Los errores tienen la forma `{ ok:false, mensaje, detalles?, requestId }`. El `requestId` también va en la cabecera `X-Request-Id` y en el log, lo que conecta el error que ve el usuario con el evento del servidor.

## 8. Seguridad
- Contraseñas con hash bcrypt; el login responde igual si falla el correo o la clave.
- JWT firmado con un secreto de 256 bits y vencimiento de 2 h; en cada petición se comprueba que el usuario siga activo.
- Autorización en el servidor: ocultar botones no basta, la API devuelve 403 aunque la petición se arme a mano.
- Validación con allowlist: PATCH solo acepta `estado` y los campos internos se rechazan.
- XSS: la interfaz pinta los datos con `textContent`; CSP restringe scripts a `self` y jQuery CDN.
- Cabeceras: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, CSP, HSTS y sin `X-Powered-By`.
- Solo `public/` es estático: `.env`, `certs/`, `server.js` y `package.json` devuelven 404.
- El cuerpo JSON está limitado a 20 kb; en producción los errores 500 no muestran detalles internos.
- Los logs ocultan los campos `password`, `token`, `authorization`, `secret` y `cookie`, y no registran cuerpos.
- Los secretos solo viven en `.env` (ignorado por Git) o en el panel del hosting.

## 9. Pruebas
| Tipo | Comando | Qué cubre |
|---|---|---|
| Análisis estático | `npm run lint` | ESLint con las reglas recomendadas |
| Unitarias | `npm test` | Validación (creación, PATCH, PUT, límites) y modelo (IDs y códigos únicos) |
| Integración HTTP | `npm test` (`tests/api.test.js`) | Salud 200/503, login 200/401, token ausente o alterado 401, rol 403, datos 400, JSON inválido 400, inexistente 404, CRUD 200/201, rutas sensibles 404, cabeceras, logger sin secretos |
| Productiva (smoke) | `BASE_URL=https://... npm run smoke` | Salud, 401, login inválido y rutas sensibles contra la URL real |
| Manual | `CHECKLIST_EVIDENCIAS.md` | Recorrido completo, persistencia tras reinicio, móvil |

## 10. Instalación local
1. `npm install` (genera el cliente Prisma).
2. Copia `.env.example` a `.env` y complétalo. Levanta MySQL, por ejemplo con `docker start mysql-incidentes`.
3. `npm run cert`, `npm run migrate`, `npm run seed`.
4. `npm start` y abre `https://localhost:3000`.
5. Alternativa con todo en contenedores: `docker compose up -d --build` y `docker compose exec app npm run seed`; abre `http://localhost:8080`.

## 11. Despliegue (Railway, recomendado)
Railway ofrece un servicio Node y una base **MySQL administrada** en el mismo proyecto, usa el `Dockerfile` y el health check de `railway.json`, y entrega HTTPS automático. Render no ofrece MySQL gratuito; habría que combinarlo con una base externa (Aiven o TiDB Cloud con `DATABASE_SSL=true`). Ver los pasos en `DESPLIEGUE.md`.

**Trazabilidad:** cada despliegue sale de un commit de `main`. `/api/salud` muestra `commit` y `version`, y la versión final se etiqueta como `v8.0.0`.

**Reversión:** en Railway, Deployments, se elige el último despliegue estable y se pulsa *Redeploy*, o se hace `git revert` del commit defectuoso. Las migraciones son aditivas, así que revertir el código no rompe el esquema. Antes de migrar se respalda la base con `mysqldump`. Después de cada despliegue hay una ventana de observación de 15 minutos con salud, errores 5xx y latencia en los logs.

## 12. Monitoreo
- El health check del hosting reinicia la instancia si `/api/salud` falla.
- Logs JSON: filtra `"nivel":"ERROR"` o busca por `requestId` en el panel de logs.
- Umbrales sugeridos: más del 5 % de respuestas 5xx en 5 minutos, o salud 503 durante más de 2 minutos, requiere acción. Monitor externo gratuito opcional: UptimeRobot sobre `/api/salud`.

## 13. Limitaciones y mejoras
| Limitación | Mejora propuesta |
|---|---|
| Sin límite de intentos de login (fuerza bruta) | `express-rate-limit` y bloqueo progresivo |
| Token en `sessionStorage`, sin revocación ni refresh | Cookie HttpOnly + SameSite, refresh token y lista de revocación |
| Las pruebas de integración usan una base simulada | Pruebas e2e con MySQL en CI (GitHub Actions + servicio mysql) |
| Plan gratuito: suspensión, recursos y retención de logs limitados | Plan pagado, alertas y logs centralizados |
| Sin auditoría de quién cambió cada incidente | Tabla de historial (usuario, acción y fecha) |
| Cuentas de demostración compartidas | Gestión de usuarios, MFA y política de contraseñas |
| jQuery desde CDN | Servirlo localmente o con SRI |

Esta es una **solución académica**. Para tratar información institucional real se necesitarían pentest, respaldos probados, MFA, acuerdos de servicio, cumplimiento (LOPDP, ISO 27001) y responsables de operación.
