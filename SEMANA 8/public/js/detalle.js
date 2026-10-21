import { obtenerIncidente, sesion } from "./modelo.js";
import { pintarDetalle } from "./vista.js";

const aviso = document.querySelector("#det-aviso");

async function cargar() {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!sesion().token) {
        aviso.textContent = "Inicia sesión en la página principal para ver el detalle.";
        return;
    }
    if (!id) {
        aviso.textContent = "Elige un incidente desde el listado (botón «Ver detalle»).";
        return;
    }
    try {
        pintarDetalle(await obtenerIncidente(id));
        aviso.textContent = "";
    } catch (error) {
        aviso.textContent = error.message;
    }
}

window.addEventListener("sesion-expirada", () => {
    aviso.textContent = "Tu sesión venció. Vuelve a la página principal e inicia sesión.";
});

cargar();
