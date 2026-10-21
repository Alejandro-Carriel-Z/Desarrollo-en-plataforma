# Modificaciones hechas por Grok (Unidad 8)

Fecha: 19/10/2026. Base: `SEMANA 7/` con los cambios locales del estudiante posteriores a la retroalimentación (compression, `/api/listo`, `NODE_ENV`, CORS por variable, `DATABASE_SSL`, API relativa `/api`, 30 pruebas, `scripts/medir-red.js`, `GUIA_FINAL_SECUREGUARD.md`). Todo se copió a la carpeta nueva **`SEMANA 8/`**. **`SEMANA 7/` no se tocó**; sus cambios locales siguen sin commit, tal como los dejó el estudiante.

No se copiaron ni se subieron: `.env`, `certs/`, `node_modules/`, `.venv/`, `.agents/`, `.claude/`, `.windsurf/`, `skills-lock.json`, `ENTREGA_FINAL_SECUREGUARD.zip`, PDFs ni `PARA MI PARA ESTUDIAR/`.

## Código
| Archivo | Estado | Motivo |
|---|---|---|
| `src/config/env.js` | Nuevo | Configuración por entorno (`NODE_ENV`, `HTTPS_ENABLED`, `TRUST_PROXY`, `CORS_ORIGINS`, `LOG_*`) y validación de las variables obligatorias |
| `src/app.js` | Nuevo | App Express separada del arranque (permite supertest). Cabeceras de seguridad (CSP, HSTS, nosniff, X-Frame-Options), sin X-Powered-By, `trust proxy`, redirección HTTP→HTTPS en producción, JSON de máximo 20 kb, health check `/api/salud` con estado de la BD, versión, commit y uptime (200/503) |
| `server.js` | Modificado | Solo arranca: valida el entorno, usa HTTPS local o HTTP detrás del proxy, registra el inicio con un log estructurado y hace un apagado ordenado (SIGTERM) |
| `src/middleware/logger.js` | Reescrito | Logs JSON con nivel (INFO/WARN/ERROR), `requestId` (cabecera `X-Request-Id`), ruta sin query, estado y duración. Oculta password, token, authorization, secret y cookie. Archivo opcional `LOG_FILE` |
| `src/middleware/errorHandler.js` | Modificado | JSON mal formado da 400; los 500 se registran con `requestId` y no muestran detalles en producción |
| `src/seed.js` | Modificado | En producción las claves demo salen de `SEED_*_PASSWORD` (no hay claves fijas) y maneja errores |
| `package.json` / `package-lock.json` | Modificado | Nombre `secureguard-unidad8` v8.0.0; `prisma` pasa a dependencias (lo necesita el build), `postinstall` genera el cliente, `supertest` en dev y scripts `verificar` y `smoke`; `test` usa `--runInBand` |
| `eslint.config.mjs` | Modificado | Global `afterAll` para los tests |
| `tests/api.test.js` | Nuevo | Pruebas finales de integración HTTP: salud 200/503, login 200/401, token ausente o alterado 401, rol 403, datos 400, JSON inválido 400, inexistente 404, CRUD 200/201, rutas sensibles 404, cabeceras y logger sin secretos |
| `scripts/smoke.js` | Nuevo | Prueba productiva contra `BASE_URL` |

## Despliegue
| Archivo | Estado | Motivo |
|---|---|---|
| `Dockerfile` | Nuevo | Imagen de producción con Node 22; aplica migraciones y arranca |
| `.dockerignore` | Nuevo | Evita meter `.env`, certificados, logs y node_modules en la imagen |
| `docker-compose.yml` | Nuevo | App + MySQL 8.4 local tipo producción; secretos desde `.env` |
| `railway.json` | Nuevo | Build con Dockerfile, health check `/api/salud` y reinicio ante fallo |
| `.env.example` | Modificado | Todas las variables con marcadores, en español |
| `.gitignore` | Modificado | Agrega `logs/`, `*.log`, `*.zip` y `coverage/` |

## Documentación
| Archivo | Estado | Motivo |
|---|---|---|
| `README.md` | Reescrito | Resumen de la Unidad 8, índice de documentos y comandos |
| `DOCUMENTACION_TECNICA.md` | Nuevo | 16.3: arquitectura, mermaid, variables, modelo, API, seguridad, pruebas, despliegue, reversión, monitoreo y limitaciones |
| `MANUAL_USUARIO.md` | Nuevo | 16.3: tareas por rol, mensajes y solución de problemas |
| `DESPLIEGUE.md` | Nuevo | Pasos en Railway (y alternativa Render + MySQL externo) |
| `PRESENTACION.md` | Nuevo | 16.1: contenido de 10 diapositivas |
| `GUION_VIDEO_DEFENSA.md` | Nuevo (reescrito el 20/10) | 16.4: guion de video de máximo 10 min |
| `CHECKLIST_EVIDENCIAS.md` | Nuevo | 24 capturas para el PDF de evidencias |
| `RETROALIMENTACION_Y_LECCIONES.md` | Nuevo | 16.5: retroalimentación clasificada, retrospectiva y lecciones |
| `MODIFICACIONES_HECHAS_POR_GROK.md` | Nuevo | Este archivo |

## Fuera de la carpeta
| Archivo | Motivo |
|---|---|
| `README.md` (raíz del repo) | Fila nueva para `SEMANA 8/` |

## Segunda ronda (20/10/2026): video de 10 minutos y documentación ampliada
| Archivo | Cambio | Motivo |
|---|---|---|
| `GUION_VIDEO_DEFENSA.md` | Reescrito | Nueva regla del docente: máximo 10 min, repartidos en funcionalidad (2:30), estructura del código (2:30) y seguridad + CRUD por rol (4:30), con lo que se muestra y lo que se dice en cada bloque. Todo el contenido de seguridad se verificó contra el código. Incluye el anexo de preguntas. |
| `DOCUMENTACION_TECNICA.md` | Ampliado (18 secciones) | Versión y fecha, dos diagramas mermaid (componentes y secuencia login/CRUD), estructura archivo por archivo, modelo Prisma, cada ruta con ejemplos, flujo de autenticación, seguridad con mapeo OWASP Top 10, reglas de validación, logs, health check, variables, comandos, pruebas y resultados, rendimiento, despliegue y reversión, checklist de producción y limitaciones |
| `MANUAL_USUARIO.md` | Ampliado (17 secciones) | Acceso con los roles demo, permisos, paso a paso para crear, filtrar, ver detalle, cambiar estado, editar y eliminar, significado de estados y severidades, mensajes de error, solución de problemas, FAQ, cierre de sesión y vencimiento. Se corrigió el mínimo de la descripción (20 caracteres) y los nombres reales de los botones |
| `README.md` (SEMANA 8) | Una línea | Descripción del guion de 10 min |
| `MODIFICACIONES_HECHAS_POR_GROK.md` | Esta sección | Registro de cambios |

No se modificó código. Según el código, estos controles **no existen** y se documentan como limitaciones: rate limiting en el login, borrado lógico (el DELETE es físico), auditoría de cambios, revocación de tokens, edición completa en la UI (PUT solo por API), selector de estado (el botón solo pasa a "Contención en curso") y una página de detalle con datos en vivo (`detalle.html` es estática).

## Tercera ronda: PostgreSQL + Render (20/10/2026)
### Base de datos: MySQL → PostgreSQL
| Archivo | Cambio | Motivo |
|---|---|---|
| `prisma/schema.prisma` | `provider = "postgresql"`; nuevos campos `actualizadoPor String?` y `updatedAt @updatedAt` en `Incidente` | Migración a Postgres y auditoría |
| `prisma/migrations/` | **Eliminadas** `20261007040417_init` y `20261007044322_usuarios` (MySQL). **Nueva** `20261021020229_init_postgres` generada con `prisma migrate dev` contra postgres:16; `migration_lock.toml` con `postgresql` | Historial limpio para Postgres |
| `src/lib/prisma.js` | `PrismaMariaDb` → `PrismaPg` (`connectionString` = `DATABASE_URL`, pool de 5, timeout de 10 s, `DATABASE_SSL=true` → TLS) | Driver adapter de Prisma 7 para Postgres |
| `package.json` / `package-lock.json` | Se quitó `@prisma/adapter-mariadb`; se agregaron `@prisma/adapter-pg`, `pg` y `express-rate-limit`; `start:prod` = migrate deploy → seed → server | Postgres, rate limit y arranque en Render free |
| `src/seed.js` | En producción, si faltan las `SEED_*` se omite con un aviso (exit 0) en lugar de fallar | Corre en cada arranque de Render sin romperlo |
| `.env.example` | `postgresql://usuario:TU_CLAVE@localhost:5432/secureguard`, `LOGIN_MAX_INTENTOS`, `LOGIN_VENTANA_MIN` | Nueva configuración |
| `docker-compose.yml` | `mysql:8.4` → `postgres:16` (healthcheck `pg_isready`) | Entorno local igual a producción |
| `Dockerfile` | Comentario actualizado (el CMD sigue siendo `npm run start:prod`) | — |
| `railway.json` | **Eliminado** | Se cambió de hosting |
| `render.yaml` (**raíz del repo**) | **Nuevo** Blueprint: web `secureguard` (node, free, `rootDir: SEMANA 8`, `npm ci`, `npm run start:prod`, `healthCheckPath: /api/salud`, variables fijas y secretos `sync: false`) + base `secureguard-db` (Postgres 16 free) por `fromDatabase.connectionString` | Despliegue en Render |
| Consultas | Sin SQL específico de MySQL: el único SQL a mano es `SELECT 1`, compatible. La generación de `INC-###` dentro de `$transaction` funciona igual con `SERIAL` | Verificado con altas concurrentes |

### Brechas corregidas
| Archivo | Cambio |
|---|---|
| `src/app.js` | (a) `express-rate-limit` en `/api/auth/login`: 5 fallos por IP cada 15 min, `skipSuccessfulRequests`, 429 con JSON y log WARN. CORS en producción **solo** `CORS_ORIGINS` |
| `src/config/env.js` | `LOGIN_MAX_INTENTOS` y `LOGIN_VENTANA_MIN` |
| `src/models/incidentes.model.js` | (b) `eliminar` = borrado lógico (`estado: Cerrado` + `actualizadoPor`; `{yaCerrado}` si se repite). `crear` y `actualizar` registran `actualizadoPor`. `aCliente` expone `actualizadoPor` y `actualizadoEn` |
| `src/controllers/incidentes.controller.js` | Pasa `req.usuario.correo` al modelo; DELETE responde 200 con el caso cerrado o 409 si ya lo estaba |
| `src/validation/incidentes.js` | `ESTADOS` incluye `Cerrado`; PATCH no permite `Cerrado` (solo DELETE o PUT del admin) |
| `public/js/vista.js` | (c) Selector de estado + *Aplicar estado* (supervisor y admin), *Editar* y *Cerrar* (admin); los casos cerrados se ven atenuados y con controles deshabilitados; enlace *Ver detalle*; `pintarDetalle()` con textContent |
| `public/js/controlador.js` | Formulario de edición (PUT), selector de estado (PATCH), cierre con confirmación; mensajes "PostgreSQL" |
| `public/js/modelo.js` | `obtenerIncidente`, `reemplazarIncidente`, `ESTADOS_SELECCIONABLES`; mensajes para 429 y detalle de validación |
| `public/index.html` | Sección **Editar incidente** (solo admin, oculta por defecto); menú "Editar" |
| `public/detalle.html` + `public/js/detalle.js` (nuevo) | (d) Detalle real por `?id=` con `GET /api/incidentes/:id` y textContent; muestra la última modificación |
| `public/css/estilos.css` | Estilos para acciones, botones deshabilitados y tarjetas cerradas |

### Pruebas
| Archivo | Cambio |
|---|---|
| `tests/rate-limit.test.js` | Nuevo: 5 × 401 y luego 429 con JSON y cabeceras RateLimit |
| `tests/api.test.js` | DELETE lógico (200 + auditoría, 409), PATCH a Cerrado 400, PUT (admin 200, supervisor 403, incompleto 400, inexistente 404) |
| `tests/incidentes-model.test.js` | Borrado lógico sin `delete`, cerrado repetido, `actualizadoPor` en `actualizar` |

Resultado: ESLint 0 errores, Jest **4 suites, 64/64**, smoke 8/8 y CRUD por rol contra postgres:16 local (contenedor nuevo `postgres-secureguard`; `mysql-incidentes` no se tocó).

### Documentación
`DESPLIEGUE.md` (reescrito para Render), `DOCUMENTACION_TECNICA.md`, `MANUAL_USUARIO.md`, `GUION_VIDEO_DEFENSA.md` (mismos 10 minutos; seguridad con rate limit, borrado lógico y auditoría), `PRESENTACION.md`, `CHECKLIST_EVIDENCIAS.md` (evidencias 25–31), `README.md`, `RETROALIMENTACION_Y_LECCIONES.md` y este archivo. Las menciones anteriores a Railway y MySQL en las rondas 1 y 2 quedan como historial.
