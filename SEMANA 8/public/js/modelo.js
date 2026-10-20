const API = "/api";

function token() {
    return sessionStorage.getItem("token") || "";
}

async function pedir(ruta, opciones = {}) {
    const respuesta = await fetch(`${API}${ruta}`, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            "Authorization": token() ? `Bearer ${token()}` : "",
            ...(opciones.headers || {})
        }
    });
    const cuerpo = await respuesta.json();
    if (respuesta.status === 401 && ruta.startsWith("/incidentes")) {
        cerrarSesion();
        window.dispatchEvent(new Event("sesion-expirada"));
        throw new Error("Tu sesión venció o dejó de ser válida. Inicia sesión nuevamente.");
    }
    if (respuesta.status === 403) {
        throw new Error("No tienes permisos para realizar esta acción con tu rol.");
    }
    if (!respuesta.ok) throw new Error(cuerpo.mensaje || "Error de la API");
    return cuerpo;
}

export function guardarSesion(datos) {
    sessionStorage.setItem("token", datos.token);
    sessionStorage.setItem("rol", datos.usuario.rol);
    sessionStorage.setItem("nombre", datos.usuario.nombre);
}

export function cerrarSesion() {
    sessionStorage.clear();
}

export function sesion() {
    return {
        token: token(),
        rol: sessionStorage.getItem("rol") || "",
        nombre: sessionStorage.getItem("nombre") || ""
    };
}

export function entrar(correo, password) {
    return pedir("/auth/login", { method: "POST", body: JSON.stringify({ correo, password }) });
}

export function obtenerIncidentes() {
    return pedir("/incidentes").then((cuerpo) => cuerpo.datos);
}

export function filtrarPorSeveridad(incidentes, severidad) {
    if (!severidad) return incidentes;
    return incidentes.filter((incidente) => incidente.severidad === severidad);
}

export function crearIncidente(datos) {
    return pedir("/incidentes", { method: "POST", body: JSON.stringify(datos) });
}

export function cambiarEstado(id, estado) {
    return pedir(`/incidentes/${id}`, { method: "PATCH", body: JSON.stringify({ estado }) });
}

export function eliminarIncidente(id) {
    return pedir(`/incidentes/${id}`, { method: "DELETE" });
}