const NOMBRES = { critica: "Crítica", alta: "Alta", media: "Media", baja: "Baja" };

export function pintarIncidentes(incidentes, contenedor, rol) {
    if (!incidentes.length) {
        contenedor.innerHTML = "<p>No hay incidentes con ese filtro.</p>";
        return;
    }
    contenedor.innerHTML = incidentes.map((incidente) => `
        <article class="incident-card ${incidente.severidad}">
            <header>
                <span>${incidente.id}</span>
                <span class="badge">${NOMBRES[incidente.severidad] || incidente.severidad}</span>
            </header>
            <h3>${incidente.titulo}</h3>
            <p>${incidente.tipo} · ${incidente.estado}</p>
            <footer class="card-meta">
                <time datetime="${incidente.fecha}">${incidente.fecha}</time>
                ${rol === "supervisor" || rol === "admin" ? `<button type="button" data-estado="${incidente.id}">Cambiar estado</button>` : ""}
                ${rol === "admin" ? `<button type="button" data-borrar="${incidente.id}">Eliminar</button>` : ""}
            </footer>
        </article>
    `).join("");
}

export function pintarResumen(incidentes) {
    const total = document.querySelector("#total-incidentes");
    const abiertos = document.querySelector("#incidentes-abiertos");
    if (!total || !abiertos) return;
    total.textContent = String(incidentes.length);
    abiertos.textContent = String(incidentes.filter((incidente) => incidente.estado !== "Resuelto").length);
}

export function pintarEstado(texto) {
    const estado = document.querySelector("#estado-carga");
    if (estado) estado.textContent = texto;
}