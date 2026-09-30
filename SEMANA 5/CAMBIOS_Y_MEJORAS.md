# Cambios y mejoras — Semana 5 vs Semana 4

**Proyecto:** SecureGuard
**Autor:** Alejandro Carriel · PUCE · Desarrollo de Plataformas

## Antes / después

| Aspecto | Semana 4 | Semana 5 |
|---------|----------|----------|
| Datos | Modelo en memoria | MySQL con Prisma |
| Esquema | Campos sueltos en JS | `prisma/schema.prisma` |
| Migraciones | No | `prisma/migrations` |
| Conexión | Ninguna | `DATABASE_URL` en `.env` (no versionado) |
| API | CRUD Express | El mismo CRUD, ahora contra la base |

## Qué se conservó

- Express, rutas, middleware de log y de errores.
- Contrato JSON del front.
- Cierre lógico: DELETE no borra la fila, pone estado `Cerrado`.

## Qué no entra al repositorio

- `.env` (usuario y clave de MySQL).
- `node_modules`.
- Carpetas de agentes (`.agents`, `.claude`, `.windsurf`).
- El `.rar` duplicado de la carpeta.
- No hay archivos de Docker que subir.

## Cómo probar

1. Crear la base `incidentes` en MySQL.
2. Copiar `.env.example` a `.env` y poner la clave local.
3. `npx prisma migrate dev` y `npm start`.
4. `http://localhost:3000/api/incidentes` debe leer de la base, no de un arreglo en memoria.
