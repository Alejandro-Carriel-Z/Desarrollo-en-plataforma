# SecureGuard — SEMANA 3 (Unidad 3)

**Estudiante:** Alejandro Carriel  
**Asignatura:** Desarrollo de plataformas · PUCE · 5.º semestre  
**Tema:** Plataforma digital con Node.js, HTTP y arquitectura por capas

## Requisitos

- **Node.js** 18 o superior (`node -v`)
- npm (incluido con Node)

## Cómo ejecutar

```bash
cd "SEMANA 3"
npm install   # opcional: no hay dependencias externas
npm start     # equivale a: node server.js
```

Abrir en el navegador:

| Recurso | URL |
|---------|-----|
| Cliente | http://localhost:3000 |
| API (listado) | http://localhost:3000/api/incidentes |
| API (detalle) | http://localhost:3000/api/incidentes/INC-002 |
| Salud | http://localhost:3000/api/salud |

Puerto configurable con la variable de entorno `PORT` (por defecto `3000`).

## Estructura

```
SEMANA 3/
├── package.json
├── server.js                 # punto de entrada
├── README.md
├── CAMBIOS_Y_MEJORAS.md
├── public/                   # presentación (cliente)
│   ├── index.html
│   ├── detalle.html
│   ├── css/estilos.css
│   └── js/                   # app.js, api.js, vista.js, detalle.js
└── src/
    ├── domain/               # entidad y reglas de negocio
    ├── application/          # casos de uso
    ├── presentation/         # controladores HTTP/API
    ├── infrastructure/       # servidor HTTP y estáticos
    └── persistence/          # repositorio + data/incidentes.json
```

## API (resumen)

- `GET /api/salud` — estado del servicio  
- `GET /api/incidentes` — listar  
- `GET /api/incidentes/:id` — detalle  
- `POST /api/incidentes` — crear (JSON: titulo, descripcion, severidad, tipo, fecha, correo)

El servidor usa el módulo nativo `http` de Node.js (**sin dependencias de npm**).

## Documentación académica

Ver [CAMBIOS_Y_MEJORAS.md](./CAMBIOS_Y_MEJORAS.md) para la comparación con Semanas 1 y 2.
