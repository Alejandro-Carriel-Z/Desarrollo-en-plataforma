# SEMANA 5 — SecureGuard (Prisma + MySQL)

**Materia:** Desarrollo de Plataformas · PUCE · 5.º semestre
**Estudiante:** Alejandro Carriel

La API Express de la Semana 4 ahora persiste los incidentes en MySQL con Prisma. El front sigue en `public/`.

## Requisitos

- Node.js 18+
- MySQL local (o MariaDB), base `incidentes`

## Cómo ejecutar

```bash
cd "SEMANA 5"
copy .env.example .env
npm install
npx prisma migrate dev
npm start
```

En `.env` pon tu clave local. Ese archivo no se sube al repositorio.

Abre: http://localhost:3000

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/salud` | Estado del servicio |
| GET | `/api/incidentes` | Listado JSON |
| GET | `/api/incidentes/:id` | Detalle |
| POST | `/api/incidentes` | Crear incidente |
| PATCH | `/api/incidentes/:id` | Actualizar |
| DELETE | `/api/incidentes/:id` | Cierre lógico |

## Estructura

```
SEMANA 5/
├── server.js
├── prisma/schema.prisma
├── prisma/migrations/
├── public/
└── src/
```

No hay Dockerfile en esta entrega. La base corre en MySQL de la máquina, no en un contenedor versionado.

Ver [`CAMBIOS_Y_MEJORAS.md`](./CAMBIOS_Y_MEJORAS.md).
