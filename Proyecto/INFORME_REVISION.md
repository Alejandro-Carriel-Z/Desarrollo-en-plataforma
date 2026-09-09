# Informe de revisión — Desarrollo de plataforma / Proyecto SecureGuard

Fecha: 2026-09-08
Alcance revisado:
- `Desarrollo de plataforma/Proyecto/` (versión MVC actual: `index.html`, `detalle.html`, `incidentes.json`, `css/estilos.css`, `js/modelo.js`, `js/vista.js`, `js/controlador.js`, `MEJORAS_UNIDAD_I.md`)
- `Tareas/Proyecto incidentes ciberseguridad Semana 1/` (versión inicial Semana 1, solo HTML/CSS)
- Documentos de agentes: `Agentes_IA_Desarrollo_y_Seguridad.md`, `Instrucciones_Agentes_VSCode.md`

Verificación ejecutada:
- `node --check` en los 3 módulos JS: OK (sin errores de sintaxis).
- `python -c json.load(incidentes.json)`: OK, 3 registros.
- Revisión manual de HTML, CSS, validación, fetch, accesibilidad y coherencia de datos.

## Hallazgos y estado

### E1 — Ruta de `fetch` frágil en `js/modelo.js` [CORREGIDO]
Antes: `const FUENTE_INCIDENTES = '../incidentes.json'`
Problema: `fetch` se resuelve respecto al documento (`index.html`), no al archivo JS. Con servidor en `Proyecto/` funciona por casualidad (`/index.html` + `../incidentes.json` → `/incidentes.json`), pero falla si se sirve desde la raíz del entorno o subruta.
Corrección: `const FUENTE_INCIDENTES = './incidentes.json'`

### E2 — IDs con alta probabilidad de colisión en `crearIncidente()` [CORREGIDO]
Antes: `` `INC-${String(Date.now()).slice(-3)}` `` → solo 1000 valores, dos reportes en el mismo segundo/milisegundos cercanos colisionan.
Corrección: `INC-<6 últimos de timestamp>-<aleatorio 000-999>` + `trim()` en título/descripción.

### E3 — El listener `input` no limpiaba errores [CORREGIDO]
Antes: `formulario.addEventListener('input', () => mostrarErrores({}))`
Problema: `mostrarErrores({})` itera `Object.entries({})` = vacío, no borra ningún mensaje. Los errores quedaban fijos hasta el próximo submit.
Corrección: limpiar explícitamente los 7 campos con `CAMPOS_FORMULARIO`.

### E4 — Validación incompleta en `controlador.js` [CORREGIDO]
Faltaba:
- `maxlength` (HTML permite 100 en título y 500 en descripción, JS solo validaba mínimo).
- Fecha futura (permitía 2030).
- `correo` con espacios (`" a@b.com "` fallaba el regex).
Corrección: validación de máximo, comparación `fecha > hoy`, y `correo.trim()`.

### E5 — `escapar()` no toleraba `null/undefined` [CORREGIDO]
Antes: `elemento.textContent = texto` → con campo faltante mostraba `"undefined"`.
Corrección: `String(texto ?? '')`.

### E6 — Inconsistencia de `tipo` entre `incidentes.json` y formulario [CORREGIDO]
JSON inicial: `"Phishing"`, `"Acceso no autorizado"`, `"Vulnerabilidad"` (capitalizados).
Formulario: `phishing`, `malware`, `acceso`, `vulnerabilidad` (minúsculas). Los nuevos registros se veían distintos.
Corrección: mapa `etiquetasTipo` en `vista.js` para mostrar etiqueta legible.

### E7 — `detalle.html` estático, sin parámetro por incidente [MITIGADO]
Todos los “Ver detalle ↗” apuntaban a `detalle.html` (siempre INC-002).
Corrección parcial: ahora enlazan a `detalle.html?id=INC-xxx`. Queda pendiente hacer que `detalle.html` lea `?id=` y renderice dinámicamente; actualmente sigue mostrando INC-002 fijo. Se deja como mejora futura para no cambiar el alcance de la Unidad I.

### E8 — Lectura frágil del checkbox [CORREGIDO]
Antes: `formulario.confirmacion.checked` (acceso por nombre, frágil si cambia el DOM).
Corrección: `formulario.querySelector('#confirmacion').checked`.

## Observaciones no bloqueantes (no modificadas)
- `Tareas/.../Semana 1/index.html`: `<H2>` en mayúsculas, `class="Campo"` vs `class="campo"` (CSS distingue mayúsculas), `form action="#" method="post"` sin JS, severidades no coinciden con `detalle.html` (lista dice Media/Baja, detalle dice Crítica), typo “Contenido” y contenido duplicado en “Vista rápida”. Es entrega antigua, se conserva como evidencia.
- `Tareas/.../detalle.html:40`: fecha `01/09/2026` vs `Proyecto/detalle.html:19` fecha `02/09/2026` para el mismo INC-002. La versión MVC (02/09) coincide con `incidentes.json` (`2026-09-02`); usar esa como canónica.
- `vista.js: mostrarErrores`: `setAttribute('aria-invalid', Boolean(...))` funciona pero es más claro usar `"true"/"false"`. No se cambió por ser cosmético.
- `actualizarMetricas`: `estado !== 'Resuelto'` es sensible a mayúsculas. Funciona con los datos actuales; si se agregan estados nuevos, normalizar con `toLowerCase()`.
- `estilos.css`: usa imagen externa Unsplash en `.hero-media`. Si no hay internet, el hero queda en color sólido `#153735` (degradado de respaldo OK).

## Archivos modificados en este informe
- `Proyecto/js/modelo.js` (E1, E2)
- `Proyecto/js/vista.js` (E5, E6, E7 parcial)
- `Proyecto/js/controlador.js` (E3, E4, E8)

## Cómo validar
1. `cd "Desarrollo de plataforma/Proyecto"` + `python -m http.server 8000`
2. Abrir `http://localhost:8000/index.html` → debe decir “3 casos sincronizados”.
3. Enviar formulario vacío → errores por campo + foco en el primero.
4. Escribir en un campo → errores se limpian (E3).
5. Probar título >100, descripción >500, fecha futura, correo con espacios → mensajes correspondientes (E4).
6. Crear reporte válido → nueva tarjeta al inicio con `INC-xxxxxx-xxx` único y tipo legible (E2, E6).
