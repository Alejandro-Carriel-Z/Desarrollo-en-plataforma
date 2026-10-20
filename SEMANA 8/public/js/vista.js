const NOMBRES = { critica: "Crítica", alta: "Alta", media: "Media", baja: "Baja" };

export function pintarIncidentes(incidentes, contenedor, rol) {
    if (!incidentes.length) {
        const mensaje = document.createElement("p");
        mensaje.textContent = "No hay incidentes con ese filtro.";
        contenedor.replaceChildren(mensaje);
        return;
    }

    const tarjetas = incidentes.map((incidente) => {
        const severidad = Object.hasOwn(NOMBRES, incidente.severidad) ? incidente.severidad : "media";
        const tarjeta = document.createElement("article");
        tarjeta.className = `incident-card ${severidad}`;

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
        pie.append(fecha);

        if (rol === "supervisor" || rol === "admin") {
            const botonEstado = document.createElement("button");
            botonEstado.type = "button";
            botonEstado.dataset.estado = incidente.id;
            botonEstado.textContent = "Cambiar estado";
            pie.append(botonEstado);
        }
        if (rol === "admin") {
            const botonEliminar = document.createElement("button");
            botonEliminar.type = "button";
            botonEliminar.dataset.borrar = incidente.id;
            botonEliminar.textContent = "Eliminar";
            pie.append(botonEliminar);
        }

        tarjeta.append(encabezado, titulo, detalle, pie);
        return tarjeta;
    });
    contenedor.replaceChildren(...tarjetas);
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