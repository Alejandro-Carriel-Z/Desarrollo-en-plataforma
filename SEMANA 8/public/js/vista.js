import { ESTADOS_SELECCIONABLES } from "./modelo.js";

const NOMBRES = { critica: "Crítica", alta: "Alta", media: "Media", baja: "Baja" };

function boton(texto, datos, deshabilitado = false) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "button button-small";
    b.textContent = texto;
    Object.assign(b.dataset, datos);
    b.disabled = deshabilitado;
    return b;
}

// Render seguro: todo dato de la API se escribe con textContent, nunca con innerHTML.
export function pintarIncidentes(incidentes, contenedor, rol) {
    if (!incidentes.length) {
        const mensaje = document.createElement("p");
        mensaje.textContent = "No hay incidentes con ese filtro.";
        contenedor.replaceChildren(mensaje);
        return;
    }

    const tarjetas = incidentes.map((incidente) => {
        const cerrado = incidente.estado === "Cerrado";
        const severidad = Object.hasOwn(NOMBRES, incidente.severidad) ? incidente.severidad : "media";
        const tarjeta = document.createElement("article");
        tarjeta.className = `incident-card ${severidad}${cerrado ? " cerrado" : ""}`;

        const encabezado = document.createElement("header");
        const codigo = document.createElement("span");
        codigo.textContent = incidente.id;
        const insignia = document.createElement("span");
        insignia.className = "badge";
        insignia.textContent = NOMBRES[incidente.severidad] || incidente.severidad;
        encabezado.append(codigo, insignia);

        const titulo = document.createElement("h3");
        titulo.textContent = incidente.titulo;
        const detalle = document.createElement("p");
        detalle.textContent = `${incidente.tipo} · ${incidente.estado}`;

        const pie = document.createElement("footer");
        pie.className = "card-meta";
        const fecha = document.createElement("time");
        fecha.dateTime = incidente.fecha;
        fecha.textContent = incidente.fecha;
        const enlace = document.createElement("a");
        enlace.href = `detalle.html?id=${encodeURIComponent(incidente.id)}`;
        enlace.textContent = "Ver detalle";
        pie.append(fecha, enlace);

        const acciones = document.createElement("div");
        acciones.className = "card-actions";
        if (rol === "supervisor" || rol === "admin") {
            const selector = document.createElement("select");
            selector.dataset.selectorEstado = incidente.id;
            selector.setAttribute("aria-label", `Estado de ${incidente.id}`);
            for (const estado of ESTADOS_SELECCIONABLES) {
                const opcion = document.createElement("option");
                opcion.value = estado;
                opcion.textContent = estado;
                opcion.selected = estado === incidente.estado;
                selector.append(opcion);
            }
            selector.disabled = cerrado;
            acciones.append(selector, boton("Aplicar estado", { estado: incidente.id }, cerrado));
        }
        if (rol === "admin") {
            acciones.append(
                boton("Editar", { editar: incidente.id }),
                boton(cerrado ? "Cerrado" : "Cerrar", { borrar: incidente.id }, cerrado)
            );
        }

        tarjeta.append(encabezado, titulo, detalle, pie);
        if (acciones.childElementCount) tarjeta.append(acciones);
        return tarjeta;
    });
    contenedor.replaceChildren(...tarjetas);
}

export function pintarResumen(incidentes) {
    const total = document.querySelector("#total-incidentes");
    const abiertos = document.querySelector("#incidentes-abiertos");
    if (!total || !abiertos) return;
    total.textContent = String(incidentes.length);
    abiertos.textContent = String(incidentes.filter((i) => i.estado !== "Resuelto" && i.estado !== "Cerrado").length);
}

export function pintarEstado(texto) {
    const estado = document.querySelector("#estado-carga");
    if (estado) estado.textContent = texto;
}

// Ficha de detalle (detalle.html) con datos reales, también con textContent.
export function pintarDetalle(incidente) {
    const campos = {
        "#det-codigo": incidente.id,
        "#det-tipo": incidente.tipo,
        "#det-severidad": NOMBRES[incidente.severidad] || incidente.severidad,
        "#det-prioridad": NOMBRES[incidente.prioridad] || incidente.prioridad,
        "#det-estado": incidente.estado,
        "#det-fecha": incidente.fecha,
        "#det-reportante": incidente.reportante,
        "#det-actualizado": incidente.actualizadoPor
            ? `${incidente.actualizadoPor} · ${new Date(incidente.actualizadoEn).toLocaleString()}`
            : "—",
        "#det-descripcion": incidente.descripcion,
        "#det-titulo": incidente.titulo,
        "#det-resumen": `${incidente.id} · Severidad ${NOMBRES[incidente.severidad] || incidente.severidad} · ${incidente.estado}`
    };
    for (const [selector, valor] of Object.entries(campos)) {
        const nodo = document.querySelector(selector);
        if (nodo) nodo.textContent = valor ?? "—";
    }
    document.title = `SecureGuard | ${incidente.id}`;
}
