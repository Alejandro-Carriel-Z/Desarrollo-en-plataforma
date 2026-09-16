# Cambios y mejoras — Semana 3 vs Semanas 1 y 2

**Proyecto:** SecureGuard (gestión de incidentes de ciberseguridad)  
**Autor:** Alejandro Carriel · PUCE · Desarrollo de Plataformas  

Este documento resume qué se conservó del trabajo de **SEMANA 1 Y 2** y qué se mejoró en **SEMANA 3**.

## Antes / después

| Aspecto | Semanas 1 y 2 | Semana 3 |
|---------|---------------|----------|
| Ejecución | Archivos estáticos + servidor local genérico (`http.server`) | Servidor **Node.js** propio (`npm start`) |
| Datos | `incidentes.json` leído solo en el navegador (`fetch`) | Persistencia en servidor (`src/persistence`) vía API |
| Lógica de negocio | Validación y estado en el front (JS del navegador) | Validación y casos de uso en **capa application** |
| Arquitectura | MVC ligero en el cliente (`modelo` / `vista` / `controlador`) | Capas: domain → application → presentation → infrastructure → persistence |
| Comunicación | Sin API real | REST JSON (`/api/salud`, `/api/incidentes`, `POST`) |
| Escalabilidad | Difícil compartir estado entre clientes | Base lista para varios clientes contra el mismo backend |
| Entregable | HTML/CSS/JS + informes MD | App runnable + informe PDF + este documento |

## Qué se conservó

- Identidad visual y UX de SecureGuard (panel, métricas, formulario, detalle).
- Enfoque académico de **separación de responsabilidades** (antes MVC en cliente; ahora capas en servidor + módulos ES en el front).
- Validaciones de negocio (título, descripción, severidad, tipo, fecha, correo).
- Dominio de incidentes de ciberseguridad (severidad, tipo, estado, etc.).

## Mejoras principales

1. **Backend real:** `server.js` + `http` nativo sirven estáticos y API sin Express (menos magia, más control para la materia).
2. **API REST:** el front ya no “simula” el backend; consume endpoints y recibe errores estructurados (`ok`, `mensaje`, `detalles`).
3. **Arquitectura por capas:**
   - `domain`: entidad `Incidente`
   - `application`: listar / obtener / registrar + validación
   - `presentation`: controladores HTTP
   - `infrastructure`: servidor y enrutado
   - `persistence`: repositorio sobre JSON
4. **Persistencia centralizada:** altas hechas por `POST` quedan en el servidor (archivo JSON), no solo en memoria del navegador.
5. **Mantenibilidad:** cambiar almacenamiento (p. ej. a SQLite/Mongo) implica tocar sobre todo `persistence`, no el HTML.
6. **Documentación de portafolio:** `README.md` de ejecución + este changelog para evidencia académica en GitHub.

## Cómo probar el salto funcional

1. En Semanas 1–2 hacía falta un server estático y el alta vivía en la sesión del navegador.
2. En Semana 3:
   ```bash
   cd "SEMANA 3"
   npm start
   ```
3. Verificar `GET http://localhost:3000/api/salud` y `GET /api/incidentes`.
4. Registrar un incidente desde la UI y confirmar que aparece en el listado y en la API.

## Conclusión

Semana 3 no reemplaza el aprendizaje de front de Semanas 1 y 2: lo **extiende**. El mismo producto académico pasa de prototipo de interfaz a **aplicación web con API y diseño en capas**, alineado a buenas prácticas de desarrollo de plataformas.