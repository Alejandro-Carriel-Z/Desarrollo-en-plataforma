# Cambios y mejoras — Semana 4 vs Semana 3

**Proyecto:** SecureGuard (gestión de incidentes de ciberseguridad)  
**Autor:** Alejandro Carriel · PUCE · Desarrollo de Plataformas  

Este documento resume qué se conservó del trabajo de **SEMANA 3** y qué se mejoró en **SEMANA 4** para la entrega T1S4 (API REST con Express y front-end consumidor).

## Antes / después

| Aspecto | Semana 3 | Semana 4 |
|---------|----------|----------|
| Servidor | `http` nativo (`src/infrastructure/http.js`) | **Express** (`server.js` + router) |
| Enrutado | `if` por método y pathname | `src/routes/incidentes.routes.js` |
| Controladores | `src/presentation/` | `src/controllers/` |
| Datos | Archivo `incidentes.json` (disco) | **Modelo en memoria** (`src/models/`) |
| Operaciones | GET listado, GET detalle, POST | CRUD: GET, POST, **PATCH**, **DELETE** lógico |
| Filtro | Solo en el cliente (si existía) | Query `?severidad=` resuelta en el servidor |
| Observabilidad | `console.log` puntual | **Middleware logger** (método, URL, hora) |
| Errores | `try/catch` por petición | **Middleware** `errorHandler` + 404 de API |
| Front | Fetch a GET/POST | Fetch a listar, **filtrar** y crear |
| Identidad UI | «UNIDAD I / III» | «UNIDAD IV» + select de severidad |

## Qué se conservó

- Identidad visual de SecureGuard (hero, métricas, tarjetas, formulario, detalle).
- MVC del cliente (`public/js/modelo.js`, `vista.js`, `controlador.js`).
- Dominio `src/domain/incidente.js` (id, tipo, estado inicial).
- Validación de negocio (título, descripción, severidad, tipo, fecha, correo) en cliente **y** servidor.
- Contrato JSON `{ ok, total, datos }` / `{ ok, mensaje, detalles }`.
- Endpoint `GET /api/salud`.

## Mejoras principales

1. **Express:** el servidor deja de parsear URLs a mano. Middlewares nativos (`json`, `static`) y un router por recurso.
2. **CRUD completo:** además de leer y crear, el API actualiza (PATCH) y cierra (DELETE lógico → estado `Cerrado`). En un SOC no se borra evidencia.
3. **Modelo en memoria:** el arreglo vive en el proceso Node. Cumple la consigna de la unidad; al reiniciar se vuelve a la semilla (limitación declarada).
4. **Filtro en servidor:** `GET /api/incidentes?severidad=alta` reduce el conjunto antes de pintar el front.
5. **Middleware de registro:** cada petición queda en terminal con fecha ISO. Sirve de evidencia para el informe.
6. **Errores centralizados:** rutas `/api/*` inexistentes responden 404 JSON; excepciones no dejan al cliente sin cuerpo.
7. **Front consumidor:** el select de severidad dispara Fetch; el alta sigue siendo POST; los estados de UI distinguen carga, dato y fallo.

## Cómo probar el salto funcional

```bash
cd "SEMANA 4"
npm install
npm start