# Guion del video de defensa: máximo 10 minutos

**Versión:** 8.0.0 (rev. 3: PostgreSQL + Render) · **Fecha:** 20/10/2026 · **Duración objetivo:** 9:30, con 30 s de margen.

Estructura que pidió el docente: **funcionalidad (2:30)**, **estructura del código (2:30)** y **seguridad y CRUD a fondo (4:30)**, que es la parte más importante.

## Preparación (antes de grabar)
- Abre `https://<url>/api/salud` y confirma que da 200 y `base: conectada`. El plan free de Render se duerme, así que ábrela 2 minutos antes. Plan B: `npm start` en local con Postgres en Docker.
- Abre dos ventanas del navegador: una con sesión de **analista** y otra con sesión de **admin**. Ten la cuenta de supervisor lista.
- En VS Code, deja abiertas estas pestañas en orden: `src/app.js`, `src/security/rol.js`, `src/security/token.js`, `src/security/hash.js`, `src/routes/incidentes.routes.js`, `src/validation/incidentes.js`, `src/models/incidentes.model.js`, `public/js/vista.js`, `src/middleware/logger.js`, `src/middleware/errorHandler.js`, `src/config/env.js`, `.gitignore`, `public/js/detalle.js`, `../render.yaml`.
- **Importante:** la demo de 429 bloquea tu IP 15 minutos. Hazla con las sesiones ya abiertas y usa un correo inexistente; no vuelvas a iniciar sesión después.
- Ten una terminal en `SEMANA 8/` con `npm test` listo para ejecutar.
- No muestres `.env`, tokens completos ni los valores de las variables en Render.

## Tabla de tiempos
| Tiempo | Bloque | En pantalla |
|---|---|---|
| 0:00–0:20 | Intro | Portada / URL |
| 0:20–2:50 | **1. Funcionalidad (demo)** | Navegador con la URL pública |
| 2:50–5:20 | **2. Estructura del código** | VS Code, árbol de carpetas y diagrama |
| 5:20–9:50 | **3. Seguridad + CRUD por rol** | VS Code, DevTools y terminal |
| 9:50–10:00 | Cierre | URL y repositorio |

---

## 0:00–0:20 · Intro
**Decir:** "Hola, soy Alejandro Carriel. Les presento SecureGuard, una plataforma para que un equipo SOC registre y dé seguimiento a incidentes de seguridad. Está desplegada en esta URL y el código está en GitHub, en la carpeta Semana 8, versión 8.0.0."

## 0:20–2:50 · 1. Funcionalidad
| Min | Mostrar | Decir |
|---|---|---|
| 0:20 | Login con una clave mala | "Primero pruebo una clave incorrecta: el sistema solo dice *credenciales inválidas* y no revela si el correo existe." |
| 0:40 | Login como analista | "Entro como analista. Arriba se ve mi nombre y mi rol, y se cargan los incidentes desde PostgreSQL." |
| 1:00 | Formulario con un título de 3 letras | "Si escribo un título demasiado corto, el formulario me avisa; y aunque alguien se salte el navegador, el servidor también lo rechaza." |
| 1:20 | Crear un incidente válido | "Lo registro bien y aparece con el código INC con número, que asigna el servidor." |
| 1:40 | Filtro por severidad | "Puedo filtrar por severidad." |
| 1:50 | **Ver detalle** | "El detalle carga los datos reales del incidente, incluida la última modificación." |
| 2:00 | Supervisor → selector de estado → **Aplicar** | "El supervisor elige cualquier estado: Contención en curso o Resuelto." |
| 2:15 | Admin → **Editar** → Guardar, luego **Cerrar** | "El admin edita todo el incidente y puede cerrarlo: queda en gris como *Cerrado*, no se borra." |
| 2:35 | Render → Restart y recargar | "Reinicio el servicio y los datos siguen ahí: la persistencia es real." |

## 2:50–5:20 · 2. Estructura del código
| Min | Mostrar | Decir |
|---|---|---|
| 2:50 | Diagrama mermaid de `DOCUMENTACION_TECNICA.md` | "La arquitectura es cliente, API y base de datos. El navegador habla por HTTPS con el proxy de Render; este pasa la petición a Express, que usa Prisma con el adaptador `pg` para hablar con PostgreSQL." |
| 3:20 | Árbol `public/js` | "En el cliente apliqué MVC: `modelo.js` hace las llamadas a la API y guarda la sesión, `vista.js` pinta el DOM y `controlador.js` maneja los eventos. `detalle.js` carga la ficha." |
| 3:50 | `server.js` y `src/app.js` | "`server.js` solo arranca: valida el entorno y levanta HTTPS en local o HTTP detrás del proxy. `app.js` arma la cadena de middleware y la separé para poder probarla con supertest." |
| 4:20 | `routes` → `controllers` → `validation` → `models` | "Cada petición pasa por la ruta, que aplica token y rol; luego por el controlador, que maneja HTTP; luego por la validación; y al final por el modelo, que es el único que toca la base." |
| 4:50 | `prisma/schema.prisma` y las migraciones | "Hay dos tablas, Incidente y Usuario, con migraciones versionadas. La migración se generó para PostgreSQL y en Render se aplica con `migrate deploy` al arrancar, junto con un seed idempotente." |

## 5:20–9:50 · 3. Seguridad (lo más importante)

### 5:20 · Autenticación: contraseñas, JWT y rate limiting (55 s)
**Mostrar:** `hash.js`, `auth.controller.js`, `token.js` y el bloque `limiteLogin` de `app.js`. Luego, en vivo, 6 logins fallidos.
**Decir:** "Las contraseñas se guardan con **bcrypt, costo 10**, que lleva sal y es lento a propósito; nunca hay texto plano y el login nunca devuelve el hash. Si el correo no existe, el usuario está inactivo o la clave es incorrecta, la respuesta es la misma: 401 *credenciales inválidas*, para no dar pistas. Si todo está bien, firmo un **JWT HS256** con id y rol, que **vence a las 2 horas**. El secreto tiene que tener **64 caracteres hexadecimales**; si no, el servidor no arranca. Contra la fuerza bruta puse **express-rate-limit**: 5 intentos fallidos por IP cada 15 minutos. Al sexto responde **429** con un mensaje JSON y deja un WARN en el log. Los logins correctos no cuentan, y detrás del proxy de Render la IP real sale de `X-Forwarded-For`."

### 6:15 · Autorización por rol: 401 frente a 403 (55 s)
**Mostrar:** `rol.js`, `incidentes.routes.js` y la tabla; luego DevTools.
**Decir:** "`exigirToken` revisa el Bearer: sin token devuelve **401**; si la firma o el vencimiento fallan, también **401**. Además verifica en la base que el usuario siga **activo**, y el rol que usa es el de la base, no el del token. Después `exigirRol` compara: si el rol no alcanza, devuelve **403**. 401 es *no sé quién eres*; 403 es *sé quién eres, pero no puedes*."

| Operación | Ruta | analista | supervisor | admin |
|---|---|:-:|:-:|:-:|
| Listar / filtrar | `GET /api/incidentes` | ✔ | ✔ | ✔ |
| Ver detalle | `GET /api/incidentes/:id` | ✔ | ✔ | ✔ |
| Crear | `POST /api/incidentes` | ✔ | 403 | ✔ |
| Cambiar estado | `PATCH /api/incidentes/:id` | 403 | ✔ | ✔ |
| Editar completo | `PUT /api/incidentes/:id` | 403 | 403 | ✔ |
| Cerrar (borrado lógico) | `DELETE /api/incidentes/:id` | 403 | 403 | ✔ |

**Demo:** "Como analista mando un DELETE a mano desde la consola y recibo 403. La interfaz oculta los botones, pero la seguridad real está en el servidor."

### 7:10 · Validación y allowlist (30 s)
**Mostrar:** `validation/incidentes.js`.
**Decir:** "Cada método tiene su lista de campos permitidos; cualquier otro campo, como `id`, `codigo` o `rol`, da 400, y así evito la asignación masiva. PATCH solo acepta `estado` y no permite `Cerrado`. PUT exige los siete campos. Las reglas son: título de 5 a 100 caracteres, descripción de 20 a 500, severidad y estado de listas cerradas, fecha real y no futura, y el cuerpo no puede pasar de 20 kb."

### 7:40 · Inyección SQL, XSS y archivos expuestos (30 s)
**Mostrar:** el modelo, `vista.js`, `detalle.js` y `/.env` en el navegador.
**Decir:** "Uso PostgreSQL con Prisma y el adaptador `pg`: las consultas son **parametrizadas** y nunca concateno SQL. Contra XSS, la lista y también la ficha de detalle se pintan con `textContent`, no con `innerHTML`, y además hay CSP. Express solo publica `public/`, así que `/.env`, `/certs/key.pem` y `/server.js` dan 404."

### 8:10 · HTTPS, cabeceras y CORS (30 s)
**Mostrar:** DevTools → cabeceras de respuesta.
**Decir:** "En local uso un certificado autofirmado. En Render el TLS lo termina el proxy, la app confía en él y **redirige HTTP a HTTPS con un 301**. Envío HSTS, CSP, nosniff, `X-Frame-Options: DENY` y `Referrer-Policy`, y quité `X-Powered-By`. En producción CORS **solo** acepta los orígenes de `CORS_ORIGINS`; localhost queda fuera."

### 8:40 · Secretos, logs y errores (30 s)
**Mostrar:** `config/env.js`, `.gitignore`, `render.yaml` (`sync: false`) y Logs de Render.
**Decir:** "Si falta `DATABASE_URL` o `JWT_SECRET`, la app no arranca. Los secretos no están en el repositorio: en `render.yaml` van con `sync: false` y se escriben en el panel. Los logs son JSON con nivel, ruta, código, duración y **requestId**; ocultan password, token y authorization. El manejador de errores nunca devuelve el stack."

### 9:10 · Integridad: borrado lógico, auditoría, concurrencia y pruebas (40 s)
**Mostrar:** `eliminar` y `crear` del modelo, el detalle con *Última modificación* y `npm test`.
**Decir:** "Eliminar **no borra**: es un **borrado lógico** que pasa el incidente a *Cerrado*, así no se pierde evidencia; repetirlo da 409. Cada alta, cambio y cierre guarda **quién** lo hizo (`actualizadoPor`) y **cuándo** (`updatedAt`), y se ve en el detalle. Para evitar códigos repetidos, el INC se asigna dentro de una **transacción** con `codigo` único; lo probé con dos altas simultáneas en Postgres. Son **64 pruebas** en verde, incluidas las de 429, borrado lógico y PUT. Limitaciones que reconozco: la auditoría guarda solo el último cambio, no un historial, y el token vive en `sessionStorage`."

## 9:50–10:00 · Cierre
**Decir:** "Eso es SecureGuard: un CRUD persistente con autenticación, roles, validación y HTTPS, desplegado y monitoreado. Gracias."

---

## Anexo: preguntas probables (respuestas cortas)
- **¿Por qué bcrypt y no SHA-256?** SHA es rápido y facilita la fuerza bruta. bcrypt es lento, lleva sal y su costo se puede ajustar.
- **¿Dónde se guarda el token?** En `sessionStorage`, así que se borra al cerrar la pestaña. Es vulnerable si hubiera XSS; lo mitigo con textContent y CSP. La mejora sería una cookie HttpOnly.
- **¿Cómo se invalida un token?** Vence a las 2 h, o se desactiva al usuario (se revisa en cada petición). Cerrar sesión borra el token del navegador, pero no lo revoca en el servidor.
- **¿Qué pasa si cambias `JWT_SECRET`?** Todos los tokens quedan inválidos; sirve para rotar después de la evaluación.
- **¿El borrado deja rastro?** Sí. Es lógico: pasa a *Cerrado* con `actualizadoPor` y `updatedAt`. Solo el admin puede hacerlo, y el admin puede reabrir con PUT.
- **¿Protección contra fuerza bruta?** express-rate-limit: 5 fallos por IP cada 15 minutos y luego 429. Limitación: es en memoria y por IP; la mejora sería un store en Redis y un límite por cuenta.
- **¿Por qué 401 y no 404 sin token?** Primero se autentica y después se busca el recurso, así no se filtra si un ID existe.
- **¿Qué cubre el health check?** El proceso y la base (`SELECT 1`). Da 503 si la base cae y Render lo usa para decidir si la instancia recibe tráfico.
- **¿Por qué PostgreSQL y Render?** Render tiene Postgres administrado gratis en el mismo Blueprint, HTTPS automático y health checks. Ojo: la base free expira a los 30 días.
- **¿Por qué las pruebas usan una base simulada?** Para que sean rápidas y repetibles. La integración real se prueba con el smoke test y el reinicio en producción.
- **¿Cómo reviertes un despliegue?** Con Rollback en Render (en free, a los dos despliegues anteriores) o con `git revert` + push. Respaldo con `pg_dump`. Las migraciones son aditivas.
