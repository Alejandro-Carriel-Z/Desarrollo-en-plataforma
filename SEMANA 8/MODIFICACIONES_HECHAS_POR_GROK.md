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
| `GUION_VIDEO_DEFENSA.md` | Nuevo | 16.4: guion de ≤ 20 min y preguntas con respuesta |
| `CHECKLIST_EVIDENCIAS.md` | Nuevo | 24 capturas para el PDF de evidencias |
| `RETROALIMENTACION_Y_LECCIONES.md` | Nuevo | 16.5: retroalimentación clasificada, retrospectiva y lecciones |
| `MODIFICACIONES_HECHAS_POR_GROK.md` | Nuevo | Este archivo |

## Fuera de la carpeta
| Archivo | Motivo |
|---|---|
| `README.md` (raíz del repo) | Fila nueva para `SEMANA 8/` |
