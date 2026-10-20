# SecureGuard — Documentación técnica

| Campo | Valor |
|---|---|
| Proyecto | SecureGuard: plataforma de gestión de incidentes de seguridad |
| Autor | Alejandro David Carriel Zambrano · PUCE · Desarrollo en Plataformas |
| Versión | **8.0.0** (etiqueta sugerida `v8.0.0`) |
| Fecha | 20 de octubre de 2026 |
| Repositorio | https://github.com/Alejandro-Carriel-Z/Desarrollo-en-plataforma, carpeta `SEMANA 8/` |
| URL de producción | `https://<tu-servicio>.up.railway.app` (se completa al desplegar) |
| Stack | Node.js ≥ 20 (imagen Node 22), Express 4, Prisma 7 + `@prisma/adapter-mariadb`, MySQL 8, jsonwebtoken, bcryptjs, selfsigned, compression, cors, dotenv, Jest 30, supertest, ESLint 10 |

## Índice
1. Problema y usuarios · 2. Requisitos cubiertos · 3. Arquitectura · 4. Estructura archivo por archivo · 5. Modelo de datos · 6. API · 7. Flujo de autenticación · 8. Seguridad (OWASP Top 10) · 9. Reglas de validación · 10. Logs y monitoreo · 11. Health check · 12. Variables de entorno · 13. Comandos · 14. Pruebas · 15. Rendimiento · 16. Despliegue y reversión · 17. Checklist de producción · 18. Limitaciones y trabajo futuro

---

## 1. Problema y usuarios
Un SOC académico registraba incidentes en hojas de cálculo y correos: no había trazabilidad, cualquiera podía editar y no había control de acceso. SecureGuard centraliza el registro, la clasificación (severidad y prioridad) y el seguimiento (estado) de cada incidente, con permisos por rol.

| Rol | Necesidad |
|---|---|
| **Analista** | Registrar incidentes nuevos y consultar los existentes |
| **Supervisor** | Hacer avanzar el estado de la atención (contención, resolución) |
| **Administrador** | Control total: reemplazar los datos de un incidente y eliminarlo |

## 2. Requisitos cubiertos (Reto 4)
| Requisito | Implementación | Evidencia |
|---|---|---|
| CRUD persistente | Prisma + MySQL, `src/models/incidentes.model.js` | Crear, reiniciar y volver a consultar |
| Autenticación | `POST /api/auth/login`, bcrypt + JWT | Login 200 / 401 |
| Autorización | `exigirToken` + `exigirRol` | 401 / 403 |
| Validación | `src/validation/incidentes.js` (allowlist) | 400 con detalle |
| HTTPS | Autofirmado en local; proxy TLS y redirección 301 en producción | Candado del navegador, `curl -I` |
| Configuración por entorno | `src/config/env.js`, `.env.example` | Falla clara si falta una variable |
| Logs | `src/middleware/logger.js`, JSON con requestId | Logs de Railway |
| Health check | `GET /api/salud` con la base | 200 / 503 |
| Pruebas finales | Jest + supertest, ESLint, `scripts/smoke.js` | 53/53, 0 errores, smoke OK |

## 3. Arquitectura
El patrón es MVC en el cliente (modelo, vista y controlador en `public/js`) y por capas en el servidor (rutas, controladores, validación, modelo y datos). Cliente y API comparten el mismo origen y el cliente llama a `/api` con una ruta relativa.

### 3.1 Componentes
```mermaid
flowchart LR
    U[Navegador<br/>index.html + JS MVC] -- HTTPS --> P[Proxy TLS<br/>Railway]
    P -- HTTP interno<br/>X-Forwarded-Proto --> S[server.js]
    S --> A[src/app.js]
    subgraph Express
      A --> H1[Cabeceras de seguridad] --> H2[Redirección HTTPS] --> H3[CORS] --> H4[Logger + requestId] --> H5[express.json 20kb] --> H6[compression] --> H7[static public/]
      H7 --> R0[/api/salud · /api/listo/]
      H7 --> R1[/api/auth/login/]
      H7 --> R2[/api/incidentes/]
      R2 --> T[exigirToken] --> RO[exigirRol] --> C[controlador] --> V[validación] --> M[modelo]
      R1 --> AC[auth.controller<br/>bcrypt + JWT]
      A --> E[noEncontrado + errorHandler]
    end
    M --> PR[Prisma Client<br/>adaptador MariaDB]
    AC --> PR
    T --> PR
    R0 --> PR
    PR --> DB[(MySQL 8<br/>Incidente · Usuario)]
    H4 --> L[[stdout JSON<br/>logs/app.log opcional]]
```

### 3.2 Secuencia: login y CRUD
```mermaid
sequenceDiagram
    actor U as Usuario
    participant W as Navegador (modelo.js)
    participant A as API Express
    participant DB as MySQL
    U->>W: correo + contraseña
    W->>A: POST /api/auth/login
    A->>DB: usuario.findUnique(correo)
    DB-->>A: usuario (hash bcrypt)
    A->>A: bcrypt.compare + jwt.sign (2 h)
    A-->>W: 200 {token, usuario}
    W->>W: sessionStorage.token
    U->>W: Registrar incidente
    W->>A: POST /api/incidentes + Bearer
    A->>A: jwt.verify
    A->>DB: usuario activo?
    A->>A: exigirRol(analista, admin) + validarCreacion
    A->>DB: $transaction(create PEND-uuid → update INC-###)
    DB-->>A: incidente
    A-->>W: 201 {datos}
    W->>W: textContent (render seguro)
    Note over A: sin token → 401 · rol insuficiente → 403 · datos inválidos → 400
```

### 3.3 Decisiones de diseño
- **`app.js` separado de `server.js`:** permite probar con supertest sin abrir puertos. El arranque (TLS, apagado, validación del entorno) queda aislado.
- **API sin estado (JWT):** se puede escalar horizontalmente detrás del proxy.
- **Prisma:** consultas parametrizadas, migraciones versionadas y conexión que se lee de `DATABASE_URL`.
- **TLS en el proxy en producción:** el certificado lo gestiona el hosting y la app solo exige el `X-Forwarded-Proto` correcto.

## 4. Estructura, archivo por archivo
| Ruta | Propósito |
|---|---|
| `server.js` | Punto de entrada. Valida el entorno con `validarEntorno()` y termina con `exit(1)` si falla. Elige HTTPS con `certs/` si `HTTPS_ENABLED`, o HTTP en `0.0.0.0` detrás del proxy. Registra el log de inicio (entorno, versión y commit) y hace un apagado ordenado con SIGTERM/SIGINT, cerrando Prisma. Registra las promesas no manejadas. |
| `src/app.js` | Construye la app: `x-powered-by` desactivado, `trust proxy`, cabeceras de seguridad, redirección 301 a HTTPS, CORS, logger, `express.json({limit:"20kb"})`, compresión gzip mayor a 1 KiB, estáticos de `public/`, `/api/salud`, `/api/listo`, rutas, 404 y manejador de errores. |
| `src/config/env.js` | Lee y normaliza `NODE_ENV`, `PORT`, `HTTPS_ENABLED`, `TRUST_PROXY`, `CORS_ORIGINS`, `LOG_LEVEL`, `LOG_FILE`, `APP_VERSION` y `COMMIT`. `validarEntorno()` exige `DATABASE_URL` y un `JWT_SECRET` de 64 caracteres hex. |
| `src/lib/prisma.js` | Cliente Prisma con `PrismaMariaDb`. Interpreta `DATABASE_URL` (host, puerto, usuario, clave, base), con pool de 5 y timeout de 10 s. TLS opcional con `DATABASE_SSL=true`. Lanza un error si falta la URL. |
| `src/routes/auth.routes.js` | `POST /login` → `login`. |
| `src/routes/incidentes.routes.js` | CRUD con `exigirRol` por método (ver §6). |
| `src/controllers/auth.controller.js` | Normaliza el correo (trim y minúsculas), busca el usuario, `coincide()` con bcrypt y responde 401 genérico. Firma el JWT y responde con nombre, correo y rol, sin hash. |
| `src/controllers/incidentes.controller.js` | `listar` (filtros severidad, prioridad y estado), `obtener`, `crear` (201), `actualizar` (PATCH con `validarParche`, PUT con `validarReemplazo`) y `eliminar`. 404 cuando no existe. Los errores van a `next()`. |
| `src/validation/incidentes.js` | Allowlists `CAMPOS_CREACION` y `CAMPOS_REEMPLAZO`, listas `SEVERIDADES` y `ESTADOS`, y las funciones `validarCreacion`, `validarParche` y `validarReemplazo` (ver §9). |
| `src/models/incidentes.model.js` | `aCliente()` expone solo los campos públicos (el id interno no sale; se usa `codigo` como id). `donde()` acepta el código o un id entero positivo seguro. `listar` usa un `select` explícito. `crear` es transaccional. `actualizar` tiene una segunda allowlist. `eliminar` es un DELETE físico. |
| `src/security/hash.js` | `crearHash` (bcrypt, costo 10) y `coincide`. |
| `src/security/token.js` | `firmar` (payload `{id, rol}`, HS256, `expiresIn: "2h"`) y `verificar`. |
| `src/security/rol.js` | `exigirToken` (Bearer, verificación y usuario activo en la base) y `exigirRol(...roles)`. |
| `src/middleware/logger.js` | Logger JSON con niveles, `requestId` y `X-Request-Id`. `limpiar()` oculta claves sensibles. Archivo opcional `LOG_FILE`. Se silencia con `NODE_ENV=test`. |
| `src/middleware/errorHandler.js` | `noEncontrado` (404) y `errorHandler`: JSON mal formado da 400; los 500 se registran y en producción el mensaje es genérico. Nunca envía el stack. |
| `src/seed.js` | Crea o actualiza tres usuarios demo con hash. En producción las claves salen de `SEED_*_PASSWORD`. |
| `prisma/schema.prisma` | Modelos `Incidente` y `Usuario`. |
| `prisma/migrations/` | `20261007040417_init`, `20261007044322_usuarios` y `migration_lock.toml`. |
| `prisma7.config.ts` | Rutas del schema y las migraciones; la URL sale de `DATABASE_URL`. |
| `crear-cert.js` | Genera `certs/key.pem` y `certs/cert.pem` (RSA 2048, 365 días, CN=localhost). No se suben. |
| `public/index.html` | Panel: login, resumen, filtro, listado y formulario de alta. |
| `public/detalle.html` | Ficha de ejemplo de un caso destacado (estática). |
| `public/js/modelo.js` | `pedir()` hacia `/api` con Bearer; un 401 en incidentes cierra la sesión y lanza el evento `sesion-expirada`; un 403 muestra un mensaje de permisos. Funciones de sesión en `sessionStorage` y de llamadas al CRUD. |
| `public/js/vista.js` | Pinta las tarjetas con `createElement` y `textContent`. Muestra los botones según el rol (estado para supervisor y admin, eliminar para admin). |
| `public/js/controlador.js` | Eventos de login, logout, filtro, alta (validación en cliente) y clics de estado y eliminar. |
| `public/css/estilos.css` | Estilos. |
| `tests/*.test.js` | Ver §14. |
| `scripts/smoke.js` | Prueba productiva contra `BASE_URL`. |
| `scripts/medir-red.js` | Medición identity frente a gzip (ver §15). |
| `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `railway.json` | Despliegue (ver §16). |
| `.env.example`, `.gitignore` | Plantilla de variables y exclusiones de secretos. |
| `evidencias/` | Capturas y mediciones. |
| `data/incidentes.json` | Datos heredados de semanas anteriores; no se usan. |

## 5. Modelo de datos (Prisma)
**Incidente**
| Campo | Tipo | Reglas |
|---|---|---|
| `id` | Int | PK autoincremental (interno, no se expone) |
| `codigo` | String | `@unique`, formato `INC-###` (temporal `PEND-<uuid>` dentro de la transacción) |
| `titulo` | String | 5–100 |
| `descripcion` | Text | 20–500 |
| `severidad` | String | critica, alta, media o baja |
| `prioridad` | String | mismos valores; por defecto igual a la severidad |
| `estado` | String | por defecto "En investigación" |
| `tipo` | String | 2–80 (en la UI: phishing, malware, acceso, vulnerabilidad) |
| `fecha` | String | AAAA-MM-DD, no futura |
| `reportante` | String | reportante, o el correo, o "sin-correo" |
| `createdAt` | DateTime | `now()` |

**Usuario**
| Campo | Tipo | Reglas |
|---|---|---|
| `id` | Int | PK |
| `nombre` | String | |
| `correo` | String | `@unique` |
| `password` | String | hash bcrypt |
| `rol` | String | analista, supervisor o admin |
| `activo` | Boolean | por defecto true; si es false, bloquea el login y los tokens vigentes |
| `createdAt` | DateTime | |

## 6. API
El formato de error es `{ "ok": false, "mensaje": "...", "detalles"?: {...}, "requestId"?: "uuid" }`. Todas las respuestas llevan la cabecera `X-Request-Id`.

| Método | Ruta | Rol | Cuerpo | Respuestas |
|---|---|---|---|---|
| GET | `/api/salud` | público | — | 200 / 503 |
| GET | `/api/listo` | público | — | 200 / 503 |
| POST | `/api/auth/login` | público | `{correo, password}` | 200 / 401 / 400 (JSON inválido) |
| GET | `/api/incidentes?severidad=&prioridad=&estado=` | analista, supervisor, admin | — | 200 / 401 |
| GET | `/api/incidentes/:id` (código `INC-001` o id numérico) | todos | — | 200 / 401 / 404 |
| POST | `/api/incidentes` | analista, admin | ver §9 | 201 / 400 / 401 / 403 |
| PATCH | `/api/incidentes/:id` | supervisor, admin | `{estado}` | 200 / 400 / 401 / 403 / 404 |
| PUT | `/api/incidentes/:id` | admin | los 7 campos editables | 200 / 400 / 401 / 403 / 404 |
| DELETE | `/api/incidentes/:id` | admin | — | 200 / 401 / 403 / 404 |

**Ejemplos**
```http
POST /api/auth/login
{"correo":"analista@secureguard.edu","password":"<clave demo>"}
→ 200 {"ok":true,"token":"eyJ...","usuario":{"nombre":"Ana Analista","correo":"analista@secureguard.edu","rol":"analista"}}
→ 401 {"ok":false,"mensaje":"Credenciales inválidas"}
```
```http
POST /api/incidentes   Authorization: Bearer <token>
{"titulo":"Phishing a finanzas","descripcion":"Correo suplantando al banco con enlace malicioso","severidad":"alta","tipo":"phishing","fecha":"2026-10-19","correo":"soc@empresa.com"}
→ 201 {"ok":true,"datos":{"id":"INC-018","titulo":"Phishing a finanzas","descripcion":"...","severidad":"alta","prioridad":"alta","fecha":"2026-10-19","estado":"En investigación","tipo":"phishing","reportante":"soc@empresa.com"}}
→ 400 {"ok":false,"mensaje":"Validación fallida","detalles":{"titulo":"Debe tener entre 5 y 100 caracteres."},"requestId":"..."}
→ 401 {"ok":false,"mensaje":"Token ausente"}
→ 403 {"ok":false,"mensaje":"Permiso insuficiente"}
```
```http
GET /api/incidentes?severidad=alta → 200 {"ok":true,"total":2,"datos":[{...},{...}]}
GET /api/incidentes/INC-999       → 404 {"ok":false,"mensaje":"Incidente no encontrado"}
PATCH /api/incidentes/INC-018 {"estado":"Resuelto"} → 200 {"ok":true,"datos":{...,"estado":"Resuelto"}}
PATCH ... {"estado":"Resuelto","titulo":"x"} → 400 (campo no permitido)
DELETE /api/incidentes/INC-018 (admin) → 200 {"ok":true,"datos":{...registro eliminado...}}
GET /api/salud → 200 {"ok":true,"servicio":"SecureGuard API","unidad":8,"entorno":"production","version":"8.0.0","commit":"716930e...","base":"conectada","uptimeSeg":120,"fecha":"..."}
GET /.env → 404 {"ok":false,"mensaje":"Ruta no encontrada"}
```

## 7. Flujo de autenticación
1. El cliente envía `correo` y `password`; el correo se normaliza (trim y minúsculas).
2. Se busca el usuario por correo. Si no existe, está inactivo o `bcrypt.compare` falla, responde **401 "Credenciales inválidas"** (el mismo mensaje en los tres casos).
3. Se firma un JWT HS256 con `{id, rol}`, `exp` a 2 h y `JWT_SECRET`.
4. El cliente lo guarda en `sessionStorage` y lo manda como `Authorization: Bearer`.
5. En cada petición a `/api/incidentes`: si falta el token, 401 "Token ausente"; si `jwt.verify` falla por firma o vencimiento, 401 "Token inválido o vencido"; luego se busca el usuario en la base y, si no existe o está inactivo, 401 "Usuario no activo". El rol que se usa es **el de la base**, no el del token.
6. `exigirRol` responde 403 si el rol no está en la lista.
7. Ante un 401, el cliente borra la sesión y vuelve al login. El logout borra `sessionStorage`; no hay revocación en el servidor.

## 8. Seguridad
### 8.1 Controles implementados
| Control | Dónde | Detalle |
|---|---|---|
| Hash de contraseñas | `security/hash.js` | bcryptjs con costo 10 (2¹⁰ rondas) y sal incluida |
| Login sin enumeración | `auth.controller.js` | 401 idéntico para correo inexistente, usuario inactivo o clave mala |
| JWT | `security/token.js` | HS256, 2 h, payload mínimo `{id, rol}` |
| Fortaleza del secreto | `config/env.js` | `JWT_SECRET` de 64 hex (256 bits); si no cumple, no arranca |
| Autenticación por petición | `security/rol.js` | Verifica firma y vencimiento, y que el usuario esté activo |
| Autorización | `security/rol.js` + rutas | Rol en el servidor; 401 frente a 403 |
| Allowlist | `validation/incidentes.js` y modelo | POST, PUT y PATCH rechazan campos desconocidos; el modelo filtra otra vez |
| Validación de tipo y rango | `validation/incidentes.js` | Strings, longitudes, listas cerradas, fecha real y no futura, correo |
| Límite de cuerpo | `app.js` | JSON de máximo 20 kb; JSON inválido da 400 |
| IDs seguros | `models` | Solo enteros positivos seguros; `1e309` o `1.5` no llegan como Int (evita un 500) |
| Inyección SQL | Prisma | Consultas parametrizadas; `$queryRaw` con template tag y sin datos del usuario |
| XSS | `public/js/vista.js` | `createElement` + `textContent`; CSP `script-src 'self' code.jquery.com` |
| HTTPS | `server.js`, `app.js` | Local: autofirmado. Producción: TLS en el proxy, `trust proxy` y 301 a HTTPS (salvo `/api/salud`) |
| Cabeceras | `app.js` | CSP, HSTS (180 días), nosniff, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`, sin X-Powered-By |
| CORS | `app.js` | Lista de orígenes (localhost y `CORS_ORIGINS`), métodos del CRUD, cabeceras Content-Type y Authorization |
| Superficie estática | `app.js` | Solo `public/`; `.env`, `certs/`, el código y `package.json` dan 404 |
| Secretos | `.gitignore`, `.dockerignore`, `.env.example` | `.env`, `certs/`, `*.pem`, `*.key` y logs fuera del repo y de la imagen |
| Fail-fast | `server.js` | Si falta una variable, no hay tráfico |
| Logs seguros | `logger.js` | Sin cuerpos; password, token, authorization, secret y cookie quedan `[OCULTO]`; ruta sin query |
| Errores sin fuga | `errorHandler.js` | Sin stack; 500 genérico en producción; requestId para el soporte |
| Concurrencia | `models.crear` | Transacción + `codigo @unique`: sin códigos duplicados en altas simultáneas |
| Contenedor | `Dockerfile` | `USER node` (sin root), `npm ci --omit=dev` |
| Claves demo | `seed.js` | En producción deben venir de variables |

### 8.2 Mapeo con el OWASP Top 10 (2021)
| Riesgo | Estado | Medidas / brechas |
|---|---|---|
| A01 Control de acceso roto | Mitigado | `exigirToken` + `exigirRol` en el servidor, comprobación de usuario activo, pruebas 401/403. Brecha: no hay propiedad por registro (todo analista ve todos los incidentes, que es lo esperado en un SOC). |
| A02 Fallas criptográficas | Mitigado | bcrypt, JWT con secreto de 256 bits, HTTPS y HSTS, `DATABASE_SSL` opcional. |
| A03 Inyección | Mitigado | Prisma parametrizado, allowlist, textContent y CSP. |
| A04 Diseño inseguro | Parcial | Roles y estados definidos. Brecha: el borrado es físico y no hay auditoría. |
| A05 Configuración incorrecta | Mitigado | Fail-fast, cabeceras, sin X-Powered-By, estáticos limitados, 500 genérico. |
| A06 Componentes vulnerables | Parcial | Dependencias recientes y lockfile. Pendiente: `npm audit` en CI y SRI para jQuery. |
| A07 Fallas de identificación y autenticación | Parcial | Login genérico y vencimiento de 2 h. **Brecha: sin rate limiting ni bloqueo**, sin MFA, sin revocación de tokens. |
| A08 Integridad de software y datos | Parcial | Lockfile, `npm ci`, despliegue desde un commit. Brecha: jQuery por CDN sin SRI. |
| A09 Fallas de registro y monitoreo | Mitigado | Logs JSON con nivel y requestId, health check. Brecha: no hay alertas automáticas ni registro de logins fallidos por usuario. |
| A10 SSRF | No aplica | El servidor no hace peticiones a URLs que dé el usuario. |

## 9. Reglas de validación
| Campo | POST | PUT | PATCH | Regla |
|---|:-:|:-:|:-:|---|
| titulo | obligatorio | obligatorio | ✖ | string, trim, 5–100 |
| descripcion | obligatorio | obligatorio | ✖ | string, trim, 20–500 |
| severidad | obligatorio | obligatorio | ✖ | `critica`, `alta`, `media`, `baja` |
| prioridad | opcional (= severidad) | obligatorio | ✖ | mismos valores |
| tipo | obligatorio | obligatorio | ✖ | string, 2–80 |
| fecha | obligatorio | obligatorio | ✖ | `AAAA-MM-DD`, fecha real, ≤ hoy (UTC) |
| estado | ✖ (se fija "En investigación") | obligatorio | **único campo** | `En investigación`, `Contención en curso`, `Resuelto` |
| correo | opcional | ✖ | ✖ | ≤ 254, formato `a@b.c` |
| reportante | opcional | ✖ | ✖ | ≤ 254 |
| otros (`id`, `codigo`, `rol`…) | 400 | 400 | 400 | allowlist |

El cuerpo tiene que ser un objeto (null, arreglo, string o número dan 400). En el cliente se repiten las reglas de título, descripción y fecha para dar respuesta inmediata, pero la validación que cuenta es la del servidor.

## 10. Logs y monitoreo
Formato (una línea JSON por evento):
```json
{"fecha":"2026-10-20T02:30:18.755Z","nivel":"INFO","mensaje":"solicitud","requestId":"93bc68f4-...","metodo":"POST","ruta":"/api/incidentes","estado":201,"duracionMs":238.3,"usuario":1}
```
- Niveles: `INFO` para 2xx y 3xx, `WARN` para 4xx y `ERROR` para 5xx y excepciones. El nivel mínimo se controla con `LOG_LEVEL`.
- Eventos: `servidor iniciado` (entorno, versión, commit), `solicitud`, `error no controlado`, `configuración inválida`, `apagado solicitado` y `promesa rechazada sin manejar`.
- Qué nunca se registra: cuerpos, query strings, Authorization, tokens ni contraseñas.
- Dónde se ven: stdout (el panel de logs de Railway) y, si se configura `LOG_FILE`, un archivo local (excluido de Git).
- Diagnóstico: el usuario reporta el `requestId` del error y se busca en los logs.
- Umbrales sugeridos: más del 5 % de 5xx en 5 minutos, salud en 503 durante más de 2 minutos o p95 mayor a 1 s requieren acción. Para un monitor externo gratuito sirve UptimeRobot sobre `/api/salud` cada 5 minutos.
- Ventana de observación: 15 minutos después de cada despliegue.

## 11. Health check
- `GET /api/salud` ejecuta `SELECT 1` en MySQL. Responde **200** con `base: "conectada"`, o **503** con `base: "no disponible"`. Incluye entorno, versión, commit (`RAILWAY_GIT_COMMIT_SHA` o `RENDER_GIT_COMMIT`), uptime y fecha.
- Railway lo usa (`railway.json`, timeout de 120 s) para dar por sano un despliegue y reiniciar ante un fallo.
- Está excluido de la redirección a HTTPS para que los chequeos internos funcionen.
- `GET /api/listo` es la versión mínima, que se conserva de Semana 7.
- Limitación: un 200 no garantiza que el login funcione, por eso además se corre el smoke test y el recorrido manual.

## 12. Variables de entorno (solo marcadores)
| Variable | Obligatoria | Ejemplo | Uso |
|---|---|---|---|
| `NODE_ENV` | producción | `production` | Modo |
| `PORT` | la inyecta el hosting | `3000` | Puerto |
| `DATABASE_URL` | sí | `mysql://USUARIO:CLAVE@HOST:3306/BASE` | Conexión |
| `DATABASE_SSL` | no | `false` | TLS hacia la base |
| `JWT_SECRET` | sí | `<64 hex>` | Firma de tokens |
| `HTTPS_ENABLED` | no | `true` local / `false` prod | HTTPS propio |
| `TRUST_PROXY` | no | `true` en prod | Proxy y redirección |
| `CORS_ORIGINS` | no | `https://<app>.up.railway.app` | Orígenes extra |
| `LOG_LEVEL` | no | `info` | Nivel mínimo |
| `LOG_FILE` | no | `logs/app.log` | Archivo de log |
| `APP_VERSION` | no | `8.0.0` | Sobrescribe la versión |
| `SEED_ANALISTA_PASSWORD`, `SEED_SUPERVISOR_PASSWORD`, `SEED_ADMIN_PASSWORD` | en producción | `<clave>` | Cuentas demo |

## 13. Comandos
| Comando | Acción |
|---|---|
| `npm install` | Dependencias y `prisma generate` (postinstall) |
| `npm run cert` | Certificados locales |
| `npm run migrate` | Migraciones en desarrollo |
| `npm run migrate:deploy` | Aplica las migraciones pendientes (producción) |
| `npm run seed` | Usuarios demo |
| `npm start` | Servidor |
| `npm run start:prod` | Migraciones y luego el servidor (lo usa el Dockerfile) |
| `npm run lint` / `npm test` / `npm run verificar` | ESLint, Jest, o ambos |
| `npm run smoke` | Smoke test contra `BASE_URL` |
| `npm run medir:red -- identity\|gzip` | Medición de red |
| `docker compose up -d --build` | App + MySQL en local (puerto 8080) |

## 14. Pruebas
| Suite | Casos | Cubre |
|---|---|---|
| `tests/incidentes-validation.test.js` | Unitarias | Normalización y prioridad por defecto; campos internos rechazados; 12 casos inválidos (vacío, mínimos y máximos, ausentes, fecha mal formada o futura, correo, prioridad, estado); cuerpos que no son objeto; límites exactos 100 y 500; PATCH solo estado, vacío o no texto; PUT completo, con estado o prioridad inválidos |
| `tests/incidentes-model.test.js` | Unitarias | IDs `1.5`, `1e309`, `0`, `-1` no se envían como Int; IDs decimales válidos; creación transaccional con códigos distintos |
| `tests/api.test.js` | Integración HTTP (supertest, base simulada) | Salud 200 y 503; login 401 y 200 (sin hash); sin token y token alterado 401; analista DELETE y supervisor POST 403; listar 200; crear 201; datos 400; JSON mal formado 400; inexistente 404; PATCH 200; DELETE 200; `/.env`, `/server.js`, `/certs/key.pem`, `/package.json`, `/src/app.js` y `/prisma/schema.prisma` dan 404; cabeceras presentes; logger oculta secretos |
| `scripts/smoke.js` | Productiva | Salud, 401, login inválido, rutas sensibles y login demo con listado |

**Resultados (19/10/2026, PC local con MySQL en Docker):** ESLint 0 errores; Jest **3 suites, 53/53**; smoke 8/8. CRUD real por rol: analista crea 201; supervisor crea 403; dato inválido 400; leer 200; analista PATCH 403; supervisor PATCH 200; analista DELETE 403; admin DELETE 200; leído después 404. En modo producción por HTTP: salud 200, HTTP da 301 a HTTPS y vía proxy da 200.

## 15. Rendimiento (Semana 7, conservado)
- GET del listado (5 corridas): la mediana pasó de 18 a 15 ms con un `select` explícito. La muestra es pequeña y no es concluyente.
- Imagen del encabezado: pasó de `w=1600` (193 924 B) a `w=960` (107 603 B), un 44,5 % menos.
- Gzip sobre `estilos.css` (10 muestras, mismo SHA-256): el cuerpo bajó de 7 364 a 1 959 B (−73,4 %), pero la mediana local subió de 1,694 a 2,270 ms. La mejora es de volumen, no de latencia local.
- Detalles en `evidencias/medicion-red-*.json` y `medicion-red-comparacion.txt`.

## 16. Despliegue y reversión
- **Railway (recomendado):** servicio desde GitHub con Root Directory `SEMANA 8`, Dockerfile, MySQL del mismo proyecto (`DATABASE_URL=${{MySQL.MYSQL_URL}}`), health check `/api/salud` y dominio `*.up.railway.app` con HTTPS. Pasos completos en `DESPLIEGUE.md`.
- **Imagen:** `node:22-slim` + openssl, `NODE_ENV=production`, `HTTPS_ENABLED=false`, `TRUST_PROXY=true`, `npm ci --omit=dev`, `USER node` y `CMD npm run start:prod`.
- **Alternativa:** Render (Docker) con MySQL externo (Aiven o TiDB, `DATABASE_SSL=true`). En el plan gratuito, el servicio entra en reposo.
- **Trazabilidad:** commit en `main`, `commit` visible en `/api/salud` y la etiqueta `v8.0.0`.
- **Reversión:** Railway → Deployments → Redeploy del último despliegue estable, o `git revert`. Las migraciones son aditivas y se respalda con `mysqldump` antes de cambiar el esquema.

## 17. Checklist de producción
- [ ] `npm run verificar` en verde sobre el commit que se despliega
- [ ] Variables configuradas en el panel (solo los nombres en la evidencia)
- [ ] El log de inicio muestra `entorno: production`
- [ ] `/api/salud` da 200 con la base conectada y el commit correcto
- [ ] Candado HTTPS válido y HTTP redirige a HTTPS
- [ ] Login correcto e inválido
- [ ] CRUD completo y roles (403) probados con cuentas demo
- [ ] Validaciones (400) y registro inexistente (404)
- [ ] Persistencia después de Restart
- [ ] `/.env`, `/server.js` y `/certs/key.pem` dan 404
- [ ] Ningún secreto visible en el front, los logs ni las capturas
- [ ] Vista móvil y navegación por teclado revisadas
- [ ] Respaldo de la base y plan de reversión conocidos
- [ ] La documentación y la URL corresponden a `v8.0.0`
- [ ] Después de la evaluación: rotar `JWT_SECRET` y las claves demo, y borrar los datos de prueba

## 18. Limitaciones y trabajo futuro
| Limitación | Riesgo | Mejora |
|---|---|---|
| **Sin rate limiting** en el login | Fuerza bruta | `express-rate-limit` en `/api/auth` y bloqueo progresivo |
| **Borrado físico** (no hay estado "Cerrado") | Se pierde la evidencia del incidente | Borrado lógico (`cerradoEn` o estado "Cerrado") |
| Sin auditoría de cambios | No se sabe quién cambió qué | Tabla `Historial` (usuario, acción, antes/después, fecha) |
| Token en `sessionStorage`, sin revocación ni refresh | Robo por XSS; logout solo local | Cookie HttpOnly + SameSite, refresh token y lista de revocación |
| La UI no tiene edición completa (PUT) y el botón de estado solo pasa a "Contención en curso" | Para resolver hay que usar la API | Selector de estado y formulario de edición |
| `detalle.html` es estático | No muestra datos reales | Cargar `GET /api/incidentes/:id` |
| Pruebas de integración con base simulada | No detectan fallos de la base real | e2e con MySQL en GitHub Actions |
| CORS en producción incluye orígenes localhost | Superficie mínima innecesaria | Lista solo por variable en producción |
| jQuery por CDN sin SRI | Cadena de suministro | Servirlo localmente o con `integrity` |
| bcrypt con costo 10 | Aceptable hoy | Subir a 12 según el hardware |
| Plan gratuito | Reposo, límites y retención de logs | Plan pagado con alertas |
| Sin MFA ni gestión de usuarios | Cuentas compartidas | Altas y bajas, MFA y política de contraseñas |

Esta es una **solución académica**. Para tratar información institucional se necesitaría además pentest, respaldos probados, acuerdos de servicio, cumplimiento (LOPDP, ISO 27001) y responsables de operación.
