# Guion del video de defensa (máximo 20 minutos; objetivo: 17–18)

**Antes de grabar:** abre la URL pública y verifica `/api/salud` (200, base conectada). Ten a mano las tres cuentas demo, VS Code en `SEMANA 8/`, el panel de Railway (logs y variables con los valores **ocultos**) y una terminal. Ten también un **plan B**: si la URL falla, `docker compose up` local o `npm start`, y explica el diagnóstico sin ocultarlo (16.4). Graba con OBS o con la grabación de Teams, con tu cámara visible en una esquina.

| Tiempo | Sección (punto del PDF) | Qué mostrar | Qué decir (resumen) |
|---|---|---|---|
| 0:00–1:00 | Presentación | Portada | Nombre, materia, proyecto y versión 8.0.0 con su commit |
| 1:00–2:30 | Problema y usuario (16.1) | Diapositivas 2–3 | El problema del SOC, los tres roles y qué resuelve la plataforma |
| 2:30–5:00 | Arquitectura (16.1, 16.4) | Diagrama y carpetas en VS Code | Cliente → proxy TLS → Express → middleware → controlador → validación → modelo → Prisma → MySQL. Por qué MVC: separa responsabilidades y facilita probar |
| 5:00–10:00 | Demostración del flujo (16.1, 16.2) | URL en vivo | 1) Login inválido: *Credenciales inválidas*. 2) Login como analista. 3) Crear un incidente; probar antes un dato inválido (400). 4) Consultar el detalle. 5) Como analista intentar eliminar: 403 (la API rechaza aunque se envíe a mano; muéstralo en DevTools o con curl sin token: 401). 6) Supervisor cambia el estado. 7) Admin elimina. 8) **Restart** del servicio en Railway y recargar: los datos persisten |
| 10:00–12:30 | Seguridad (16.2, 16.4) | `rol.js`, `token.js`, `hash.js`, `validation/`, cabeceras en DevTools | bcrypt, JWT con vencimiento, rol en el servidor, allowlist, CSP y HSTS, `/.env` da 404, variables en el panel (solo los nombres) |
| 12:30–14:30 | Pruebas (16.2) | `npm run verificar` y `npm run smoke` con BASE_URL | Unitarias, integración HTTP y smoke en producción: qué cubre cada una y el resultado |
| 14:30–16:00 | Despliegue y monitoreo (15, 16.3) | Railway: Deploy Logs, `/api/salud`, un log con requestId | Variables por entorno, migraciones automáticas, health check, logs con nivel y sin secretos, reversión |
| 16:00–17:00 | Documentación (16.3) | README, DOCUMENTACION_TECNICA, MANUAL_USUARIO | Cómo instalar, configurar, probar y usar, con fecha y versión |
| 17:00–18:30 | Limitaciones, retroalimentación y lecciones (16.5) | Diapositivas 9–10 | Limitaciones honestas con su mejora, la retroalimentación recibida y qué cambiaste, y tres lecciones concretas |
| 18:30–19:00 | Cierre | URL y repositorio | Versión etiquetada `v8.0.0`; las credenciales demo se rotan después de la evaluación |

## Preguntas probables y respuestas

**Arquitectura**
- *¿Por qué Express + Prisma + MySQL?* Express es ligero y bien conocido; Prisma da tipos, migraciones versionadas y consultas parametrizadas que evitan la inyección SQL; MySQL es relacional y sirve para entidades con reglas y unicidad, como el código del incidente.
- *¿Dónde está el MVC?* En el cliente: `modelo.js` (API y sesión), `vista.js` (DOM) y `controlador.js` (eventos). En el servidor: rutas y controladores, validación y modelo Prisma.
- *¿Por qué separaste `app.js` de `server.js`?* Así puedo probar la app con supertest sin abrir puertos, y el arranque (HTTPS o HTTP, apagado ordenado) queda aislado.
- *¿Cómo escalaría?* La API no guarda estado (JWT), así que se pueden agregar réplicas detrás del proxy. El cuello de botella sería la base: índices, pool de conexiones y réplicas de lectura.

**Seguridad**
- *¿Cómo guardas las contraseñas?* Con un hash bcrypt con sal; nunca en texto plano y nunca se devuelve el hash.
- *¿Qué pasa si alguien manda un DELETE a mano siendo analista?* `exigirRol` en el servidor devuelve 403. La interfaz solo oculta botones; la seguridad está en la API.
- *¿Y si roban un token?* Sirve como máximo 2 horas y deja de servir si el usuario se desactiva. Mejora: cookie HttpOnly, refresh token y revocación.
- *¿HTTPS en producción?* El proxy de Railway termina TLS con un certificado válido. La app confía en `X-Forwarded-Proto`, redirige HTTP a HTTPS y envía HSTS. En local uso un certificado autofirmado.
- *¿Dónde están los secretos?* En `.env` local, que está ignorado por Git, y en el panel de Railway. El repositorio solo tiene `.env.example` con marcadores. Al arrancar, la app valida las variables y se detiene si falta una.
- *¿XSS o inyección?* Uso `textContent` en lugar de `innerHTML`, CSP, allowlist de campos y consultas parametrizadas de Prisma.
- *¿Qué no registran los logs?* Cuerpos, contraseñas, tokens ni el encabezado Authorization; esos campos se reemplazan por `[OCULTO]`.

**Pruebas**
- *¿Qué cubren las pruebas?* Validación (límites, tipos y campos prohibidos), modelo (IDs raros, códigos únicos en transacción) e integración HTTP (200, 201, 400, 401, 403, 404 y 503, rutas sensibles y cabeceras).
- *¿Por qué con base simulada?* Para que sean rápidas y repetibles sin MySQL. La persistencia real la verifico con el smoke test y el reinicio en producción. Mejora: e2e con MySQL en CI.
- *¿Alguna prueba evitó un error?* Sí: la de creación transaccional detectó que se podían repetir códigos `INC-###`, y la del ID decimal evitó un error 500.

**Despliegue y limitaciones**
- *¿Por qué Railway?* Tiene MySQL administrado en el mismo proyecto, despliega desde GitHub con Docker, da HTTPS automático y health checks.
- *¿Cómo reviertes un despliegue fallido?* Con Redeploy del último despliegue estable o `git revert`. Las migraciones son aditivas y respaldo antes con mysqldump.
- *¿Qué le falta para producción real?* Rate limiting, MFA, auditoría, respaldos automáticos probados, monitoreo con alertas, pentest y cumplimiento de la LOPDP.
- *¿Qué pasa si el health check da 200 pero el login falla?* Por eso la salud consulta la base y además corro el smoke test y el recorrido manual (punto 15.5).
