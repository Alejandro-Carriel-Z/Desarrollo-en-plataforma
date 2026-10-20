# SecureGuard — Manual de usuario

| Versión | Fecha | URL |
|---|---|---|
| 8.0.0 | 20/10/2026 | `https://<tu-servicio>.up.railway.app` (en local: `https://localhost:3000`) |

## Contenido
1. Qué es SecureGuard · 2. Requisitos · 3. Acceso e inicio de sesión · 4. Roles y permisos · 5. La pantalla principal · 6. Registrar un incidente · 7. Buscar y filtrar · 8. Ver el detalle · 9. Cambiar el estado · 10. Editar un incidente · 11. Cerrar o eliminar · 12. Estados y severidades · 13. Cerrar sesión y vencimiento · 14. Mensajes de error · 15. Solución de problemas · 16. Preguntas frecuentes · 17. Buenas prácticas

## 1. Qué es SecureGuard
SecureGuard es una plataforma web donde un equipo de seguridad (SOC) **registra incidentes** como phishing, malware, accesos no autorizados o vulnerabilidades, los **clasifica** por severidad y prioridad y les **da seguimiento** hasta resolverlos. Cada persona entra con su cuenta y solo puede hacer lo que su rol permite.

## 2. Requisitos
- Un navegador actualizado (Chrome, Edge o Firefox) con JavaScript activo.
- Conexión a internet y la URL de la plataforma.
- Una cuenta asignada por el administrador.
- En el entorno local, el navegador avisa que el certificado no es confiable porque es autofirmado: elige **Avanzado → Continuar**. Esto solo pasa en local; en la URL pública el certificado es válido y aparece el candado.

## 3. Acceso e inicio de sesión
1. Abre la URL y verifica que la dirección empiece con `https://`.
2. En la caja **Ingresar**, escribe tu **correo** y tu **contraseña**.
3. Pulsa **Entrar**.
4. Arriba aparece tu nombre y rol (por ejemplo, *Ana Analista · analista*) y se cargan los incidentes. El aviso dice *"N incidentes cargados desde MySQL"*.

**Cuentas de demostración**
| Rol | Correo | Contraseña |
|---|---|---|
| Analista | `analista@secureguard.edu` | la entrega el docente o el administrador de forma privada |
| Supervisor | `supervisor@secureguard.edu` | ídem |
| Administrador | `admin@secureguard.edu` | ídem |

> Las contraseñas no se publican. En producción las define el administrador con variables de entorno al ejecutar `npm run seed`.

## 4. Roles y permisos
| Acción | Analista | Supervisor | Administrador |
|---|:-:|:-:|:-:|
| Ver la lista y los resúmenes | ✔ | ✔ | ✔ |
| Filtrar por severidad | ✔ | ✔ | ✔ |
| Registrar un incidente | ✔ | ✖ | ✔ |
| Cambiar el estado | ✖ | ✔ | ✔ |
| Editar el incidente completo (API) | ✖ | ✖ | ✔ |
| Eliminar | ✖ | ✖ | ✔ |

La interfaz **solo muestra los botones** que tu rol puede usar. Aunque alguien intente la acción por otro medio, el servidor la rechaza con *"No tienes permisos para realizar esta acción con tu rol"*.

## 5. La pantalla principal
- **Caja de acceso:** sesión actual y botón **Salir**.
- **Resumen:** total de incidentes e incidentes abiertos (los que no están *Resuelto*).
- **Listado de incidentes:** tarjetas con código (`INC-###`), severidad, título, tipo y estado, fecha y los botones según el rol.
- **Filtro de severidad**, encima del listado.
- **Registrar incidente:** el formulario de alta.
- **Barra de estado:** muestra mensajes de confirmación o error.

## 6. Registrar un incidente (analista o administrador)
1. Ve a la sección **Registrar incidente**.
2. Completa los campos:
   | Campo | Regla |
   |---|---|
   | Título | 5 a 100 caracteres |
   | Descripción | **20** a 500 caracteres |
   | Severidad | Crítica, Alta, Media o Baja |
   | Tipo | Phishing, Malware, Acceso no autorizado o Vulnerabilidad |
   | Fecha | Fecha del incidente; no puede ser futura |
   | Correo | Correo de contacto del reportante, con formato válido |
3. Marca la casilla de **confirmación**.
4. Pulsa **Crear reporte**.
5. Resultado: aparece *"Incidente guardado en MySQL: <título>"* y la tarjeta nueva sale al inicio con un código `INC-###` asignado por el sistema. El estado inicial siempre es **En investigación** y la prioridad queda igual a la severidad.
6. Si algo está mal, el campo se marca en rojo con la explicación (por ejemplo, *"La descripción debe tener al menos 20 caracteres."*) y no se envía nada.

## 7. Buscar y filtrar
1. En **Listado de incidentes**, abre el selector **Severidad**.
2. Elige Crítica, Alta, Media o Baja; la lista se filtra al instante.
3. Elige **Todas** para quitar el filtro.
4. Si no hay coincidencias, verás *"No hay incidentes con ese filtro."*

Usuarios avanzados: la API también filtra por prioridad y estado, por ejemplo `GET /api/incidentes?estado=Resuelto`.

## 8. Ver el detalle
- Cada tarjeta muestra los datos principales del incidente.
- La página **Caso destacado** (`detalle.html`) es una ficha de ejemplo que explica cómo se documenta un caso; muestra un caso de muestra, no los datos en vivo.
- Para ver todos los datos de un incidente concreto, el sistema ofrece `GET /api/incidentes/INC-###`. Si el código no existe, responde *"Incidente no encontrado"*.

## 9. Cambiar el estado (supervisor o administrador)
1. Busca la tarjeta del incidente.
2. Pulsa **Cambiar estado**.
3. El incidente pasa a **Contención en curso** y aparece *"Estado actualizado"*.
4. Para marcarlo como **Resuelto**, desde esta versión hay que usar la API: `PATCH /api/incidentes/INC-###` con `{"estado":"Resuelto"}` (limitación conocida; ver §16).

## 10. Editar un incidente (administrador)
La edición completa (título, descripción, severidad, prioridad, estado, tipo y fecha) está disponible para el administrador mediante `PUT /api/incidentes/INC-###` con **todos** esos campos. Esta versión no tiene formulario de edición en pantalla. Si falta algún campo o se envía uno no permitido, la respuesta es *"Validación fallida"*.

## 11. Cerrar o eliminar un incidente (administrador)
1. En la tarjeta, pulsa **Eliminar**.
2. El incidente desaparece de la lista y se muestra *"Incidente eliminado"*.
3. **Atención:** la eliminación es **definitiva**. Para "cerrar" un caso sin borrarlo, cambia su estado a **Resuelto**, que es lo recomendado para conservar la evidencia.

## 12. Estados y severidades
**Estados** (ciclo de vida):
| Estado | Significado |
|---|---|
| En investigación | Recién registrado; se está analizando (estado inicial) |
| Contención en curso | Se confirmó y se están aplicando medidas para frenarlo |
| Resuelto | Contenido y corregido; el caso queda cerrado (no cuenta como abierto) |

**Severidades:**
| Severidad | Cuándo usarla | Ejemplo |
|---|---|---|
| Crítica | Impacto grave e inmediato en sistemas o datos | Ransomware en un servidor |
| Alta | Compromiso probable o activo | Cuenta comprometida |
| Media | Riesgo real pero controlado | Phishing reportado sin clics |
| Baja | Hallazgo menor o informativo | Escaneo de puertos bloqueado |

La **prioridad** usa los mismos valores e indica el orden de atención; si no se especifica, es igual a la severidad.

## 13. Cerrar sesión y vencimiento
- Pulsa **Salir** en la caja de acceso; la lista se vacía y vuelves a *"Sin sesión"*.
- La sesión vive solo en esa pestaña: si cierras la pestaña o el navegador, tienes que entrar de nuevo.
- La sesión **vence a las 2 horas**. Al vencer verás *"Tu sesión venció o dejó de ser válida. Inicia sesión nuevamente."* y se te lleva al login.
- Si el administrador desactiva tu cuenta, la sesión deja de funcionar de inmediato.

## 14. Mensajes de error
| Mensaje | Qué significa | Qué hacer |
|---|---|---|
| Credenciales inválidas | Correo o contraseña incorrectos, o cuenta desactivada | Revisa los datos; si persiste, contacta al administrador |
| Ingresa para cargar los incidentes | No has iniciado sesión | Inicia sesión |
| Tu sesión venció o dejó de ser válida | Pasaron 2 h, el token se alteró o la cuenta se desactivó | Inicia sesión nuevamente |
| No tienes permisos para realizar esta acción con tu rol | Tu rol no permite esa operación (403) | Pide la acción a un supervisor o administrador |
| El formulario tiene errores. Revisa los campos marcados. | Algún campo no cumple las reglas | Corrige los campos en rojo |
| Validación fallida | El servidor rechazó los datos (400) | Revisa el campo indicado |
| Incidente no encontrado | El código no existe o fue eliminado (404) | Verifica el código |
| Ruta no encontrada | La dirección no existe (404) | Vuelve a la página principal |
| JSON inválido | La petición a la API está mal formada | Corrige el cuerpo (solo uso por API) |
| Error interno del servidor + `requestId` | Fallo del servidor (500) o base no disponible | Reintenta; si sigue, envía el `requestId` al administrador |

## 15. Solución de problemas
| Problema | Causa probable | Solución |
|---|---|---|
| La página tarda la primera vez | El hosting gratuito estaba en reposo | Espera unos segundos y recarga |
| "La conexión no es privada" en local | Certificado autofirmado | Avanzado → Continuar (solo en local) |
| No aparecen incidentes después de entrar | La base no está disponible o el filtro está activo | Pon el filtro en **Todas**; consulta `/api/salud` (debe decir `conectada`) |
| No veo el botón Eliminar o Cambiar estado | Tu rol no lo permite | Normal; ver §4 |
| No puedo registrar siendo supervisor | El supervisor no crea incidentes | Pide a un analista que lo registre |
| Me saca de la sesión constantemente | El token venció o cambiaste de pestaña | Entra de nuevo; la sesión es por pestaña |
| La fecha da error | Fecha futura | Usa la fecha real del incidente |

## 16. Preguntas frecuentes
- **¿Puedo recuperar un incidente eliminado?** No, la eliminación es definitiva. Usa *Resuelto* para cerrar.
- **¿Por qué el código es INC-### y no puedo elegirlo?** Lo asigna el servidor para que sea único.
- **¿Cómo marco un caso como Resuelto?** En esta versión, el botón lo pasa a *Contención en curso*; *Resuelto* se fija por la API (mejora planificada: selector de estado).
- **¿Mis datos viajan seguros?** Sí, por HTTPS. Las contraseñas se guardan cifradas con un hash irreversible.
- **¿Se guarda quién creó el incidente?** Se guarda el reportante o correo; no hay historial de cambios por usuario (mejora planificada).
- **¿Puedo usarlo en el celular?** Sí, desde el navegador del móvil; revisa la vista antes de la demostración.
- **¿Puedo cambiar mi contraseña?** No desde la interfaz; lo hace el administrador.

## 17. Buenas prácticas
- No registres datos personales reales durante la demostración.
- Cierra sesión en equipos compartidos.
- No compartas capturas que muestren tokens, contraseñas o la pestaña *Application → Session Storage*.
- Describe el incidente de forma objetiva: qué pasó, cuándo, qué sistemas afectó y qué se hizo.
