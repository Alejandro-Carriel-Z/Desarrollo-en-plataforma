const API = "/api/incidentes";

export async function obtenerIncidentes() {
    const respuesta = await fetch(API, {
        headers: { Accept: "application/json" }
    });

    if (!respuesta.ok) {
        throw new Error("No fue posible cargar los incidentes desde el servidor.");
    }

    const cuerpo = await respuesta.json();
    return cuerpo.datos;
}

export async function obtenerIncidente(id) {
    const respuesta = await fetch(`${API}/${encodeURIComponent(id)}`, {
        headers: { Accept: "application/json" }
    });

    if (respuesta.status === 404) return null;
    if (!respuesta.ok) {
        throw new Error("No fue posible consultar el incidente.");
    }

    const cuerpo = await respuesta.json();
    return cuerpo.datos;
}

export async function crearIncidente(datos) {
    const respuesta = await fetch(API, {
        method: "POST",
        headers: {
            "Content-type": "application/json",
            Accept: "application/json"
        },
        body: JSON.stringify(datos)
    });

    const cuerpo = await respuesta.json();
    if (!respuesta.ok) {
        const error = new Error(cuerpo.mensaje || "No se pudo registrar el incidente.");
        error.detalles = cuerpo.detalles || {};
        throw error;

    }

    return cuerpo.datos;
}