const API = "/api/incidentes";

export const TIPOS = {
    phishing: "Phishing",
    malware: "Malware",
    acceso: "Acceso no autorizado",
    vulnerabilidad: "Vulnerabilidad"
};

export const ETIQUETAS_SEVERIDAD = {
    critica: "Crítica",
    alta: "Alta",
    media: "Media",
    baja: "Baja"
};

export const ESTADOS = [
    "abierto",
    "En investigación",
    "Contención en curso",
    "Resuelto",
    "Cerrado"
];

export function claveTipo(valor) {
    const texto = String(valor || "").trim();
    if (TIPOS[texto]) return texto;
    const hallada = Object.entries(TIPOS).find(([, etiqueta]) => etiqueta === texto);
    return hallada ? hallada[0] : texto;
}

async function leerCuerpo(respuesta) {
    try {
        return await respuesta.json();
    } catch (_error) {
        return {};
    }
}

async function enviar(url, opciones, fallback) {
    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            Accept: "application/json",
            ...(opciones.body ? { "Content-Type": "application/json" } : {}),
            ...(opciones.headers || {})
        }
    });
    const cuerpo = await leerCuerpo(respuesta);

    if (!respuesta.ok) {
        const error = new Error(cuerpo.mensaje || fallback);
        error.status = respuesta.status;
        error.detalles = cuerpo.detalles || null;
        throw error;
    }

    return cuerpo.datos;
}

export async function obtenerIncidentes(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.severidad) params.set("severidad", filtros.severidad);
    if (filtros.estado) params.set("estado", filtros.estado);
    if (filtros.tipo) params.set("tipo", filtros.tipo);

    const consulta = params.toString();
    const datos = await enviar(
        consulta ? `${API}?${consulta}` : API,
        { method: "GET" },
        "No fue posible cargar los incidentes desde el servidor."
    );
    return datos || [];
}

export async function obtenerIncidente(id) {
    const respuesta = await fetch(`${API}/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" }
    });
    const cuerpo = await leerCuerpo(respuesta);

    if (respuesta.status === 404) return null;
    if (!respuesta.ok) {
        const error = new Error(cuerpo.mensaje || "No fue posible consultar el incidente.");
        error.status = respuesta.status;
        error.detalles = cuerpo.detalles || null;
        throw error;
    }

    return cuerpo.datos;
}

export function crearIncidente(datos) {
    return enviar(API, {
        method: "POST",
        body: JSON.stringify(datos)
    }, "No se pudo registrar el incidente.");
}

export function actualizarIncidente(id, datos) {
    return enviar(`${API}/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(datos)
    }, "No se pudo actualizar el incidente.");
}

export function cambiarEstado(id, estado) {
    return enviar(`${API}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ estado })
    }, "No se pudo cambiar el estado.");
}

export function eliminarIncidente(id) {
    return enviar(`${API}/${encodeURIComponent(id)}`, {
        method: "DELETE"
    }, "No se pudo eliminar el incidente.");
}
