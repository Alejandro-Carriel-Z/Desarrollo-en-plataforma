# SecureGuard — guía técnica, manual de uso y defensa

**Proyecto:** plataforma académica de registro y seguimiento de incidentes  
**Curso:** Desarrollo de plataformas  
**Versión revisada:** rama `main`, HEAD `93ebdd2` en el momento de inspección  
**Fecha:** 19 de octubre de 2026  
**Estado de esta entrega:** documentación y pruebas locales preparadas; despliegue público, URL final y etiqueta de versión pendientes.

> Esta guía describe el código que está en el proyecto, no una arquitectura idealizada. Distingue las funciones implementadas de las partes que aún faltan para considerar SecureGuard un servicio real. Las credenciales y las direcciones locales nunca deben confundirse con una URL o una cuenta de producción.

## 1. Resumen del problema y solución

SecureGuard es una aplicación web académica para registrar incidentes de seguridad, consultar el listado, filtrar por severidad y hacer seguimiento del estado. Una persona inicia sesión y recibe un JWT; el servidor comprueba el token y el rol antes de ejecutar operaciones que modifican datos. Los incidentes y usuarios se almacenan en MySQL/MariaDB mediante Prisma.

La aplicación se divide en una interfaz web estática, una API Express, reglas de negocio y persistencia. La validación corre en el servidor, aunque el formulario también informa errores comunes antes del envío. El servidor local usa HTTPS con un certificado autofirmado generado para `localhost`.

## 2. Arquitectura y flujo de una operación

El diagrama completo y la tabla de relaciones también están en [architecture-diagram.md](.github/modernize/assessment/engines/facts/architecture-diagram.md).

1. El navegador descarga los archivos estáticos desde el servidor Express por HTTPS.
2. `public/js/controlador.js` recoge una acción del usuario y llama al modelo del navegador.
3. `public/js/modelo.js` envía un `fetch` a la API. En las operaciones protegidas adjunta el JWT guardado en `sessionStorage`.
4. El middleware global registra el método, la ruta, el estado HTTP y la duración. El middleware de autenticación verifica firma y vencimiento del JWT y vuelve a consultar que el usuario siga activo.
5. La ruta comprueba el rol requerido y llama al controlador HTTP.
6. El controlador valida el cuerpo para altas y cambios. El modelo de negocio accede a Prisma.
7. Prisma usa `@prisma/adapter-mariadb` para conectar con MySQL/MariaDB. La respuesta JSON vuelve a la interfaz y la vista la construye con nodos DOM y `textContent`.

El cliente de base de datos no está disponible en esta inspección local. Las pruebas unitarias con dependencias simuladas y las evidencias HTTP conservadas no sustituyen una nueva prueba completa de las rutas conectadas a una base activa.

## 3. Estructura: qué contiene cada carpeta

| Carpeta | Propósito | ¿Forma parte del despliegue/entrega? |
|---|---|---|
| `public/` | HTML, CSS y JavaScript que recibe el navegador. Es la única raíz publicada por Express. | Sí |
| `public/css/` | Estilos, diseño adaptable, tarjetas y estados de severidad. | Sí |
| `public/js/` | Modelo de llamadas API, controlador de eventos y funciones de renderizado. | Sí |
| `src/controllers/` | Traduce solicitudes/respuestas HTTP y coordina validación y modelo. | Sí |
| `src/lib/` | Construcción de la instancia Prisma con configuración del entorno. | Sí |
| `src/middleware/` | Registro de solicitudes, respuesta 404 y traducción de errores. | Sí |
| `src/models/` | Operaciones de lectura/escritura de incidentes y adaptación del formato. | Sí |
| `src/routes/` | Mapa de URL/método a controladores y reglas de roles. | Sí |
| `src/security/` | Hash de contraseñas, firma/verificación JWT y permisos. | Sí |
| `src/validation/` | Reglas de negocio y validación de entradas de incidentes. | Sí |
| `prisma/` | Esquema de datos y migraciones SQL versionadas. | Sí |
| `tests/` | Pruebas Jest de reglas de validación y comportamiento del modelo. | Sí |
| `scripts/` | Herramienta reproducible de medición del cuerpo HTTP y latencia. | Sí |
| `evidencias/` | Capturas, resultados de regresión y muestras de rendimiento. | Sí, después de revisar que no haya datos sensibles |
| `data/` | Archivo JSON local legado/demo. No se encontró referencia desde el código ejecutable actual. | No se incluye en el ZIP final |
| `certs/` | Llave privada y certificado HTTPS generados para desarrollo local. | No; generar/gestionar por entorno |
| `node_modules/` | Dependencias instaladas por npm; se reconstruyen desde los manifiestos. | No |
| `.venv/`, `.agents/`, `.claude/`, `.windsurf/` | Entornos y archivos auxiliares de herramientas. | No |
| `.github/modernize/assessment/engines/facts/` | Diagrama arquitectónico de esta guía. | Sí, como documentación |

### Archivos principales de la raíz

| Archivo | Función |
|---|---|
| `server.js` | Carga configuración, valida secretos, configura Express/CORS/middleware/rutas y abre el listener HTTPS. |
| `crear-cert.js` | Genera el certificado autofirmado y la llave local en `certs/`. |
| `package.json` | Manifiesto, scripts npm y dependencias directas. |
| `package-lock.json` | Versiones resueltas para instalaciones reproducibles con npm. No se edita a mano. |
| `prisma7.config.ts` | Indica al CLI de Prisma dónde está el esquema, las migraciones y la URL de conexión. |
| `jest.config.js` | Selecciona entorno Node y archivos Jest dentro de `tests/`. |
| `eslint.config.mjs` | Reglas recomendadas y globals para Node, navegador y Jest. |
| `.env.example` | Plantilla pública con marcadores. Copiar a `.env` y completar de forma privada. |
| `.gitignore` | Excluye dependencias, llaves, `.env` y directorios locales. No protege por sí solo los ZIP manuales. |
| `README.md` | Instalación, operación local, resultados y advertencias de la entrega de Semana 7. |
| `INFORME_T1S7_Carriel.md/.html/.pdf` | Se referenciaban en notas anteriores, pero no están en la carpeta examinada. Recuperar o regenerar antes de declarar entregado el PDF de evidencias. |
| `ENTREGA_SEMANA7_CORREGIDA.zip` | Paquete académico de Semana 7. No sustituye un paquete final hasta revalidarlo con la versión definitiva. |
| `GUIA_FINAL_SECUREGUARD.md` | Este recorrido técnico, manual de usuario y plan de defensa. |
| `skills-lock.json` | Metadatos de herramientas/agentes; se excluye del paquete para evaluación. |

## 4. Recorrido archivo por archivo y función por función

### 4.1 Servidor y configuración

#### `server.js`

- `require("dotenv").config()` carga variables desde `.env` para desarrollo local.
- `express()` crea la aplicación HTTP que se pasa al servidor HTTPS.
- El bloque inicial exige `DATABASE_URL` y `JWT_SECRET`; detiene el proceso si faltan o si el secreto no contiene 64 caracteres hexadecimales.
- Localiza `certs/key.pem` y `certs/cert.pem`; si no existen, muestra el comando `npm run cert` y sale.
- El middleware CORS permite orígenes y métodos explícitos de localhost. No está preparado aún para el dominio de producción.
- `logger` se registra para escribir el resultado de cada respuesta al terminar.
- `express.json()` analiza cuerpos JSON.
- `compression({ threshold: 1024 })` comprime respuestas mayores de 1 KiB cuando el cliente acepta la compresión.
- `express.static(.../public)` publica únicamente HTML/CSS/JS e imágenes del cliente. No expone la raíz, el `.env`, las llaves ni el código de servidor.
- `GET /api/salud` responde `200` con datos de servicio. Comprueba que el proceso responde, pero no verifica que MySQL acepte conexiones.
- Monta rutas de login bajo `/api/auth` y rutas de incidentes bajo `/api/incidentes`. La autenticación global se aplica a las rutas de incidentes.
- `noEncontrado` y `errorHandler` deben quedar al final para manejar rutas y excepciones no resueltas.
- `https.createServer(...).listen(...)` crea el servidor TLS con el certificado configurado y escucha en `PORT` o 3000.

#### `crear-cert.js`

- `main()` pide a `selfsigned` un certificado de 365 días para `localhost`, crea `certs/` si falta y escribe `key.pem` y `cert.pem`.
- Es solamente para desarrollo: un certificado autofirmado no establece una identidad pública confiable y no es la gestión TLS recomendada para producción.

#### `prisma7.config.ts`

Define el schema en `prisma/schema.prisma`, el directorio `prisma/migrations` y la URL de datasource desde `DATABASE_URL`. Carga `dotenv/config` para que el CLI local encuentre las variables. No contiene credenciales.

#### `.env.example` y variables

Variables usadas:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Usuario, contraseña, host, puerto y nombre de la base MySQL/MariaDB. |
| `JWT_SECRET` | Clave aleatoria de 64 dígitos hexadecimales para firmar y verificar JWT. |
| `PORT` | Puerto HTTPS del servidor. Por defecto, 3000. |
| `BASE_URL` | URL opcional que acepta `scripts/medir-red.js`; por defecto `https://localhost:3000`. |

El navegador tiene actualmente la URL API fija en `https://localhost:3000/api`. Por tanto, cambiar `PORT` no cambia automáticamente el URL del frontend; esto debe configurarse antes de desplegarlo en otro dominio/puerto.

### 4.2 API, rutas y permisos

#### `src/routes/auth.routes.js`

Registra `POST /api/auth/login` y delega en `login`.

#### `src/controllers/auth.controller.js`

- `login(req, res, next)`: normaliza el correo, consulta el usuario por correo, rechaza usuario ausente/inactivo o contraseña incorrecta con `401`, compara la contraseña mediante bcrypt y, si valida, responde con JWT de dos horas y perfil básico. Pasa errores inesperados a `next`.

#### `src/routes/incidentes.routes.js`

Registra las operaciones protegidas:

| Método y ruta | Operación | Rol requerido |
|---|---|---|
| `GET /api/incidentes` | Leer listado; admite filtros `severidad`, `prioridad`, `estado`. | Cualquier usuario autenticado |
| `GET /api/incidentes/:id` | Leer por código o ID. | Cualquier usuario autenticado |
| `POST /api/incidentes` | Crear. | `analista` o `admin` |
| `PATCH /api/incidentes/:id` | Cambiar solamente `estado`. | `supervisor` o `admin` |
| `PUT /api/incidentes/:id` | Reemplazar campos editables requeridos. | `admin` |
| `DELETE /api/incidentes/:id` | Eliminar. | `admin` |

La interfaz no expone actualmente todas las operaciones que ofrece la API: el formulario crea, la tarjeta permite cambiar el estado o eliminar según rol, pero no existe un formulario de edición PUT ni una pantalla de detalle dinámica.

#### `src/security/rol.js`

- `exigirToken(req, res, next)`: extrae `Bearer` del encabezado; responde 401 si falta; verifica JWT; recarga el usuario y comprueba que siga activo; adjunta una copia acotada del usuario a `req.usuario`; continúa con `next()`.
- `exigirRol(...roles)`: devuelve middleware que compara el rol de `req.usuario` con la lista permitida; responde 403 cuando no coincide.

La interfaz oculta botones según el rol por comodidad; la seguridad real está en el middleware del servidor. Un cliente puede modificar su HTML, pero no debe poder evitar la autorización de API.

#### `src/security/token.js`

- `firmar(usuario)`: firma los campos `id` y `rol` con `JWT_SECRET` y fija caducidad de dos horas.
- `verificar(token)`: delega a `jsonwebtoken.verify`; valida firma y expiración y entrega el payload.

#### `src/security/hash.js`

- `crearHash(clave)`: crea un hash bcrypt con factor de trabajo 10 para persistir contraseñas, nunca la clave en texto claro.
- `coincide(clave, hash)`: compara una clave ingresada con el hash almacenado.

### 4.3 Incidentes: controlador, validación y modelo

#### `src/controllers/incidentes.controller.js`

- `listar(req, res, next)`: toma filtros de query string, solicita los registros al modelo y responde con `200`, `total` y `datos`.
- `obtener(req, res, next)`: busca por identificador/código; responde 404 si no existe o 200 con el incidente.
- `crear(req, res, next)`: aplica `validarCreacion`; almacena el resultado del modelo y responde 201.
- `actualizar(req, res, next)`: en PATCH valida un cambio parcial de estado; en PUT valida el contrato de reemplazo. Devuelve 404 si falta el registro y 200 si se actualiza.
- `eliminar(req, res, next)`: borra el registro o devuelve 404 si no existe; el éxito responde 200.
- En las cinco funciones, `catch` remite errores al manejador global con `next(error)`.

#### `src/validation/incidentes.js`

Constantes de contrato:

- `CAMPOS_CREACION`: campos que acepta un alta; rechaza propiedades ajenas, incluidos campos internos.
- `CAMPOS_REEMPLAZO`: campos que exige PUT.
- `SEVERIDADES`: `critica`, `alta`, `media`, `baja`; se reutiliza para prioridad.
- `ESTADOS`: `En investigación`, `Contención en curso`, `Resuelto`.

Funciones:

- `errorValidacion(detalles)`: crea un error con `status = 400` y detalles por campo.
- `objetoValido(datos)`: exige un cuerpo JSON de tipo objeto, no `null`, arreglo ni primitivo.
- `validarCampos(datos, permitidos)`: rechaza nombres no incluidos en la allowlist.
- `validarTexto(datos, campo, opciones)`: verifica el tipo string, límites, campos obligatorios y espacios; normaliza con `trim()`.
- `validarFecha(datos)`: exige fecha ISO `AAAA-MM-DD`, comprueba que exista calendario real y rechaza fecha futura.
- `validarSeveridad(datos, campo)`: comprueba severidad/prioridad contra los valores permitidos.
- `validarTipo(datos)`: valida longitud del tipo de incidente.
- `validarContenido(datos, opciones)`: reúne reglas comunes; valida título (5–100), descripción (20–500), severidad, tipo, fecha, prioridad, estado, correo y reportante. Para creación asigna prioridad igual a severidad si no se especifica.
- `validarCreacion(entrada)`: verifica cuerpo y allowlist, trabaja sobre una copia y ejecuta las reglas comunes.
- `validarParche(entrada)`: acepta exclusivamente `estado`, exige valor conocido y devuelve solo ese campo.
- `validarReemplazo(entrada)`: comprueba allowlist, exige todos los campos de PUT y aplica validación completa.

#### `src/models/incidentes.model.js`

- `aCliente(row)`: convierte una fila Prisma al contrato entregado a la interfaz; usa el código como `id`, mantiene los campos de presentación y omite datos internos de base.
- `donde(id)`: genera búsqueda por código y añade búsqueda por entero únicamente si el texto es un entero positivo seguro. Evita enviar `Infinity`, decimales, cero o negativos a una columna `Int`.
- `listar(filtro)`: compone un filtro opcional por severidad, prioridad y estado; ordena IDs descendentes; selecciona las columnas usadas por el cliente y transforma las filas con `aCliente`.
- `obtener(id)`: busca el primer registro usando `donde` y lo adapta a la interfaz.
- `crear(datos)`: abre `$transaction`; inserta provisionalmente un código aleatorio `PEND-...`, usa el ID autoincremental para crear el código `INC-nnn`, actualiza el registro en la misma transacción y lo devuelve normalizado. La transacción evita colisiones por la antigua estrategia de “leer último código y sumar uno”.
- `actualizar(id, cambios)`: obtiene registro existente, limita el `data` a los campos editables, ajusta prioridad a severidad si esta cambió sin prioridad explícita, persiste y normaliza la respuesta.
- `eliminar(id)`: busca por código/ID, devuelve `null` si no existe; si existe, elimina y devuelve una copia adaptada.

#### `src/lib/prisma.js`

Carga dotenv y crea el adaptador `PrismaMariaDb` con host, puerto, usuario, contraseña y base extraídos de `DATABASE_URL`. Configura límite de conexiones y timeout, crea `PrismaClient` y exporta una instancia compartida. La URL se decodifica para credenciales que contengan caracteres codificados.

### 4.4 Middleware y observabilidad

#### `src/middleware/logger.js`

- `logger(req, res, next)`: registra `Date.now()` al entrar, escucha el evento `finish` de la respuesta y escribe método, URL, estado HTTP y duración en milisegundos a stdout; luego pasa el control.

Es un log de consola simple, no un sistema de observabilidad: no hay JSON estructurado, persistencia/retención, redacción configurable, correlación, alerta ni integración con plataforma de logs.

#### `src/middleware/errorHandler.js`

- `noEncontrado(req, res)`: contesta 404 JSON coherente para rutas que no existen.
- `errorHandler(error, req, res, next)`: selecciona `error.status` o 500 y devuelve JSON `ok:false`, mensaje y posibles detalles.

Antes de producción se debe evitar devolver mensajes internos de errores inesperados 500 al cliente y registrar el detalle con un identificador de correlación sin filtrar secretos o información personal.

### 4.5 Datos y migraciones

#### `prisma/schema.prisma`

Declara dos modelos:

- `Incidente`: `id` autoincremental; `codigo` único; título y descripción; severidad, prioridad, estado, tipo, fecha, reportante y fecha de creación. En el estado actual varios valores categóricos/fecha son `String`; una versión real debería normalizar enums y tipo de fecha si corresponde.
- `Usuario`: `id`, nombre, correo único, hash `password`, rol, bandera `activo` y fecha de creación.

#### `prisma/migrations/`

- `20261007040417_init/migration.sql`: crea la tabla de incidentes, índice único de código y clave primaria.
- `20261007044322_usuarios/migration.sql`: crea tabla de usuarios, índice único de correo y clave primaria.
- `migration_lock.toml`: identifica MySQL como provider del historial de migraciones.

`npm run migrate` aplica las migraciones usando configuración y `DATABASE_URL`. Una migración nueva debe generarse y revisarse; no se editan migraciones ya aplicadas sin una estrategia formal.

#### `src/seed.js`

- `main()`: itera tres cuentas demo de analista, supervisor y administrador; calcula bcrypt hash y realiza `upsert` de cada correo para crear o actualizar nombre, contraseña, rol y estado activo.
- Al terminar, desconecta Prisma con `$disconnect()`.

Las contraseñas en el seed son públicas, previsibles y de demostración. Ejecutar `npm run seed` en un entorno real volvería a establecer esas contraseñas; no se debe ejecutar allí ni dejar las cuentas expuestas.

#### `data/incidentes.json`

Archivo legado/demo identificado en el directorio local; el código que se ejecuta actualmente usa Prisma. No es la fuente de datos del CRUD actual y se excluyó del paquete revisado para evitar confusión con persistencia MySQL.

### 4.6 Interfaz web y sus funciones

#### `public/index.html`

Página principal. Define navegación, acceso, métricas, filtros, contenedor del listado y formulario de creación. El formulario captura título, descripción, severidad, tipo, fecha y correo; incluye confirmación requerida que el controlador elimina antes de enviar. Los valores “12 resueltos”, “+18 %” y “18m” son texto estático, no métricas derivadas de MySQL; no presentarlos como datos operativos reales. Importa módulos JavaScript al final del documento.

#### `public/detalle.html`

Ficha de un caso de demostración con contenido escrito en HTML. No consulta dinámicamente un incidente de la API, ni está enlazada por un parámetro de identificador. Antes de usarla como ficha funcional hay que conectarla a `GET /api/incidentes/:id`.

#### `public/js/modelo.js`

La constante `API` fija el endpoint en `https://localhost:3000/api`.

- `token()`: obtiene JWT desde `sessionStorage`.
- `pedir(ruta, opciones)`: realiza `fetch`, agrega JSON y autorización cuando hay token, analiza respuesta JSON, cierra sesión ante 401 de incidentes, muestra errores amigables para 403 y propaga mensaje de otros errores.
- `guardarSesion(datos)`: guarda token, rol y nombre en `sessionStorage`.
- `cerrarSesion()`: limpia `sessionStorage`.
- `sesion()`: devuelve token, rol y nombre guardados o valores vacíos.
- `entrar(correo, password)`: envía credenciales a login.
- `obtenerIncidentes()`: pide el listado y extrae `datos`.
- `filtrarPorSeveridad(incidentes, severidad)`: filtra en memoria; si no hay filtro, devuelve el listado.
- `crearIncidente(datos)`: envía POST.
- `cambiarEstado(id, estado)`: envía PATCH con estado.
- `eliminarIncidente(id)`: envía DELETE.

#### `public/js/vista.js`

- `pintarIncidentes(incidentes, contenedor, rol)`: construye tarjetas DOM. Usa `textContent` para los campos textuales en vez de interpolar datos como HTML; agrega botones según rol y reemplaza el contenido del contenedor.
- `pintarResumen(incidentes)`: actualiza total y conteo abierto (todo lo que no esté en estado Resuelto).
- `pintarEstado(texto)`: actualiza el elemento de estado de carga si existe.

#### `public/js/controlador.js`

- `anunciar(texto)`: actualiza mensaje de estado de la página por medio de la vista.
- `mostrar(datos)`: renderiza tarjetas usando el rol de sesión y recalcula resumen a partir de la variable local `incidentes`.
- `iniciar()`: muestra identidad/rol, pide incidentes si hay token y representa errores de carga.
- `marcarError(id, mensaje)`: crea o reutiliza mensaje accesible bajo el campo y fija la validez personalizada del input.
- Listener del formulario de login: convierte `FormData` en objeto, llama login, guarda sesión, limpia campos y recarga listado.
- Listener de cerrar sesión: limpia almacenamiento, lista local y reinicializa.
- Listener `sesion-expirada`: borra tarjetas, actualiza identidad y navega a la sección de login.
- Listener del filtro: filtra en memoria y vuelve a renderizar.
- Listener de alta: verifica título, descripción y fecha en navegador; llama `reportValidity`; elimina campo visual `confirmacion`; envía POST; vuelve a solicitar la lista y anuncia éxito o error.
- Listener delegado de la lista: detecta botones de eliminar o estado, realiza operación permitida en el servidor, recarga y renderiza.
- Llama `iniciar()` al cargar el módulo.

No existe actualmente un evento de edición completa PUT en la interfaz. Tampoco existe paginación o carga parcial; el listado se descarga completo.

#### `public/css/estilos.css`

Define variables de color, tipografía, tarjetas, clases de severidad, formularios, navegación, métricas y una media query para anchos menores. El héroe obtiene su fondo de Unsplash; las fuentes vienen de Google Fonts. Eso implica dependencias de red de terceros y afecta privacidad/disponibilidad; para operación institucional conviene alojar activos aprobados localmente.

La página principal incluye además un script CDN de jQuery 3.7.1, pero los módulos funcionales usan JavaScript nativo y no se identificó un uso de jQuery; debe quitarse o justificarse antes de cerrar dependencias.

### 4.7 Pruebas y herramientas de calidad

#### `tests/incidentes-validation.test.js`

Pruebas Jest para normalización y prioridad por defecto, rechazo de propiedades no permitidas, severidades/fechas inválidas, mínimos y máximos, campos ausentes, fecha futura, correo y prioridad, tipos de cuerpo no válidos, valores frontera permitidos, reglas PATCH y exigencias de PUT. Contribuye a demostrar reglas de negocio a nivel unitario.

#### `tests/incidentes-model.test.js`

Simula el módulo Prisma. Verifica que `1.5`, `1e309`, `0` y `-1` no lleguen como ID numérico, que un entero positivo sí se busque por código e ID y que dos altas concurrentes reciban códigos distintos dentro de transacciones.

#### `scripts/medir-red.js`

- `solicitar()`: hace una solicitud HTTPS al CSS con codificación elegida; recopila bytes, tiempo, código, contenido y SHA-256; descomprime gzip si aplica y rechaza respuestas cuyo contenido no coincida con el archivo local.
- `main()`: descarta dos calentamientos, hace diez solicitudes, calcula mediana y promedio, guarda JSON de identidad o gzip y lo imprime.

La opción que acepta el certificado local autofirmado solo es adecuada para probar `localhost`; no debe reutilizarse como configuración de cliente en producción.

### 4.8 Comandos y herramientas que permiten ejecutar el proyecto

| Herramienta/dependencia | Función en SecureGuard |
|---|---|
| Node.js | Runtime del servidor y scripts. README pide Node 20 o superior. |
| npm | Instala paquetes y ejecuta scripts definidos en `package.json`. |
| Express | Routing, middleware HTTP, JSON y archivos estáticos. |
| HTTPS/TLS de Node | Envuelve Express con certificado/llave local. |
| MySQL/MariaDB | Persistencia relacional de usuarios e incidentes. |
| Prisma CLI y Prisma Client | Migraciones/configuración de schema y acceso de datos tipado. |
| `@prisma/adapter-mariadb` | Transporte de Prisma Client hacia MySQL/MariaDB. |
| `dotenv` | Carga la configuración del entorno en local. |
| `jsonwebtoken` | Firma y valida tokens de sesión. |
| `bcryptjs` | Genera y compara hashes de contraseñas. |
| `cors` | Lista permitida de orígenes/métodos/cabeceras HTTP. |
| `compression` | gzip de cuerpos HTTP que superan el umbral configurado. |
| `selfsigned` | Certificado local autofirmado para desarrollo. |
| Jest | Pruebas unitarias en Node y mocking del modelo de Prisma. |
| ESLint + `@eslint/js` + `globals` | Reglas estáticas y globals separados para servidor, navegador y pruebas. |
| Node `https`, `zlib`, `crypto`, `perf_hooks` | Solicitudes, descompresión, hash de contenido y cronometraje de la medición. |
| Google Fonts / Unsplash / jQuery CDN | Recursos externos referenciados por HTML/CSS; no integraciones de negocio. |

Scripts npm:

```text
npm start             -> node server.js
npm run cert          -> node crear-cert.js
npm run migrate       -> prisma migrate dev --config prisma7.config.ts
npm run generate      -> prisma generate --config prisma7.config.ts
npm run seed          -> node src/seed.js
npm test -- --runInBand -> Jest serial
npm run lint          -> eslint .
npm run medir:red -- identity
npm run medir:red -- gzip
```

## 5. Contrato de datos y comportamiento

Reglas de alta: título de 5 a 100 caracteres; descripción de 20 a 500; severidad de una lista cerrada; tipo de 2 a 80; fecha real en `AAAA-MM-DD` no futura; correo con formato básico y máximo 254; reportante opcional; prioridad con severidad permitida y por defecto igual a severidad; estado inicial `En investigación`.

PATCH modifica únicamente `estado`. PUT exige el conjunto completo de campos definidos por `CAMPOS_REEMPLAZO`. Las respuestas de API usan JSON con `ok`, `datos`/`mensaje`, y `total` en el listado. Errores esperados incluyen 400 (entrada), 401 (sesión), 403 (rol), 404 (ruta o incidente), y 500 (error inesperado).

## 6. Manual de usuario para la demostración local

### Preparación

1. Instala Node.js 20+ y MySQL/MariaDB.
2. Desde la carpeta del proyecto ejecuta `npm install`.
3. Copia `.env.example` a `.env`; configura `DATABASE_URL`, crea un `JWT_SECRET` aleatorio de 64 caracteres hexadecimales y conserva el archivo fuera de Git.
4. Ejecuta `npm run cert`, luego `npm run migrate`.
5. Solo en una base de datos de demostración aislada, ejecuta `npm run seed` para crear cuentas demo. No uses el seed en producción.
6. Ejecuta `npm test -- --runInBand` y `npm run lint`; confirma que la base responde antes de iniciar el flujo.
7. Ejecuta `npm start` y visita `https://localhost:3000`. El navegador advertirá que el certificado autofirmado no es de confianza; esta excepción solo aplica al localhost del laboratorio.

### Recorrido de usuario

1. Inicia sesión con el usuario demo adecuado al paso de la demostración.
2. Observa la lista y el resumen. Explica que las dos métricas de incidentes (`total`, `abiertos`) se derivan del listado; las otras tarjetas visuales son datos estáticos y no deben defenderse como resultados reales.
3. Filtra por severidad y confirma que cambian las tarjetas mostradas.
4. Como analista/admin, crea un reporte con valores de demostración ficticios y no sensibles.
5. Confirma el mensaje de éxito y que el registro se ve tras volver a consultar la lista.
6. Como supervisor/admin, cambia el estado y demuestra que el backend rechazaría un rol no autorizado.
7. Como admin, elimina un registro de prueba, no un dato ajeno.
8. Cierra sesión; vuelve a intentar una ruta protegida y confirma 401. Con analista intenta una acción admin y confirma 403.
9. Para demostrar persistencia tras reinicio, conserva un dato de prueba, reinicia el proceso, inicia sesión de nuevo y confirma el registro; requiere que MySQL siga activo.

### Pruebas de usuario y criterios

| Caso | Acción | Resultado esperado |
|---|---|---|
| Login válido | Enviar cuenta demo habilitada. | 200, token con expiración y perfil básico. |
| Login inválido | Contraseña incorrecta. | 401 sin token. |
| Sin sesión | Acceder a incidentes sin Authorization. | 401. |
| Rol insuficiente | Analista invoca DELETE. | 403. |
| Alta válida | Enviar campos válidos. | 201 y registro persistido. |
| Alta inválida | Título corto/fecha futura/campo inesperado. | 400 con mensaje de validación. |
| Cambio parcial | Supervisor envía PATCH de estado conocido. | 200; campos restantes se conservan. |
| Recurso ausente | Consultar un código inexistente o `1e309`. | 404; no error interno 500. |
| Concurrencia | Enviar dos altas simultáneas. | Dos 201 y códigos distintos. |
| Reinicio | Reiniciar API conservando base. | El registro sigue disponible. |

## 7. Seguridad y límites para un servicio real

### Controles implementados

- Hash bcrypt para contraseñas.
- JWT firmado con secreto de entorno, caducidad de dos horas y comprobación de usuario activo en cada solicitud protegida.
- Autorización por rol en el servidor.
- Allowlist de campos para evitar propiedades internas en el contrato.
- Validación tanto en interfaz como en API; la validación del servidor es la autoridad.
- HTTPS en local, rutas CORS explícitas, carpeta estática limitada a `public/`.
- Renderizado seguro de datos de incidentes mediante `textContent`.
- `.env` y certificados locales excluidos por `.gitignore` y del ZIP de entrega.

### Límites que deben explicarse en la defensa

- No hay URL pública desplegada, conexión productiva ni evidencia de disponibilidad desde Internet. `https://localhost:3000` solo identifica la máquina local.
- `GET /api/salud` confirma que el proceso responde, pero puede dar 200 aunque MySQL esté caído. Hace falta una comprobación de disponibilidad independiente que pruebe la conexión a la base y las políticas del proveedor.
- El frontend fija `https://localhost:3000/api`; CORS también enumera localhost. Ninguna de las dos configuraciones se ajusta automáticamente al dominio público.
- El certificado se crea autofirmado, válido para laboratorio y no para una URL pública confiable.
- Los usuarios del seed y sus contraseñas son previsibles; el seed hace upsert y restablece sus hashes. Las cuentas demo deben deshabilitarse/quitarse en producción.
- La API guarda el JWT en `sessionStorage`; una vulnerabilidad de script del lado cliente podría exponerlo. Para servicio real se requiere revisar CSP/XSS y evaluar sesión con cookie `HttpOnly`, `Secure`, `SameSite` junto a CORS/CSRF.
- Los logs son líneas de consola; no hay agregación central, alertas, retención ni auditoría de quién hizo cada cambio.
- El manejador global envía el mensaje de un error 500 al usuario. En producción debe devolver mensaje genérico y guardar detalle de forma privada.
- El `catch` de validación de token también abarca la búsqueda del usuario; si la base falla puede convertirse en 401 en lugar de 503/500. Conviene distinguir JWT inválido de error de persistencia.
- El listado no pagina. Los filtros se envían desde query sin validación de dominio dedicada.
- La página `detalle.html` es estática; las tarjetas de métricas adicionales son valores fijos; la UI no tiene edición PUT aunque la API sí.
- Google Fonts, Unsplash y jQuery se cargan desde terceros. La app depende de red externa y jQuery no se identificó como necesario.
- La suite incluye pruebas unitarias; no equivale a pruebas de integración de rutas contra una base MySQL real ni a E2E de navegador.
- El estado de MySQL no permitió una verificación completa nueva en el entorno local usado para este cierre.

### Plan de mejora priorizado

1. Eliminar/resetear cuentas demo y cualquier credencial que se haya publicado; activar gestión de secretos del proveedor.
2. Configurar dominio, TLS administrado, CORS con dominio exacto y URL API configurable por entorno.
3. Implementar una comprobación de disponibilidad que refleje el estado de la base; usar registros estructurados, auditoría y alertas sin tokens ni información personal.
4. Añadir pruebas de integración de login y CRUD contra MySQL aislado; automatizar E2E para navegador y roles.
5. Añadir edición PUT en la interfaz, detalle por ID, paginación y validación de filtros; corregir estadísticas estáticas.
6. Añadir limitación de intentos de login, política de contraseña, revocación/rotación de sesión, CSP y cookie segura si se adopta ese modelo.
7. Escanear dependencias y contenedor, fijar proceso de actualizaciones, backups y restauración probada.
8. Documentar responsable del servicio, disponibilidad, retención, tratamiento de datos, respuesta a incidentes y aceptación institucional antes de recibir información real.

## 8. Pruebas, mediciones y evidencia de la versión

La validación ejecutada para esta revisión:

- `npm test -- --runInBand`: 2 suites, 30 pruebas aprobadas.
- `npm run lint`: termina sin errores.
- No se encontró el PDF del informe de Semana 7 en la carpeta ni dentro del paquete final durante esta revisión. El informe PDF de evidencias sigue pendiente; no declarar que está entregado hasta recuperarlo o generarlo y comprobarlo.
- La comparación del mismo CSS con identidad/gzip midió 7 364 frente a 1 959 bytes (73,4 % menos), pero mediana de 1,694 frente a 2,270 ms; el resultado es reducción de transferencia, no de latencia.
- La medición de consulta es exploratoria (4 filas, 5 corridas); mediana 18 a 15 ms. La medición de imagen es 193 924 a 107 603 bytes (44,5 %).
- La carpeta `evidencias/` contiene capturas de controles, defectos, ESLint, regresiones, imagen, consulta y DevTools. Revisar que no se vea Authorization, correo personal o datos de la base.

La rama inspeccionada es `main`, HEAD `93ebdd2`; hay cambios locales sin commit y no se comprobó que se hayan subido al remoto. No se creó una etiqueta final. Debe producirse un commit/tag después de decidir y validar la URL real, y guardar SHA/tag en la portada final.

## 9. Presentación y video de defensa (máximo 20 minutos)

Guion sugerido para un video de aproximadamente 17–19 minutos. El estudiante debe grabar su pantalla y narración; este documento no afirma que exista un video.

| Tiempo | Sección y demostración |
|---|---|
| 0:00–1:30 | Problema y usuarios: por qué registrar y dar seguimiento a incidentes. |
| 1:30–3:30 | Arquitectura: cliente → API HTTPS → autenticación/roles → controladores/validación → Prisma → MySQL. Señalar tecnología y límites. |
| 3:30–5:00 | Repositorio y versión: mostrar tag/SHA final (pendiente hasta congelar) y variables configuradas sin enseñar sus valores. |
| 5:00–6:30 | Login con cuenta demo, token sin revelar; explicar bcrypt, JWT y autorización por rol. |
| 6:30–10:30 | Flujo CRUD preparado: listar, filtrar, crear, consultar, actualizar, borrar usando solo datos ficticios. |
| 10:30–12:00 | Demostrar control de rol: 401 sin token y 403 con rol insuficiente. Explicar que ocultar botones no reemplaza la protección API. |
| 12:00–14:00 | Mostrar pruebas (30), ESLint y casos de regresión de `1e309` y concurrencia. |
| 14:00–15:30 | Enseñar mediciones de consulta, imagen y CSS antes/después; reconocer el aumento de latencia local con gzip. |
| 15:30–17:00 | Mostrar salud/logs y documentación; explicar qué está local y qué necesitaría despliegue. |
| 17:00–18:30 | Limitaciones, plan de contingencia y mejoras para tratar datos institucionales. |
| 18:30–19:30 | Cierre y lecciones aprendidas; dejar margen antes del límite de 20 minutos. |

### Preparación de la grabación

- Reiniciar la aplicación que corresponda al commit/tag que se enseñará y verificar `/api/salud`.
- Verificar inicio de sesión, base, permisos, registro temporal, actualización y borrado antes de grabar.
- Preparar petición de respaldo/capturas si el entorno falla; declarar el fallo si ocurre, no simular resultado real.
- Usar datos de ficción; cerrar DevTools con Authorization visible o censurarlo.
- Mostrar GitHub/URL solo si efectivamente contiene la misma versión. Un servidor local o una rama sin push no constituyen URL pública desplegada.
- Guardar el video con duración menor a 20 minutos y enlazarlo junto con el tag y la evidencia PDF.

### Preguntas que debe poder responder el equipo

1. ¿Por qué se separaron rutas, controladores, validación y modelo?
2. ¿Qué diferencia existe entre autenticación JWT y autorización por rol?
3. ¿Qué ocurría con `1e309` y con altas concurrentes, y cómo se comprobaron las correcciones?
4. ¿Qué se guarda en la base y qué se almacena en `sessionStorage`?
5. ¿Qué mide exactamente la compresión y por qué la latencia local aumentó?
6. ¿Qué prueba demuestra persistencia tras reiniciar, y con qué base se ejecutó?
7. ¿Qué significa el 200 de `/api/salud` y qué no garantiza?
8. ¿Qué controles hacen falta antes de procesar incidentes institucionales?
9. ¿Cómo rotarían un secreto filtrado y cómo deshabilitarían cuentas demo?
10. ¿Qué harían si la demostración falla sin ocultar el problema?

## 10. Lista de verificación de la entrega final y lectura de la rúbrica

| Entregable/rúbrica | Evidencia preparada | Estado real al redactar esta guía |
|---|---|---|
| Plataforma con CRUD, seguridad y persistencia | API/rutas/modelo/UI local y schema MySQL | Código presente; falta demostrar en instancia desplegada estable. |
| URL funcional | Dominio HTTPS y prueba accesible externamente | Pendiente; localhost no satisface URL pública. |
| Código/versionado | Repo conocido y SHA de la base inspeccionada | Cambios locales sin commit/tag final; aún no congelado. |
| Operación, registros, estado del servicio y pruebas | Registro en consola, endpoint de salud y 30 pruebas unitarias | Pruebas y análisis estático aprobados; el endpoint no comprueba la base; registros no centralizados. |
| Evidencias reproducibles | PNG, JSON de medidas e informe | Presentes; deben corresponder al release final y no contener datos sensibles. |
| Documentación técnica | Esta guía, README, esquema y migraciones | Preparada; instrucciones finales de despliegue dependen de proveedor. |
| Manual de usuario | Sección 6 de esta guía | Preparada para demo local; pasos de producción pendientes. |
| Presentación | Guion y tiempos en sección 9 | Preparados; diapositivas/video deben grabarse por el estudiante. |
| Defensa | Preguntas de sección 9 y recorrido de usuario | Requiere práctica y demostración con sistema accesible. |
| PDF final de evidencias | Capturas PNG y registros JSON/texto disponibles | Pendiente: no se encontró el PDF del informe en esta carpeta; exportarlo y verificar que corresponda a la versión final. |

## 11. Resumen para explicarlo en una frase

“SecureGuard es una plataforma académica de incidentes cuyo backend Express protege operaciones con JWT y roles, valida datos en el servidor y persiste en MySQL mediante Prisma; probé reglas y regresiones con Jest y ESLint, medí mejoras con evidencia, y declaro que la URL pública y la operación institucional todavía requieren despliegue, controles y pruebas de integración.”
