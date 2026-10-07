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
│   ├── security/           # hash (bcrypt), token (JWT), rol (middleware)
│   ├── middleware/         # logger y manejo de errores
│   └── seed.js             # crea los usuarios de prueba
├── evidencias/             # capturas de las pruebas
└── T1S6_SecureGuard_Carriel.pdf
```

## Cómo ejecutarlo

Requisitos: Node.js 20+ y MySQL o MariaDB local con una base llamada `incidentes`.

```bash
cd "SEMANA 6"
npm install
cp .env.example .env      # en Windows: copy .env.example .env
# Edita .env con tu usuario y clave de MySQL y un JWT_SECRET largo
npm run cert              # crea el certificado HTTPS local
npm run migrate           # crea las tablas
npm run seed              # crea los usuarios de prueba
npm start
```

Abre https://localhost:3000 y acepta el aviso del navegador (el certificado es autofirmado).

### Usuarios de prueba

`npm run seed` crea tres cuentas **solo para pruebas locales**: `analista@secureguard.edu`, `supervisor@secureguard.edu` y `admin@secureguard.edu`. Sus contraseñas de demostración están en `src/seed.js`. No son credenciales reales; cámbialas si despliegas el proyecto fuera de tu equipo.

## Pruebas (carpeta `evidencias/`)

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

El servidor publica únicamente la carpeta `public/`. Antes servía la raíz del proyecto, así que desde el navegador se podían descargar `certs/key.pem` y el código del servidor.

## Cambios respecto a Semana 5

- Autenticación con JWT y contraseñas con bcrypt.
- Autorización por roles en cada ruta de incidentes.
- HTTPS en lugar de HTTP.
- Frontend con formulario de login, token en `sessionStorage` y botones según el rol.
- Frontend movido a `public/` para no exponer archivos sensibles.
- `server.js` se detiene con un mensaje claro si falta `.env` o el certificado.
- `dotenv` agregado a las dependencias (se usaba, pero no estaba en `package.json`).