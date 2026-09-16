# Cambios y mejoras — Semana 3 frente a Semanas 1 y 2

**Asignatura:** Desarrollo de plataformas · PUCE  
**Estudiante:** Alejandro Carriel  
**Entregable:** SecureGuard (gestión académica de incidentes de ciberseguridad)

---

## 1. Qué cambió

En **Semanas 1 y 2** la aplicación era un prototipo **estático**: HTML, CSS y JavaScript en el navegador, con datos leídos desde un archivo `incidentes.json` local (sin servidor de aplicación). La creación de incidentes ocurría solo en memoria del cliente y se perdía al recargar.

En **Semana 3** el mismo dominio funcional evoluciona a una **plataforma digital** con:

- Servidor **Node.js** (`http` nativo).
- **API HTTP/JSON** (`GET`/`POST` sobre `/api/incidentes`).
- **Arquitectura por capas** (dominio, aplicación, presentación, infraestructura, persistencia).
- **Persistencia** en archivo JSON administrado por el servidor.
- Cliente en `public/` que consume la API en lugar de leer el JSON directamente.

---

## 2. Mejoras

| Dimensión | Beneficio en Semana 3 |
|-----------|------------------------|
| Separación de responsabilidades | UI, reglas de negocio, transporte HTTP y almacenamiento quedan desacoplados. |
| Escalabilidad académica | Se puede sustituir el repositorio JSON por una base de datos sin reescribir la UI. |
| Mantenibilidad | Cambios de validación viven en dominio/aplicación; el HTML no mezcla lógica de negocio. |
| Contrato HTTP | Endpoints claros facilitan pruebas con el navegador, `curl` o clientes futuros. |
| Persistencia | Los incidentes creados se guardan en el servidor y sobreviven a la recarga del cliente. |
| Seguridad básica | Validación de entrada en servidor; rutas estáticas normalizadas para evitar path traversal; respuestas JSON tipadas y códigos HTTP coherentes (400/404/500). |

---

## 3. Qué se preservó

- Identidad visual y tipografía (**SecureGuard**, DM Sans / Space Grotesk).
- Flujo de usuario: listado, registro con validación de formulario y vista de detalle.
- Campos del incidente: título, descripción, severidad, tipo, fecha, estado, reportante.
- Enfoque académico/defensivo (gestión de incidentes, no material ofensivo).
- Datos de ejemplo iniciales (INC-001 … INC-003) como semilla.

---

## 4. Cómo ejecutar y estructura

```bash
cd "SEMANA 3"
npm start
# Cliente: http://localhost:3000
# API:     http://localhost:3000/api/incidentes
```

Capas en `src/`:

1. **domain** — creación y validación del incidente.  
2. **application** — casos de uso (listar, obtener, registrar).  
3. **presentation** — controlador de la API.  
4. **infrastructure** — servidor HTTP y archivos estáticos.  
5. **persistence** — repositorio sobre `data/incidentes.json`.

---

## 5. Tabla comparativa (antes / después)

| Aspecto | Semanas 1 y 2 | Semana 3 |
|---------|---------------|----------|
| Ejecución | Abrir `index.html` en el navegador | `npm start` → servidor en puerto 3000 |
| Datos | `incidentes.json` estático (fetch local) | API + archivo JSON en el servidor |
| Alta de incidentes | Solo en memoria del navegador | `POST /api/incidentes` con persistencia |
| Arquitectura | MVC ligero en el cliente | n-capas en el servidor + cliente delgado |
| Dependencias | Ninguna (HTML/CSS/JS) | Node.js ≥ 18 (sin paquetes npm) |
| Detalle | Página mayormente estática / hardcodeada | Detalle dinámico vía `GET /api/incidentes/:id` |
| Documentación | Informes de revisión Unidad I | `README.md` + este documento de cambios |

---

## 6. Conclusión

La Semana 3 no reemplaza el trabajo anterior: lo **profesionaliza** al introducir un servidor, un contrato HTTP y una separación por capas alineada con el desarrollo de plataformas digitales, manteniendo la experiencia de usuario y el dominio SecureGuard construidos en Semanas 1 y 2.
