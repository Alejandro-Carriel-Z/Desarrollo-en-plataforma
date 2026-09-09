# Mejoras de la Unidad I: SecureGuard

## Alcance de la actualización

El prototipo de gestión de incidentes fue transformado de una maqueta estática a una experiencia web interactiva. La interfaz ahora presenta una identidad visual más profesional, una jerarquía de información más clara y un flujo funcional para cargar, validar y registrar incidentes. El objetivo fue mantener una solución sencilla, portable y apropiada para un proyecto académico sin introducir un framework que ocultara la lógica solicitada.

La presentación utiliza las familias tipográficas **Space Grotesk** para títulos y **DM Sans** para lectura y controles. Esta combinación aporta contraste, personalidad y legibilidad. Se reorganizó la paleta alrededor de verde teal, blanco cálido y acentos coral/ámbar para comunicar operación, prioridad y alerta sin depender de un fondo oscuro uniforme. El encabezado incorpora una imagen contextual de análisis de ciberseguridad, una llamada a la acción y un indicador de estado operativo. También se añadieron tarjetas de métricas, tarjetas de incidentes, un panel de orientación SOC y una vista de detalle coherente con el caso `INC-002`.

## Arquitectura MVC ligera

La solución aplica una separación tipo MVC adaptada a JavaScript nativo. El **modelo** está en `js/modelo.js`: su responsabilidad es obtener los datos con `fetch` desde `incidentes.json` y construir objetos de nuevos incidentes. La **vista** está en `js/vista.js`: genera las tarjetas, actualiza las métricas, muestra el estado de carga y anuncia mensajes. Además, escapa el texto antes de insertarlo en el DOM, reduciendo el riesgo de interpretar como HTML un título escrito por el usuario. El **controlador** está en `js/controlador.js`: coordina el arranque, escucha el envío del formulario, valida los datos y actualiza el modelo en memoria y la vista.

Esta separación reduce el acoplamiento. Por ejemplo, cambiar el origen de datos por una API no obligaría a reescribir la plantilla de tarjetas, y modificar el diseño no alteraría las reglas de validación. Para el alcance de la actividad, el estado se mantiene durante la sesión del navegador. El flujo no requiere base de datos, pero deja una frontera clara para incorporarla en una siguiente etapa.

## Validación dinámica y accesibilidad

El formulario usa `novalidate` para delegar el comportamiento en una validación explícita. Se comprueba que el título tenga al menos cinco caracteres, que la descripción tenga al menos veinte, que severidad, tipo y fecha estén seleccionados, que el correo tenga una estructura válida y que la confirmación esté marcada. Cada error aparece junto al campo correspondiente, el campo recibe `aria-invalid` y el foco vuelve al primer control inválido. Cuando el formulario es correcto, se crea un identificador, se agrega el registro al inicio de la lista, se recalculan los indicadores y se anuncia el resultado.

La accesibilidad también se reforzó mediante `aria-label` en la navegación y el estado operativo, `aria-live="polite"` para cambios de carga y confirmaciones, textos alternativos para la imagen del encabezado y una clase de contenido solo para lectores de pantalla. Los controles mantienen estados de foco visibles y el diseño se adapta a pantallas pequeñas.

## Evidencia de funcionamiento

1. Abrir el proyecto mediante un servidor local, por ejemplo con `python -m http.server 8000` desde la carpeta `Proyecto`. Esto es necesario porque los navegadores bloquean un `fetch` de archivos JSON cuando se abre directamente con `file://`.
2. Visitar `http://localhost:8000/index.html`. El indicador debe cambiar de “Cargando datos...” a “3 casos sincronizados” y deben aparecer tres tarjetas renderizadas desde `incidentes.json`.
3. Enviar el formulario vacío o incompleto. Los mensajes aparecen junto a los campos, se marca el primer control inválido y el lector de pantalla recibe el anuncio de error.
4. Completar un reporte válido. La tarjeta nueva aparece al inicio, el total de incidentes aumenta a cuatro, se actualizan los casos abiertos y se anuncia “Incidente INC-xxx creado correctamente”.
5. Abrir `detalle.html` para comprobar la navegación, el caso `INC-002`, la fecha coherente y el diseño responsive.

La sintaxis fue comprobada con `node --check` para los tres módulos JavaScript, la estructura HTML/CSS no presenta diagnósticos en VS Code y el JSON fue parseado correctamente con tres registros. El resultado cumple la incorporación de JavaScript, Fetch, validación dinámica, renderizado simulado, mensajes ARIA y organización MVC solicitadas.
