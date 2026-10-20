# Retroalimentación final y lecciones aprendidas (16.5)

> Revisa y completa con tus palabras la retroalimentación concreta que te dio el docente.

## Retroalimentación recibida y clasificación
| Observación | Tipo | Impacto | Urgencia | Esfuerzo | Acción |
|---|---|---|---|---|---|
| Faltaba URL desplegada y versión final identificada | Defecto | Alto | Alta | Medio | Dockerfile, railway.json, configuración por entorno y etiqueta `v8.0.0` (hecho en Semana 8) |
| El cliente apuntaba a `https://localhost:3000` | Defecto | Alto | Alta | Bajo | Ruta relativa `/api` (corregido) |
| Faltaban pruebas de casos fallidos | Mejora | Medio | Media | Medio | 12 casos nuevos de validación + integración HTTP (hecho) |
| Medición de red sin comparación controlada | Mejora | Medio | Baja | Bajo | `scripts/medir-red.js` con SHA-256 y medianas (hecho) |
| Faltaba el informe PDF de Semana 7 | Defecto de entrega | Medio | Media | Bajo | Regenerar el PDF de evidencias (pendiente del estudiante) |
| Sin límite de intentos de login | Mejora | Medio | Baja | Bajo | Planificado: `express-rate-limit` |

## Retrospectiva: planificado frente a ocurrido
- **Planificado:** CRUD con seguridad por semanas y despliegue al final.
- **Ocurrido:** la clave de MySQL estaba escrita en `src/lib/prisma.js`, el cliente dependía de localhost y el certificado autofirmado no sirve detrás de un proxy. El despliegue obligó a separar la configuración por entorno.

## Lecciones (con acciones concretas)
1. **Una prueba previno una regresión:** el test de creación transaccional detectó códigos `INC-###` duplicados. Acción: correr `npm run verificar` antes de cada push.
2. **Los secretos no van en el código:** la clave de BD estaba hardcodeada. Acción: validar variables al arrancar y revisar `git diff --cached` antes de commitear.
3. **Localhost no es producción:** la URL fija del cliente y el HTTPS propio fallaban tras el proxy. Acción: configuración por entorno desde el inicio.
4. **La salud no es funcionalidad:** `/api/salud` puede dar 200 con el login roto. Acción: el health check consulta la BD y se complementa con el smoke test.
5. **Los logs deben ser útiles sin exponer datos:** el `requestId` conecta el error del usuario con el log. Acción: JSON estructurado con campos sensibles ocultos.

## Cierre
Después de la defensa: rotar `JWT_SECRET` y las claves demo, eliminar los datos de prueba y decidir si el servicio sigue activo.
