# SEMANA 3 — SecureGuard (API + capas)

**Materia:** Desarrollo de Plataformas · PUCE · 5.º semestre  
**Estudiante:** Alejandro Carriel  

Evolución del gestor de incidentes: de front estático (Semanas 1 y 2) a una app **Node.js** con API REST y arquitectura por capas.

## Requisitos

- Node.js 18+

## Cómo ejecutar

```bash
cd "SEMANA 3"
npm start
```

Abre: http://localhost:3000

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/salud` | Estado del servicio |
| GET | `/api/incidentes` | Listado JSON |
| GET | `/api/incidentes/:id` | Detalle |
| POST | `/api/incidentes` | Crear incidente (JSON) |

## Estructura

```
SEMANA 3/
├── server.js
├── package.json
├── public/                 # HTML, CSS, JS del cliente
├── src/
│   ├── domain/             # Entidad Incidente
│   ├── application/        # Casos de uso + validación
│   ├── presentation/       # Controladores HTTP
│   ├── infrastructure/     # Servidor http nativo
│   └── persistence/        # Repositorio + JSON
├── INFORME_T1S3.pdf
├── CAMBIOS_Y_MEJORAS.md
└── README.md
```

Ver comparación con el trabajo anterior en [`CAMBIOS_Y_MEJORAS.md`](./CAMBIOS_Y_MEJORAS.md).