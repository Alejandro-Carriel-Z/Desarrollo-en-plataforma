# SecureGuard — Contenido de la presentación (10 diapositivas)

> Puedes pasar cada sección a una diapositiva de PowerPoint o Canva. Pon poco texto y explica de palabra.

### 1. Portada
SecureGuard: plataforma segura de gestión de incidentes. Alejandro Carriel · Desarrollo en Plataformas · PUCE · Versión 8.0.0 · URL pública.

### 2. Problema y usuario
Un SOC pequeño registra incidentes en hojas de cálculo y correos: no hay trazabilidad, cualquiera edita y no hay control de acceso. Los usuarios son el analista, el supervisor y el administrador.

### 3. Solución
Una aplicación web y una API REST para registrar, clasificar (severidad y prioridad) y dar seguimiento (estados) a incidentes, con permisos por rol.

### 4. Arquitectura
Usa el diagrama mermaid de `DOCUMENTACION_TECNICA.md` como imagen: navegador → proxy HTTPS → Express (middleware → rutas → controlador → validación → modelo) → Prisma → MySQL. Patrón MVC en cliente y servidor.

### 5. Seguridad
bcrypt · JWT de 2 h · roles verificados en el servidor (401/403) · validación con allowlist · HTTPS y HSTS · CSP y cabeceras · solo `public/` expuesto · secretos en variables · logs sin tokens.

### 6. Demostración (en vivo)
Login → crear → consultar → cambiar estado → intento sin permiso (403) → eliminar como admin → reinicio y persistencia.

### 7. Pruebas
Captura con N pruebas Jest en verde, ESLint con 0 errores y `npm run smoke` contra la URL real. Tabla con los casos: credenciales inválidas, token ausente, rol insuficiente, datos incorrectos, registro inexistente.

### 8. Despliegue y monitoreo
Railway (Docker y MySQL administrado), variables en el panel, migraciones automáticas, `/api/salud` con estado de la base y commit, logs JSON con `requestId`, y plan de reversión con Redeploy o `git revert`.

### 9. Limitaciones y mejoras
Sin rate limiting en el login, token en sessionStorage, pruebas de integración con base simulada, plan gratuito con reposo, sin auditoría de cambios. Para cada una, la mejora propuesta.

### 10. Lecciones aprendidas y cierre
Ver `RETROALIMENTACION_Y_LECCIONES.md`: la prueba que detectó códigos duplicados, la clave que estaba escrita en el código, el localhost fijo en el cliente. Diferencia entre una solución académica y un servicio real. Preguntas.
