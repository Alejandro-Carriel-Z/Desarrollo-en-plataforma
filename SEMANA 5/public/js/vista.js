import { ESTADOS, ETIQUETAS_SEVERIDAD, TIPOS } from "./modelo.js";

function escapar(texto) {
    const elemento = document.createElement("span");
    elemento.textContent = String(texto ?? "");
    return elemento.innerHTML;
}

function claseEstado(estado) {
    return String(estado || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
}

function opcionesEstado(actual) {
    const valores = ESTADOS.includes(actual) ? ESTADOS : [actual, ...ESTADOS].filter(Boolean);
    return valores.map((estado) => {
        const seleccionado = estado === actual ? " selected" : "";
        return `<option value="${escapar(estado)}"${seleccionado}>${escapar(estado)}</option>`;
    }).join("");
}

export function renderizarIncidentes(incidentes, contenedor) {
    if (!incidentes.length) {
        contenedor.innerHTML = '<p class="empty-state">No hay incidentes para el filtro seleccionado.</p>';
        return;
    }

    contenedor.innerHTML = incidentes.map((incidente, indice) => {
        const cerrado = incidente.estado === "Cerrado";
        return `
        <article class="incident-card severity-${escapar(incidente.severidad)} estado-${claseEstado(incidente.estado)}" style="animation-delay: ${indice * 80}ms">
            <div class="card-top">
                <span>${escapar(incidente.id)}</span>
                <span class="badge">${ETIQUETAS_SEVERIDAD[incidente.severidad] || "Pendiente"}</span>
            </div>
            <h3>${escapar(incidente.titulo)}</h3>
            <p>${escapar(TIPOS[incidente.tipo] || incidente.tipo)} · ${escapar(incidente.estado)}</p>
            <div class="card-footer">
                <span>${escapar(incidente.fecha)}</span>
                <a href="detalle.html?id=${encodeURIComponent(incidente.id)}">Ver detalle</a>
            </div>
            <div class="card-actions">
                <button class="button button-ghost button-small" type="button" data-accion="editar" data-id="${escapar(incidente.id)}">Editar</button>
                <label class="estado-control">
                    <span>Estado</span>
                    <select data-accion="estado" data-id="${escapar(incidente.id)}" aria-label="Cambiar estado de ${escapar(incidente.id)}">
                        ${opcionesEstado(incidente.estado)}
                    </select>
                </label>
                <button class="button button-danger button-small" type="button" data-accion="eliminar" data-id="${escapar(incidente.id)}" ${cerrado ? "disabled" : ""}>Eliminar</button>
            </div>
        </article>`;
    }).join("");
}

export function actualizarMetricas(incidentes) {
    const abiertos = incidentes.filter(({ estado }) => estado !== "Resuelto" && estado !== "Cerrado").length;
    const resueltos = incidentes.filter(({ estado }) => estado === "Resuelto").length;
    const cerrados = incidentes.filter(({ estado }) => estado === "Cerrado").length;

    document.querySelector("#total-incidentes").textContent = incidentes.length;
    document.querySelector("#incidentes-abiertos").textContent = abiertos;
    document.querySelector("#incidentes-resueltos").textContent = resueltos;
    document.querySelector("#incidentes-cerrados").textContent = cerrados;
}

export function anunciar(mensaje) {
    document.querySelector("#mensaje-estado").textContent = mensaje;
}

export function mostrarCarga(mensaje) {
    document.querySelector("#estado-carga").textContent = mensaje;
}

export function mostrarErrores(errores) {
    Object.entries(errores).forEach(([campo, mensaje]) => {
        const entrada = document.querySelector(`#${campo}`);
        const contenedor = entrada?.closest(".campo") || entrada?.closest(".checkbox");
        const mensajeElemento = document.querySelector(`#${campo}-error`);
        contenedor?.classList.toggle("invalid", Boolean(mensaje));
        entrada?.setAttribute("aria-invalid", Boolean(mensaje));
        if (mensajeElemento) mensajeElemento.textContent = mensaje;
    });
}
