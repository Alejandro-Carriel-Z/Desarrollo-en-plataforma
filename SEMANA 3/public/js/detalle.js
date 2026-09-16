import { obtenerIncidente } from "./modelo.js";

const etiquetasSeveridad = {
    critica: "Crítica",
    alta: "Alta",
    media: "Media",
    baja: "Baja"
};

const parametros = new URLSearchParams(window.location.search);
const id = parametros.get("id") || "INC-002";

function mostrarTexto(selector, valor, predeterminado = "No disponible") {
    document.querySelector(selector).textContent = valor || predeterminado;
}

async function cargarDetalle() {
    try {
        const incidente = await obtenerIncidente(id);

        if (!incidente) {
            mostrarTexto("#detalle-titulo", "Incidente no encontrado");
            mostrarTexto("#detalle-descripcion", `No existe un incidente con el identificador ${id}.`);
            return;
        }

        document.title = `SecureGuard | Detalle ${incidente.id}`;
        mostrarTexto("#detalle-etiqueta", `INCIDENTE / ${incidente.id}`);
        mostrarTexto("#detalle-titulo", incidente.titulo);
        mostrarTexto("#detalle-severidad", etiquetasSeveridad[incidente.severidad] || incidente.severidad);
        mostrarTexto("#detalle-id", incidente.id);
        mostrarTexto("#detalle-fecha", incidente.fecha);
        mostrarTexto("#detalle-estado", incidente.estado);
        mostrarTexto("#detalle-reportante", incidente.reportante);
        mostrarTexto("#detalle-descripcion", incidente.descripcion);
        mostrarTexto("#detalle-tipo", incidente.tipo);
    } catch (_error) {
        mostrarTexto("#detalle-titulo", "No se pudo cargar el incidente");
        mostrarTexto("#detalle-descripcion", "Verifica que el servidor esté ejecutándose en localhost:3000.");
    }
}

cargarDetalle();