# SecureGuard — Unidad 8: despliegue, monitoreo y proyecto final

Versión **8.0.0**. Plataforma de gestión de incidentes con CRUD persistente (Prisma + MySQL), autenticación JWT, autorización por roles, validación, HTTPS, configuración por entorno, logs estructurados, health check, pruebas finales y despliegue en Railway con Docker. Parte de Semana 7 y de las correcciones hechas tras la retroalimentación.

| Rol | Ver | Crear | Cambiar estado | Reemplazar (PUT) | Eliminar |
|---|:-:|:-:|:-:|:-:|:-:|
| analista | ✔ | ✔ | | | |
| supervisor | ✔ | | ✔ | | |
| admin | ✔ | ✔ | ✔ | ✔ | ✔ |

## Documentos de la entrega
| Archivo | Contenido |
|---|---|
| `DOCUMENTACION_TECNICA.md` | Arquitectura (mermaid), variables, API, seguridad, pruebas, despliegue, monitoreo y limitaciones |
| `MANUAL_USUARIO.md` | Uso de la plataforma por rol y solución de problemas |
| `DESPLIEGUE.md` | Pasos exactos para publicar en Railway, verificar, etiquetar y revertir |
| `PRESENTACION.md` | Contenido de las diapositivas |
| `GUION_VIDEO_DEFENSA.md` | Guion cronometrado (≤ 20 min) y preguntas probables con respuesta |
| `CHECKLIST_EVIDENCIAS.md` | Capturas para el PDF de evidencias |
| `RETROALIMENTACION_Y_LECCIONES.md` | Retroalimentación clasificada y lecciones (16.5) |
| `MODIFICACIONES_HECHAS_POR_GROK.md` | Qué archivos se crearon o cambiaron y por qué |
| `GUIA_FINAL_SECUREGUARD.md` | Guía de estudio detallada (de Semana 7) |

## Ejecución local
```powershell
npm install
copy .env.example .env    # completa DATABASE_URL, JWT_SECRET, etc.
docker start mysql-incidentes
npm run cert; npm run migrate; npm run seed
npm start                 # https://localhost:3000
```
Con contenedores: `docker compose up -d --build` y luego `docker compose exec app npm run seed`; abre `http://localhost:8080`.

## Verificación
- `npm run verificar` corre ESLint y Jest (unitarias e integración HTTP).
- `BASE_URL=https://<url> npm run smoke` hace la prueba productiva contra la URL desplegada.
- `GET /api/salud` devuelve 200 con `base: conectada`, entorno, versión y commit, o 503 si la base no responde.

## Seguridad del repositorio
`.env`, `certs/`, `*.pem`, `logs/`, `node_modules/` y los ZIP no se suben. Solo existe `.env.example`, con marcadores. En producción los secretos viven en el panel del hosting.
