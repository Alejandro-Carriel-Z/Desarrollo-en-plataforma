import {
    cambiarEstado,
    eliminarIncidente,
    ESTADOS,
    ETIQUETAS_SEVERIDAD,
    obtenerIncidente,
    TIPOS
} from "./modelo.js";

const parametros = new URLSearchParams(window.location.search);
const id = parametros.get("id") || "INC-002";
const acciones = document.querySelector("#detalle-acciones");
const aviso = document.querySelector("#detalle-aviso");
const selectorEstado = document.querySelector("#detalle-select-estado");
const enlaceEditar = document.querySelector("#detalle-editar");
const botonEliminar = document.querySelector("#detalle-eliminar");

function mostrarTexto(selector, valor, predeterminado = "No disponible") {
    document.querySelector(selector).textContent = valor || predeterminado;
}

function anunciar(mensaje) {
    aviso.textContent = mensaje;
}

function pintarEstado(incidente) {
    const valores = ESTADOS.includes(incidente.estado)
        ? ESTADOS
        : [incidente.estado, ...ESTADOS];

    selectorEstado.innerHTML = valores.map((estado) => {
        const opcion = document.createElement("option");
        opcion.value = estado;
        opcion.textContent = estado;
        if (estado === incidente.estado) opcion.setAttribute("selected", "");
        return opcion.outerHTML;
    }).join("");

    botonEliminar.disabled = incidente.estado === "Cerrado";
    enlaceEditar.href = `index.html?editar=${encodeURIComponent(incidente.id)}#registro-incidente`;
}

function pintarIncidente(incidente) {
    document.title = `SecureGuard | Detalle ${incidente.id}`;
    mostrarTexto("#detalle-etiqueta", `INCIDENTE / ${incidente.id}`);
    mostrarTexto("#detalle-titulo", incidente.titulo);
    mostrarTexto("#detalle-severidad", ETIQUETAS_SEVERIDAD[incidente.severidad] || incidente.severidad);
    mostrarTexto("#detalle-id", incidente.id);
    mostrarTexto("#detalle-fecha", incidente.fecha);
    mostrarTexto("#detalle-estado", incidente.estado);
    mostrarTexto("#detalle-reportante", incidente.reportante);
    mostrarTexto("#detalle-descripcion", incidente.descripcion);
    mostrarTexto("#detalle-tipo", TIPOS[incidente.tipo] || incidente.tipo);
    pintarEstado(incidente);
    acciones.hidden = false;
}

async function cargarDetalle() {
    try {
        const incidente = await obtenerIncidente(id);

        if (!incidente) {
            mostrarTexto("#detalle-titulo", "Incidente no encontrado");
            mostrarTexto("#detalle-descripcion", `No existe un incidente con el identificador ${id}.`);
            acciones.hidden = true;
            return;
        }

        pintarIncidente(incidente);
    } catch (_error) {
        mostrarTexto("#detalle-titulo", "No se pudo cargar el incidente");
        mostrarTexto("#detalle-descripcion", "Verifica que el servidor esté ejecutándose en localhost:3000.");
        acciones.hidden = true;
    }
}

selectorEstado.addEventListener("change", async () => {
    selectorEstado.disabled = true;
    try {
        const actualizado = await cambiarEstado(id, selectorEstado.value);
        pintarIncidente(actualizado);
        anunciar(`Estado actualizado a ${actualizado.estado}.`);
    } catch (error) {
        const detalles = error.detalles ? Object.values(error.detalles).filter(Boolean).join(" ") : "";
        anunciar(detalles ? `${error.message} ${detalles}` : error.message);
        await cargarDetalle();
    } finally {
        selectorEstado.disabled = false;
    }
});

botonEliminar.addEventListener("click", async () => {
    const confirmar = window.confirm(
        `¿Eliminar ${id}? El servidor cierra el caso: el estado pasa a Cerrado y el registro se conserva.`
    );
    if (!confirmar) return;

    botonEliminar.disabled = true;
    try {
        const cerrado = await eliminarIncidente(id);
        pintarIncidente(cerrado);
        anunciar(`Incidente ${cerrado.id} cerrado.`);
    } catch (error) {
        const detalles = error.detalles ? Object.values(error.detalles).filter(Boolean).join(" ") : "";
        anunciar(detalles ? `${error.message} ${detalles}` : error.message);
        botonEliminar.disabled = false;
    }
});

cargarDetalle();
