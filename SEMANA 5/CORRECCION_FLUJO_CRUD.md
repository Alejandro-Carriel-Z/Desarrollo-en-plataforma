# Corrección del flujo CRUD — SecureGuard

**Proyecto:** SecureGuard · Semana 5
**Autor:** Alejandro Carriel · PUCE · Desarrollo de plataformas

Este documento explica dos cosas: qué ya cumplía el proyecto antes de esta corrección y qué se cambió para cerrar el flujo de editar, cambiar estado y eliminar.

## 1. Verificación previa

### Consume API, maneja estado y renderiza datos correctamente

Esto **ya se cumplía en la parte principal**, no en el ciclo completo.

| Qué se pedía | Antes de la corrección | ¿Cumplía? |
|---|---|---|
| El listado sale de la API (`GET /api/incidentes`) | `controlador.js` pedía los casos al arrancar y los guardaba en el arreglo `incidentes` | Sí |
| El detalle sale de la API (`GET /api/incidentes/:id`) | `detalle.js` leía `?id=` y pintaba título, fecha, estado, reportante y descripción | Sí |
| El alta persiste en el servidor (`POST`) | El formulario esperaba la respuesta y recién ahí actualizaba la lista | Sí |
| El cliente conserva estado | El arreglo `incidentes` era la fuente para volver a pintar tarjetas y métricas | Sí, solo para listar y crear |
| Los datos se renderizan | Las tarjetas mostraban id, severidad, tipo, estado y fecha que venían del JSON | Sí, con un error de métricas |
| Editar, cambiar estado y eliminar | No había controles ni funciones `fetch` para eso | No |

El fallo concreto de render era este: dos métricas estaban fijas en el HTML (`12` resueltos y `18m` de respuesta) y los abiertos se contaban con `estado !== "Resuelto"`. Un caso `Cerrado` seguía figurando como abierto.

### Implementa CRUD, filtros, validaciones y respuestas coherentes

El **servidor ya cubría casi todo el contrato**. El cliente no lo usaba entero.

| Operación | Servidor antes | Cliente antes |
|---|---|---|
| Crear | `POST` con validación y `201 { ok, datos }` | Conectado |
| Leer lista y detalle | `GET` con `{ ok, total, datos }` o `{ ok, datos }` | Conectado |
| Actualizar parcial | `PATCH` | No se llamaba |
| Reemplazar | **No existía `PUT`** | No se llamaba |
| Eliminar | `DELETE` con cierre lógico (`estado = Cerrado`) y `200 { ok, datos }` | No se llamaba |
| Filtros | `severidad`, `prioridad` y `estado` en el query | Solo severidad |
| Validación | `400 { ok: false, mensaje, detalles }` | En el formulario de alta, alineada con el servidor |
| No encontrado | `404 { ok: false, mensaje }` | El detalle lo trataba |

Había tres huecos que hacían incoherente el `PATCH`, aunque la ruta existiera:

1. El cuerpo del formulario manda `correo`, y Prisma no tiene esa columna. Un `PATCH` con el mismo JSON del alta respondía **500**, no un `400` con `detalles`.
2. Un correo vacío pasaba la validación del API (`if (correo && ...)`). El navegador lo frenaba; el servidor, no.
3. Severidad, tipo y estado no se contrastaban con una lista permitida.

Conclusión previa: el criterio de consumo y render **se cumplía para listar y crear**. El criterio de CRUD **se cumplía en el servidor para GET, POST, PATCH y DELETE**, pero no de punta a punta, porque el cliente no editaba ni borraba y el servidor no publicaba `PUT`.

## 2. Qué se cambió y por qué

### Contrato HTTP

| Método | Uso en la interfaz | Respuesta |
|---|---|---|
| `GET /api/incidentes` | Listado. Query opcional: `severidad`, `estado`, `tipo`, `prioridad` | `200 { ok, total, datos }` |
| `GET /api/incidentes/:id` | Detalle y precarga del formulario de edición | `200 { ok, datos }` o `404` |
| `POST /api/incidentes` | Crear reporte | `201 { ok, datos }` o `400 { ok: false, mensaje, detalles }` |
| `PUT /api/incidentes/:id` | Guardar la edición completa del formulario | `200 { ok, datos }`, `400` o `404` |
| `PATCH /api/incidentes/:id` | Cambiar solo el estado (`{ "estado": "Resuelto" }`) | `200`, `400` o `404` |
| `DELETE /api/incidentes/:id` | Botón Eliminar. No borra la fila: deja `estado` en `Cerrado` | `200 { ok, datos }` o `404` |

`PUT` y `PATCH` no son lo mismo. `PUT` exige título, descripción, severidad, tipo, fecha y correo, igual que el alta. `PATCH` valida únicamente los campos que viajan en el cuerpo. Un `PATCH` vacío responde `400` con el mensaje `No hay campos para actualizar.`

El JSON mal formado ahora responde `400 { ok: false, mensaje: "JSON inválido" }` en lugar de un error genérico. Si MySQL no está levantado, la API responde `503 { ok: false, mensaje: "No se pudo conectar con la base de datos." }` y no devuelve el stack de Prisma. Un `PUT` o `PATCH` con datos inválidos responde `400` antes de consultar la base.

### Servidor

- `src/domain/incidente.js` concentra las listas de severidad, tipo y estado, y normaliza el tipo (`phishing` y `Phishing` terminan guardados como `Phishing`).
- `src/application/incidentes.service.js` valida el alta y la edición con las mismas reglas que el formulario. Traduce `correo` a `reportante` antes de tocar la base.
- `src/models/incidentes.model.js` solo escribe columnas reales. Un campo extra del cliente ya no llega a Prisma.
- `src/routes/incidentes.routes.js` publica `PUT` junto a `PATCH` y `DELETE`.
- `src/controllers/incidentes.controller.js` separa el reemplazo (`PUT`, validación completa) de la actualización parcial (`PATCH`).

El cierre lógico de `DELETE` se conservó. Ya estaba documentado en `CAMBIOS_Y_MEJORAS.md`: la fila sigue en MySQL para no perder la bitácora del caso.

### Cliente

`public/js/modelo.js` es la única capa que habla con la API:

- `obtenerIncidentes({ severidad, estado, tipo })` arma el query string.
- `crearIncidente` usa `POST`.
- `actualizarIncidente` usa `PUT`.
- `cambiarEstado` usa `PATCH`.
- `eliminarIncidente` usa `DELETE`.

Si la respuesta no es exitosa, se lanza un error con `mensaje`, `status` y `detalles`. El controlador pinta `detalles` debajo del campo que falló.

`public/js/controlador.js` guarda dos estados de interfaz:

- `incidentesVisibles`: lo último que devolvió el listado filtrado.
- `editandoId`: `null` en modo alta, o el código del caso cuando el formulario está editando.

Editar carga el caso en el mismo formulario y cambia el botón a **Guardar cambios**. Cancelar vuelve al alta. Cambiar el `<select>` de estado de una tarjeta llama a `PATCH` y vuelve a pedir el listado, así el filtro activo y las métricas quedan iguales a la base. Eliminar pide confirmación, llama a `DELETE` y el caso permanece visible como `Cerrado`.

Las métricas (total, abiertos, resueltos, cerrados) salen del listado completo, no de números escritos en el HTML. Si hay filtro, la grilla muestra solo el resultado y el texto de carga dice cuántos casos quedaron y cuántos hay en total. Abierto significa cualquier estado distinto de `Resuelto` y de `Cerrado`.

`public/detalle.html` tiene los mismos tres controles: cambiar estado, ir a editar (`index.html?editar=ID`) y eliminar.

## 3. Cómo se cumplen los criterios ahora

**Consume API, maneja estado y renderiza datos correctamente.** El listado, el detalle, el alta, la edición, el cambio de estado y el cierre leen o escriben en `/api/incidentes`. Después de cada escritura el cliente vuelve a pedir los datos y pinta tarjetas, detalle y métricas con esa respuesta.

**Implementa CRUD, filtros, validaciones y respuestas coherentes.** Crear, leer, reemplazar, actualizar parcialmente y cerrar están en la ruta y en la interfaz. Los filtros de severidad y estado viajan como query. La validación del navegador y la del servidor rechazan lo mismo (longitud, severidad, tipo, fecha no futura, correo). El error siempre tiene la forma `{ ok: false, mensaje, detalles }` y el éxito `{ ok: true, datos }`.

## 4. Cómo probarlo

Con el servidor en marcha (`npm start`):

1. Abre `http://localhost:3000`. El listado y las cuatro métricas deben coincidir con `GET /api/incidentes`.
2. Crea un reporte vacío y uno válido. El vacío no sale del navegador. El válido aparece sin recargar la página.
3. Pulsa **Editar**, cambia el título y guarda. En la pestaña Red debe verse `PUT /api/incidentes/INC-...`.
4. Cambia el estado de la tarjeta. Debe verse `PATCH` con cuerpo `{ "estado": "..." }`.
5. Pulsa **Eliminar** y confirma. Debe verse `DELETE` y el estado del caso queda en `Cerrado`. El botón Eliminar de ese caso queda deshabilitado.
6. Filtra por severidad y por estado. La grilla cambia; las métricas siguen siendo del total.
7. En el detalle (`detalle.html?id=INC-...`) repite cambio de estado y eliminación.

Ejemplos de respuesta:

```http
PUT /api/incidentes/INC-001
Content-Type: application/json

{ "titulo": "Acceso irregular en VPN", "descripcion": "Se detectaron ingresos fuera del horario habitual del equipo.", "severidad": "alta", "tipo": "acceso", "fecha": "2026-09-16", "correo": "ana@empresa.com" }
```

```json
{ "ok": true, "datos": { "id": "INC-001", "titulo": "Acceso irregular en VPN", "estado": "En investigación" } }
```

```http
PATCH /api/incidentes/INC-001
Content-Type: application/json

{ "estado": "Resuelto" }
```

```http
DELETE /api/incidentes/INC-001
```

```json
{ "ok": true, "datos": { "id": "INC-001", "estado": "Cerrado" } }
```

## 5. Qué se pudo comprobar en esta máquina

El contenedor `mysql-incidentes` tenía que estar encendido. Además, el driver de MariaDB no completaba la conexión con MySQL 8 hasta activar `allowPublicKeyRetrieval` en `src/lib/prisma.js`: sin eso el pool esperaba 10 segundos y la API respondía 503. Con eso corregido se comprobó el ciclo real: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` (el caso queda en `Cerrado`) y el filtro por severidad y estado. La página en el navegador pintó las tarjetas con Editar, el selector de estado y Eliminar.

Antes de arreglar la conexión también se había comprobado:

- `POST`, `PUT` y `PATCH` con datos inválidos responden `400` y `detalles` por campo, sin crear ni modificar filas.
- Un `PATCH` sin campos responde `400` con `No hay campos para actualizar.`
- Un JSON mal formado responde `400` con `JSON inválido`.
- `GET /api/incidentes` con la base apagada responde `503` y el mensaje `No se pudo conectar con la base de datos.` El navegador muestra ese texto en el panel.
- El HTML de inicio incluye los filtros, las métricas vivas y el botón de cancelar la edición. El detalle incluye cambiar estado, editar y eliminar.
- `modelo.js` publicado por el servidor declara `PUT`, `PATCH` y `DELETE`.

Cuando MySQL esté arriba, `npm start` y los siete pasos de la sección 4 cierran la prueba con datos reales.

Un alta inválida no crea filas:

```json
{ "ok": false, "mensaje": "Validación fallida", "detalles": { "titulo": "Escribe un título de al menos 5 caracteres.", "correo": "Introduce un correo válido." } }
```
