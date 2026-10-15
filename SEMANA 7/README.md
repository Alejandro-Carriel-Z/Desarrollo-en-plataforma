# SecureGuard — Semana 7: validación, pruebas y optimización

API de gestión de incidentes de seguridad con Express, Prisma y MySQL. La base funcional y el control de acceso provienen de Semana 6; esta entrega añade depuración, pruebas y optimización:

- **Login con JWT** (`POST /api/auth/login`). El token dura 2 horas y se firma con `JWT_SECRET`.
- **Contraseñas con bcrypt** (`src/security/hash.js`). En la base solo se guarda el hash.
- **Roles** (`src/security/rol.js`):

| Acción | analista | supervisor | admin |
|--------|:--------:|:----------:|:-----:|
| Ver incidentes (`GET`) | ✔ | ✔ | ✔ |
| Crear (`POST`) | ✔ | | ✔ |
| Cambiar estado (`PATCH`) | | ✔ | ✔ |
| Reemplazar (`PUT`) | | | ✔ |
| Cerrar / eliminar (`DELETE`) | | | ✔ |

- **HTTPS** con certificado autofirmado para `localhost`.
- Tabla `Usuario` nueva en Prisma (migración `20261007044322_usuarios`).
- **Validación de entradas** en altas y actualizaciones; PATCH solo permite cambiar el estado.
- **Renderizado seguro** de incidentes con `textContent`, sin interpolar datos en `innerHTML`.
- La interfaz elimina la sesión vencida ante un `401` de incidentes y explica los `403` de permisos.

La base funcional de esta entrega viene de Semana 6; esta semana incorpora depuración, pruebas de reglas de negocio, ESLint, mediciones y una corrección de concurrencia/identificadores en el módulo MVC.

## Estructura

```
SEMANA 7/
├── server.js               # Servidor HTTPS, CORS y rutas
├── crear-cert.js           # Genera certs/key.pem y certs/cert.pem (no se suben)
├── prisma/                 # schema.prisma y migraciones
├── public/                 # Frontend (index.html, detalle.html, css, js)
├── src/
│   ├── controllers/        # auth e incidentes
│   ├── routes/             # /api/auth y /api/incidentes
│   ├── models/             # acceso a datos con Prisma
│   ├── validation/         # validación y allowlist de datos de incidentes
│   ├── security/           # hash (bcrypt), token (JWT), rol (middleware)
│   ├── middleware/         # logger y manejo de errores
│   └── seed.js             # crea los usuarios de prueba
├── evidencias/             # capturas de las pruebas
├── tests/                  # pruebas Jest (validación y modelo)
├── .env.example            # plantilla sin credenciales reales
└── T1S7_SecureGuard_Carriel.pdf # informe técnico de la entrega
```

## Cómo ejecutarlo

Requisitos: Node.js 20+ y MySQL o MariaDB local. El adaptador de la aplicación está configurado para la base `secureguard`.

```bash
cd "SEMANA 7"
npm install
cp .env.example .env     # luego pon tu clave de MySQL y un JWT_SECRET propio
# Genera JWT_SECRET con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
npm run cert              # crea el certificado HTTPS local
npm run migrate           # crea las tablas
npm run seed              # crea los usuarios de prueba
npm start
```

Abre https://localhost:3000 y acepta el aviso del navegador (el certificado es autofirmado).

**Nota de configuración:** tanto el CLI de Prisma (migraciones) como el cliente de ejecución (`src/lib/prisma.js`) leen la conexión desde `DATABASE_URL`. No hay credenciales fijas en el código.

### Usuarios de prueba

`npm run seed` crea tres cuentas **solo para pruebas locales**: `analista@secureguard.edu`, `supervisor@secureguard.edu` y `admin@secureguard.edu`. Sus contraseñas de demostración están en `src/seed.js`. No son credenciales reales; cámbialas si despliegas el proyecto fuera de tu equipo.

## Pruebas (carpeta `evidencias/`)

Ejecuta las pruebas unitarias de validación con `npm test`.

| Captura | Qué demuestra |
|---------|---------------|
| 01 | Login correcto devuelve token (200) |
| 02 | Petición sin token (401) |
| 03 | Analista intenta eliminar (403) |
| 04 | Validación de título corto (400) |
| 05 | Admin crea incidente (201) |
| 06 | Supervisor cambia estado (200) |
| 07 | Token falso (401) |
| 08 | Los datos persisten después de reiniciar (MySQL) |
| 09–11 | Pantalla de login y botones según el rol |

## Seguridad del repositorio

No se suben `.env`, `certs/` (llave privada del HTTPS), `node_modules/` ni las carpetas de asistentes de IA. Solo va `.env.example` con valores de ejemplo.

El servidor rechaza `JWT_SECRET` si no tiene 64 caracteres hexadecimales. `.gitignore` evita que `.env`, `certs/` y las claves se agreguen accidentalmente a Git, pero no los quita de una copia manual o un ZIP. Antes de entregar, comprueba que `.env`, `certs/key.pem` y cualquier otra clave privada no estén incluidos. Si ya compartiste esos archivos, cambia la contraseña de MySQL y genera un `JWT_SECRET` nuevo; vuelve a generar también el certificado local.

El servidor publica únicamente la carpeta `public/`. Antes servía la raíz del proyecto, así que desde el navegador se podían descargar `certs/key.pem` y el código del servidor.

Las rutas `PATCH /api/incidentes/:id` y `PUT /api/incidentes/:id` validan su cuerpo antes de llegar a Prisma. PATCH admite únicamente `estado`; PUT exige los campos editables completos y rechaza campos internos como `id` o `codigo`. El título, la descripción y los demás datos que se muestran en tarjetas se insertan como texto, no como HTML ejecutable.

## Cambios respecto a Semana 5

- Autenticación con JWT y contraseñas con bcrypt.
- Autorización por roles en cada ruta de incidentes.
- HTTPS en lugar de HTTP.
- Frontend con formulario de login, token en `sessionStorage` y botones según el rol.
- Frontend movido a `public/` para no exponer archivos sensibles.
- `server.js` se detiene con un mensaje claro si falta `.env` o el certificado.
- `dotenv` agregado a las dependencias (se usaba, pero no estaba en `package.json`).

## Semana 7 — pruebas y optimización

### Pruebas y análisis
- `npm test -- --runInBand` ejecuta Jest. Hay 11 pruebas: reglas de creación, PATCH y PUT; fechas; identificadores de consulta; y creación transaccional con códigos no duplicados.
- `npm run lint` ejecuta ESLint. La captura inicial mostró 41 diagnósticos, incluidos configuración incorrecta del entorno, variables globales de Node/Jest y dos variables sin uso. Se ajustó `eslint.config.mjs` y se corrigieron los dos identificadores; la verificación final debe mostrar 0 errores.

### Depuración
- El 401 de GET sin token y el 400 de POST con título de tres letras son respuestas correctas de seguridad/validación, no defectos. Las capturas iniciales sirven como controles negativos y no se cuentan como errores corregidos.
- Esos controles están identificados como `control sin token 401.png`, `control autenticado 200.png`, `control titulo corto 400.png` y `control titulo valido 201.png`. Los tokens de las capturas fueron censurados.
- Defecto reproducible 1: `GET /api/incidentes/1e309` convertía el identificador a `Infinity` y Prisma devolvía 500. El modelo ahora solo agrega el filtro `id` para enteros positivos seguros; valores no numéricos se tratan como códigos y una coincidencia ausente responde 404. En la línea base `1.5` ya respondía 404; se conserva como límite comprobado, no como defecto.
- Defecto reproducible 2: generar `INC-nnn` leyendo el último registro antes del INSERT permitía que solicitudes simultáneas calcularan el mismo código y fallaran por unicidad. En la prueba de seis altas, solo una respondió 201 y cinco respondieron 500. La creación ahora asigna el código derivado del ID autoincremental dentro de una transacción.
- Las regresiones se verifican en `tests/incidentes-model.test.js`; las reglas de negocio de entrada siguen cubiertas en `tests/incidentes-validation.test.js`.
- Resultado HTTP antes/después, incluido el resultado de limpieza de datos temporales: `evidencias/resultados-regresion-http.txt`.
- Capturas nuevas de DevTools Network tras reiniciar el servidor actualizado: `evidencias/devtools-get-id-1e309-404.png`, `evidencias/devtools-post-concurrentes-201.png` y `evidencias/devtools-get-404-post-concurrentes-201.png`. No muestran encabezados ni valores de token.

### Rendimiento
- Consulta GET (5 corridas con cuatro filas): antes 7, 22, 18, 7, 23 ms; después de seleccionar columnas explícitas: 7, 22, 15, 8, 23 ms. La mediana baja de 18 a 15 ms (16,7 %), pero la muestra y cardinalidad son pequeñas; no permiten atribuir una mejora significativa ni afirmar reducción de carga de BD. Se conserva el resultado como medición exploratoria.
- Imagen del encabezado, misma imagen/servicio y parámetros de formato/calidad: `w=1600`, 193 924 bytes; `w=960`, 107 603 bytes, reducción de 86 321 bytes (44,5 %). La captura de Network registra ambos `Content-Length`.
- Red: GET autenticado del listado registra 200, 1 223 bytes de contenido y un encabezado Authorization; sin credencial devuelve 401 y 38 bytes. Son tamaños de respuesta observados, no una medición de latencia comparativa. No incluir ni compartir capturas que muestren el token.

### Refactor
La validación salió del controlador y quedó en `src/validation/incidentes.js`. El controlador coordina HTTP y el modelo de `src/models/incidentes.model.js` concentra acceso a datos. La secuencia de alta y la búsqueda por ID se mantienen en el modelo. Las pruebas actuales pasan con `npm test -- --runInBand`; repetirlas tras cualquier cambio.

### Arranque
1. Configura `.env` a partir de `.env.example` y asegúrate de que MySQL/MariaDB esté disponible.
2. Ejecuta `npm run cert` si no existen los certificados locales y `npm run migrate` para crear/actualizar el esquema.
3. Ejecuta `npm start` y abre `https://localhost:3000`; acepta el certificado autofirmado solo en el entorno local.

El informe técnico está en `T1S7_SecureGuard_Carriel.pdf`. Las capturas y el registro de regresión antes/después están en `evidencias/`.