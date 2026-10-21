# SecureGuard — Unidad 8: despliegue, monitoreo y proyecto final

Versión **8.0.0**. Plataforma de gestión de incidentes con CRUD persistente (Prisma + PostgreSQL 16) con borrado lógico y auditoría, autenticación JWT, autorización por roles, rate limiting del login, validación, HTTPS, configuración por entorno, logs estructurados, health check, pruebas finales y despliegue en Render (Blueprint `render.yaml` en la raíz del repo, Web Service + Postgres free). Parte de Semana 7 y de las correcciones hechas tras la retroalimentación.

| Rol | Ver | Crear | Cambiar estado | Editar (PUT) | Cerrar (borrado lógico) |
|---|:-:|:-:|:-:|:-:|:-:|
| analista | ✔ | ✔ | | | |
| supervisor | ✔ | | ✔ | | |
| admin | ✔ | ✔ | ✔ | ✔ | ✔ |

## Documentos de la entrega
| Archivo | Contenido |
|---|---|
| `DOCUMENTACION_TECNICA.md` | Arquitectura (mermaid), variables, API, seguridad, pruebas, despliegue, monitoreo y limitaciones |
| `MANUAL_USUARIO.md` | Uso de la plataforma por rol y solución de problemas |
| `RETROALIMENTACION_Y_LECCIONES.md` | Retroalimentación clasificada y lecciones (16.5) |

## Ejecución local
```powershell
npm install
copy .env.example .env    # completa DATABASE_URL, JWT_SECRET, etc.
npm run cert; npm run migrate; npm run seed
npm start                 # https://localhost:3000
```
Con contenedores: `docker compose up -d --build` (app + postgres:16; el seed corre al arrancar si defines `SEED_*`); abre `http://localhost:8080`.

## Verificación
- `npm run verificar` corre ESLint y Jest (unitarias e integración HTTP).
- `BASE_URL=https://<url> npm run smoke` hace la prueba productiva contra la URL desplegada.
- `GET /api/salud` devuelve 200 con `base: conectada`, entorno, versión y commit, o 503 si la base no responde.

## Seguridad del repositorio
`.env`, `certs/`, `*.pem`, `logs/`, `node_modules/` y los ZIP no se suben. Solo existe `.env.example`, con marcadores. En producción los secretos viven en el panel del hosting.

