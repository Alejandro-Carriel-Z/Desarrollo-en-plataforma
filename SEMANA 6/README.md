# Semana 6 — SecureGuard: autenticación, roles y HTTPS

API de gestión de incidentes de seguridad (Express + Prisma + MySQL) a la que esta semana se le agrega control de acceso:

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

## Estructura

```
SEMANA 6/
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
├── tests/                  # pruebas de validación (npm test, node:test)
├── DM_CORRECCIONES.md      # detalle de las correcciones de seguridad y CRUD
├── funcionalidad y explicacion del codigo.pdf  # explicación del proyecto
├── evidencias/             # capturas de las pruebas
└── T1S6_SecureGuard_Carriel.pdf
```

## Cómo ejecutarlo

Requisitos: Node.js 20+ y MySQL o MariaDB local con una base llamada `incidentes`.

```bash
cd "SEMANA 6"
npm install
cp .env.example .env      # en Windows: copy .env.example .env
# Edita .env con tu usuario y clave de MySQL y genera JWT_SECRET con el comando del archivo
npm run cert              # crea el certificado HTTPS local
npm run migrate           # crea las tablas
npm run seed              # crea los usuarios de prueba
npm start
```

Abre https://localhost:3000 y acepta el aviso del navegador (el certificado es autofirmado).

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