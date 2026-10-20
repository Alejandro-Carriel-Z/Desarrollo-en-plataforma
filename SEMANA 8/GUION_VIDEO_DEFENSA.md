# Guion del video de defensa: máximo 10 minutos

**Versión:** 8.0.0 · **Fecha:** 20/10/2026 · **Duración objetivo:** 9:30, con 30 s de margen.

Estructura que pidió el docente: **funcionalidad (2:30)**, **estructura del código (2:30)** y **seguridad y CRUD a fondo (4:30)**, que es la parte más importante.

## Preparación (antes de grabar)
- Abre `https://<url>/api/salud` y confirma que da 200 y `base: conectada`. Plan B: correr `npm start` en local.
- Abre dos ventanas del navegador: una con sesión de **analista** y otra con sesión de **admin**. Ten la cuenta de supervisor lista.
- En VS Code, deja abiertas estas pestañas en orden: `src/app.js`, `src/security/rol.js`, `src/security/token.js`, `src/security/hash.js`, `src/routes/incidentes.routes.js`, `src/validation/incidentes.js`, `src/models/incidentes.model.js`, `public/js/vista.js`, `src/middleware/logger.js`, `src/middleware/errorHandler.js`, `src/config/env.js`, `.gitignore`.
- Ten una terminal en `SEMANA 8/` con `npm test` listo para ejecutar.
- No muestres `.env`, tokens completos ni los valores de las variables en Railway.

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
| 0:40 | Login como analista | "Entro como analista. Arriba se ve mi nombre y mi rol, y se cargan los incidentes desde MySQL." |
| 1:00 | Formulario con un título de 3 letras | "Si escribo un título demasiado corto, el formulario me avisa; y aunque alguien se salte el navegador, el servidor también lo rechaza." |
| 1:20 | Crear un incidente válido | "Lo registro bien y aparece con el código INC con número, que asigna el servidor." |
| 1:40 | Filtro por severidad | "Puedo filtrar por severidad." |
| 1:55 | Sesión de supervisor → **Cambiar estado** | "Como supervisor solo veo el botón de cambiar estado: el incidente pasa a *Contención en curso*." |
| 2:15 | Sesión de admin → **Eliminar** | "El admin además puede eliminar." |
| 2:30 | Railway → Restart y recargar | "Reinicio el servicio y los datos siguen ahí: la persistencia es real." |

## 2:50–5:20 · 2. Estructura del código
| Min | Mostrar | Decir |
|---|---|---|
| 2:50 | Diagrama mermaid de `DOCUMENTACION_TECNICA.md` | "La arquitectura es cliente, API y base de datos. El navegador habla por HTTPS con el proxy de Railway; este pasa la petición a Express, que usa Prisma para hablar con MySQL." |
| 3:20 | Árbol `public/js` | "En el cliente apliqué MVC: `modelo.js` hace las llamadas a la API y guarda la sesión, `vista.js` pinta el DOM y `controlador.js` maneja los eventos." |
| 3:50 | `server.js` y `src/app.js` | "`server.js` solo arranca: valida el entorno y levanta HTTPS en local o HTTP detrás del proxy. `app.js` arma la cadena de middleware y la separé para poder probarla con supertest." |
| 4:20 | `routes` → `controllers` → `validation` → `models` | "Cada petición pasa por la ruta, que aplica token y rol; luego por el controlador, que maneja HTTP; luego por la validación; y al final por el modelo, que es el único que toca la base." |
| 4:50 | `prisma/schema.prisma` y las migraciones | "Hay dos tablas, Incidente y Usuario, con migraciones versionadas. En producción se aplican con `migrate deploy` al arrancar." |

## 5:20–9:50 · 3. Seguridad (lo más importante)

### 5:20 · Autenticación: contraseñas y JWT (45 s)
**Mostrar:** `hash.js`, `auth.controller.js` y `token.js`.
**Decir:** "Las contraseñas se guardan con **bcrypt, costo 10**, que lleva sal y es lento a propósito; en la base nunca hay texto plano y el login nunca devuelve el hash. Para validar uso `bcrypt.compare`. Si el correo no existe, el usuario está inactivo o la clave es incorrecta, la respuesta es la misma: 401 *credenciales inválidas*, para no dar pistas. Si todo está bien, firmo un **JWT HS256** con el id y el rol, con vencimiento de **2 horas**. El secreto tiene que ser de **64 caracteres hexadecimales**, o sea 256 bits; si no cumple, el servidor ni siquiera arranca."

### 6:05 · Autorización por rol: 401 frente a 403 (60 s)
**Mostrar:** `rol.js`, `incidentes.routes.js` y luego DevTools o curl.
**Decir:** "`exigirToken` revisa la cabecera Bearer: si no viene token, devuelve **401** *token ausente*; si la firma o la fecha fallan, **401** *inválido o vencido*. Además consulta en la base que el usuario siga **activo**, así que desactivar a alguien corta su acceso aunque tenga un token vigente. Después `exigirRol` compara el rol; si no alcanza, devuelve **403** *permiso insuficiente*. En resumen: 401 es *no sé quién eres* y 403 es *sé quién eres, pero no puedes*."

**CRUD por rol (mostrar la tabla):**
| Operación | Ruta | analista | supervisor | admin |
|---|---|:-:|:-:|:-:|
| Listar / filtrar | `GET /api/incidentes` | ✔ | ✔ | ✔ |
| Ver uno | `GET /api/incidentes/:id` | ✔ | ✔ | ✔ |
| Crear | `POST /api/incidentes` | ✔ | 403 | ✔ |
| Cambiar estado | `PATCH /api/incidentes/:id` | 403 | ✔ | ✔ |
| Reemplazar | `PUT /api/incidentes/:id` | 403 | 403 | ✔ |
| Eliminar | `DELETE /api/incidentes/:id` | 403 | 403 | ✔ |

**Demo:** "Como analista mando un DELETE a mano desde la consola y recibo 403. La interfaz oculta el botón, pero la seguridad real está en el servidor. Y sin token recibo 401."

### 7:05 · Validación y allowlist (35 s)
**Mostrar:** `validation/incidentes.js`.
**Decir:** "Cada operación tiene su lista de campos permitidos. En POST solo se aceptan título, descripción, severidad, prioridad, tipo, fecha, correo y reportante; cualquier otro, como `id`, `codigo` o `rol`, da 400, y eso evita la asignación masiva. PATCH solo acepta `estado`. PUT exige los siete campos editables. Las reglas son: título de 5 a 100 caracteres, descripción de 20 a 500, severidad de una lista cerrada, fecha AAAA-MM-DD real y no futura, correo con formato y estado de una lista. El cuerpo tiene que ser un objeto JSON y no puede pasar de 20 kb."

### 7:40 · Inyección SQL, XSS y exposición de archivos (35 s)
**Mostrar:** `incidentes.model.js` y `vista.js`; luego `/.env` en el navegador.
**Decir:** "Contra **inyección SQL**, nunca concateno SQL: Prisma manda consultas parametrizadas, y el único SQL a mano es el `SELECT 1` del health check, sin datos del usuario. Contra **XSS**, la vista crea los elementos y usa `textContent`, nunca `innerHTML` con datos, y además hay CSP. Express solo publica la carpeta `public/`, así que `/.env`, `/certs/key.pem`, `/server.js` y `/package.json` dan 404."

### 8:15 · HTTPS, cabeceras y CORS (30 s)
**Mostrar:** DevTools → Network → cabeceras de respuesta.
**Decir:** "En local uso un certificado **autofirmado** que genera `selfsigned`. En producción el TLS lo termina el proxy de Railway con un certificado válido; la app confía en el proxy y **redirige HTTP a HTTPS con un 301**. Las cabeceras de seguridad son HSTS, CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` contra clickjacking y `Referrer-Policy`, y quité `X-Powered-By`. CORS solo permite los orígenes de la lista, los métodos del CRUD y las cabeceras Content-Type y Authorization."

### 8:45 · Secretos, logs y errores (35 s)
**Mostrar:** `config/env.js`, `.gitignore`, `logger.js` y un log de Railway.
**Decir:** "La configuración sale de variables de entorno: si falta `DATABASE_URL` o `JWT_SECRET`, la app se detiene antes de recibir tráfico (fail-fast). `.env`, los certificados y las llaves están en `.gitignore`; el repositorio solo tiene `.env.example` con marcadores. Los logs son JSON con nivel, ruta, código, duración y un **requestId** que también viaja en la cabecera `X-Request-Id`, así puedo cruzar el error que ve el usuario con el log. No registro cuerpos, y los campos password, token, authorization, secret y cookie salen como `[OCULTO]`. El manejador de errores **nunca devuelve el stack**; en producción un 500 solo dice *error interno* más el requestId."

### 9:20 · Integridad, pruebas y límites (30 s)
**Mostrar:** `crear` en el modelo y luego `npm test` en verde.
**Decir:** "Las pruebas detectaron que con altas simultáneas se repetían los códigos INC. Lo arreglé creando el registro y asignando el código a partir del id **dentro de una transacción**, y el campo `codigo` es único en la base. Hay 53 pruebas: validación, IDs maliciosos como `1e309`, y pruebas HTTP de 401, 403, 400, 404, JSON mal formado, rutas sensibles, cabeceras y logs sin secretos. Limitaciones que reconozco: **no hay límite de intentos de login**, el borrado es **físico** y no lógico, y **no hay auditoría** de quién cambió qué. Son las siguientes mejoras."

## 9:50–10:00 · Cierre
**Decir:** "Eso es SecureGuard: un CRUD persistente con autenticación, roles, validación y HTTPS, desplegado y monitoreado. Gracias."

---

## Anexo: preguntas probables (respuestas cortas)
- **¿Por qué bcrypt y no SHA-256?** SHA es rápido y facilita la fuerza bruta. bcrypt es lento, lleva sal y su costo se puede ajustar.
- **¿Dónde se guarda el token?** En `sessionStorage`, así que se borra al cerrar la pestaña. Es vulnerable si hubiera XSS; lo mitigo con textContent y CSP. La mejora sería una cookie HttpOnly.
- **¿Cómo se invalida un token?** Vence a las 2 h, o se desactiva al usuario (se revisa en cada petición). Cerrar sesión borra el token del navegador, pero no lo revoca en el servidor.
- **¿Qué pasa si cambias `JWT_SECRET`?** Todos los tokens quedan inválidos; sirve para rotar después de la evaluación.
- **¿El borrado deja rastro?** No, es un `DELETE` físico y solo lo hace el admin. La mejora sería un estado *Cerrado* o un `deletedAt`, más una tabla de auditoría.
- **¿Protección contra fuerza bruta?** No hay rate limiting. Agregaría `express-rate-limit` en `/api/auth/login`.
- **¿Por qué 401 y no 404 sin token?** Primero se autentica y después se busca el recurso, así no se filtra si un ID existe.
- **¿Qué cubre el health check?** El proceso y la base (`SELECT 1`). Da 503 si la base cae y Railway lo usa para decidir si la instancia recibe tráfico.
- **¿Por qué las pruebas usan una base simulada?** Para que sean rápidas y repetibles. La integración real se prueba con el smoke test y el reinicio en producción.
- **¿Cómo reviertes un despliegue?** Con Redeploy del despliegue estable en Railway o con `git revert`. Las migraciones son aditivas.
