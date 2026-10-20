# SecureGuard — Manual de usuario

**Versión:** 8.0.0 · **Fecha:** 19/10/2026 · **URL:** `https://<tu-servicio>.up.railway.app`

## 1. ¿Qué es SecureGuard?
Es una plataforma web para que un equipo de seguridad registre incidentes, los clasifique por severidad y prioridad y les dé seguimiento hasta resolverlos.

## 2. Perfiles
| Perfil | Puede |
|---|---|
| Analista | Iniciar sesión, ver, buscar y filtrar incidentes, y registrar nuevos |
| Supervisor | Ver incidentes y cambiar su estado (En investigación → Contención en curso → Resuelto) |
| Administrador | Todo lo anterior, además de editar el incidente completo y eliminarlo |

Cuentas de demostración: `analista@secureguard.edu`, `supervisor@secureguard.edu` y `admin@secureguard.edu`. El docente recibe las claves por un canal privado; no se publican.

## 3. Acceso
1. Abre la URL. Debe aparecer el candado (HTTPS).
2. Escribe tu correo y contraseña y pulsa **Iniciar sesión**.
3. Si los datos son incorrectos verás *"Credenciales inválidas"*. La sesión dura 2 horas; al vencer, el sistema te pide entrar de nuevo.

## 4. Registrar un incidente (analista o admin)
1. Completa el formulario **Registrar incidente** con estas reglas:
   - **Título:** 5 a 100 caracteres.
   - **Descripción:** 10 a 500 caracteres.
   - **Severidad:** crítica, alta, media o baja.
   - **Tipo.**
   - **Fecha:** no puede ser futura.
   - **Correo** de contacto, con formato válido.
2. Pulsa **Registrar**. El sistema asigna un código `INC-###` y el incidente aparece en la lista.
3. Si un campo no cumple, verás *"Validación fallida"* con el detalle del campo.

## 5. Buscar y consultar
- Usa el filtro de **severidad** sobre la lista. La API también admite filtrar por `prioridad` y `estado` con parámetros de consulta.
- Pulsa una tarjeta o **Ver detalle** para abrir la página del incidente.
- Si escribes un código que no existe, verás *"Incidente no encontrado"*.

## 6. Actualizar el estado (supervisor o admin)
En la tarjeta o el detalle, elige el nuevo estado y confirma. Los estados válidos son En investigación, Contención en curso y Resuelto.

## 7. Eliminar o cerrar (admin)
- **Eliminar o cerrar:** pulsa eliminar en la tarjeta y confirma. Esta acción es definitiva.
- **Reemplazo completo (PUT):** está disponible en la API para el administrador (`PUT /api/incidentes/:id`), pero no tiene pantalla propia. Es una limitación declarada.

## 8. Mensajes y solución de problemas
| Mensaje / síntoma | Causa | Qué hacer |
|---|---|---|
| Credenciales inválidas | Correo o clave incorrectos | Revisa mayúsculas y vuelve a intentar |
| Sesión vencida / Token inválido | Pasaron 2 h o el token fue alterado | Inicia sesión otra vez |
| Permiso insuficiente | Tu rol no permite esa acción | Pide la acción a un supervisor o admin |
| Validación fallida | Un campo no cumple las reglas | Corrige el campo indicado |
| La página tarda en cargar la primera vez | El hosting gratuito estaba en reposo | Espera unos segundos y recarga |
| Error interno del servidor (con un código `requestId`) | Fallo en el servidor | Envía el `requestId` al administrador para ubicar el log |

## 9. Buenas prácticas
- No registres datos personales reales en la demostración.
- Cierra sesión en equipos compartidos.
- Nunca compartas capturas donde se vea tu token.
