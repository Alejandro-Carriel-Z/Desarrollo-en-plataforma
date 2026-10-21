# Checklist del PDF de evidencias (Unidad 8)

Pon en cada captura la **fecha, la URL y la versión o commit** visibles. **Nunca** muestres valores de variables, tokens ni claves: tapa o recorta.

| # | Evidencia | Cómo obtenerla | Requisito |
|---|---|---|---|
| 01 | Repositorio en GitHub con la carpeta `SEMANA 8` y el commit o etiqueta `v8.0.0` | GitHub → Commits / Tags | Repositorio versionado |
| 02 | `npm run lint` con 0 errores | Terminal | Análisis estático |
| 03 | `npm test` con todas las pruebas en verde | Terminal | Pruebas finales |
| 04 | Render: Blueprint aplicado, build y deploy *Live* | Dashboard → Events | Despliegue |
| 05 | Deploy Logs con `servidor iniciado` y `entorno: production` | Logs | Log de inicio (Tabla 1) |
| 06 | Panel de variables con **solo los nombres** (valores ocultos) | Variables | Configuración por entorno |
| 07 | `https://<url>/api/salud` → 200, `base: conectada`, commit | Navegador | Health check (Tabla 1) |
| 08 | Candado HTTPS y certificado válido de la URL | Navegador | HTTPS |
| 09 | `npm run smoke` contra la URL, todo OK | Terminal | Prueba productiva |
| 10 | Login con credenciales inválidas → mensaje | UI | Autenticación |
| 11 | Login correcto como analista | UI | Autenticación |
| 12 | Crear incidente → aparece con `INC-###` | UI | CRUD (create) |
| 13 | Dato inválido → 400 con detalle | UI o DevTools | Validación |
| 14 | Detalle del incidente | UI | CRUD (read) |
| 15 | Supervisor cambia el estado → 200 | UI | CRUD (update) y rol |
| 16 | Analista intenta eliminar → 403 *Permiso insuficiente* | UI o curl | Autorización |
| 17 | `/api/incidentes` sin token → 401 | Navegador o curl | Autorización |
| 18 | Admin pulsa **Cerrar** → la tarjeta queda *Cerrado* (gris) y sigue en la lista | UI | CRUD (delete lógico) |
| 19 | Restart del servicio y luego el incidente sigue ahí | Render + UI | Persistencia |
| 20 | `/.env` y `/server.js` → 404 | Navegador | Ausencia de secretos |
| 21 | Log de un error 4xx/5xx con `requestId` y sin token | Render → Logs | Monitoreo (Tabla 1) |
| 22 | DevTools → cabeceras CSP, HSTS y X-Frame-Options | Network | Seguridad |
| 23 | Vista móvil (DevTools modo dispositivo) | Navegador | Revisión productiva 15.5 |
| 24 | Fragmento del diagrama de arquitectura | DOCUMENTACION_TECNICA.md | 16.1 |
| 25 | 6.º login fallido → 429 *Demasiados intentos* (DevTools) | UI o DevTools | Rate limiting |
| 26 | Detalle de un incidente con *Última modificación* (usuario y fecha) | detalle.html | Auditoría |
| 27 | Supervisor usa el selector de estado → Resuelto | UI | PATCH por rol |
| 28 | Admin edita con el formulario (PUT) → 200 | UI | PUT |
| 29 | Cerrar un incidente ya cerrado → 409 (DevTools) | DevTools | Borrado lógico |
| 30 | `render.yaml` con `sync: false` y el panel Environment con los valores ocultos | GitHub + Render | Secretos |
| 31 | Render → base `secureguard-db` (Postgres 16, Free, fecha de expiración visible) | Dashboard | Base de datos |

Guárdalas en `SEMANA 8/evidencias/` con el nombre `NN-descripcion.png`. Arma el PDF (Word → Exportar PDF) con portada, URL, repositorio, versión, la tabla anterior y cada captura con un pie que explique el resultado esperado frente al obtenido. Cierra con limitaciones y lecciones. El PDF es tu trabajo y sí puede subirse; el PDF del docente no.
