import {
    entrar, guardarSesion, cerrarSesion, sesion,
    obtenerIncidentes, filtrarPorSeveridad, crearIncidente, cambiarEstado, eliminarIncidente
} from "./modelo.js";
import { pintarIncidentes, pintarResumen, pintarEstado } from "./vista.js";

const lista = document.querySelector("#lista-incidentes");
const filtro = document.querySelector("#filtro-severidad");
const formulario = document.querySelector("#formulario-incidente");
const aviso = document.querySelector("#mensaje-estado");
const sesionActual = document.querySelector("#sesion-actual");
let incidentes = [];

function anunciar(texto) {
    pintarEstado(texto);
    if (aviso) aviso.textContent = texto;
}

function mostrar(datos) {
    pintarIncidentes(datos, lista, sesion().rol);
    pintarResumen(incidentes);
}

async function iniciar() {
    const actual = sesion();
    sesionActual.textContent = actual.token ? `${actual.nombre} · ${actual.rol}` : "Sin sesión";
    if (!actual.token) {
        anunciar("Ingresa para cargar los incidentes");
        return;
    }
    try {
        incidentes = await obtenerIncidentes();
        mostrar(incidentes);
        anunciar(`${incidentes.length} incidentes cargados desde MySQL`);
    } catch (error) {
        anunciar(error.message);
    }
}

document.querySelector("#formulario-login").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    try {
        const datos = Object.fromEntries(new FormData(evento.target));
        guardarSesion(await entrar(datos.correo, datos.password));
        evento.target.reset();
        await iniciar();
    } catch (error) {
        anunciar(error.message);
    }
});

document.querySelector("#cerrar-sesion").addEventListener("click", () => {
    cerrarSesion();
    incidentes = [];
    lista.innerHTML = "";
    iniciar();
});

filtro.addEventListener("change", () => {
    mostrar(filtrarPorSeveridad(incidentes, filtro.value));
});

function marcarError(id, mensaje) {
    const campo = document.querySelector(`#${id}`);
    let ayuda = document.querySelector(`#${id}-error`);
    if (!ayuda) {
        ayuda = document.createElement("small");
        ayuda.id = `${id}-error`;
        ayuda.className = "field-message";
        campo.insertAdjacentElement("afterend", ayuda);
    }
    ayuda.textContent = mensaje;
    campo.setCustomValidity(mensaje);
}

formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    formulario.querySelectorAll("input, select, textarea").forEach((campo) => campo.setCustomValidity(""));
    const titulo = document.querySelector("#titulo").value.trim();
    const descripcion = document.querySelector("#descripcion").value.trim();
    const fecha = document.querySelector("#fecha").value;
    const hoy = new Date().toISOString().slice(0, 10);
    if (titulo.length < 5) marcarError("titulo", "Escribe un título de al menos 5 caracteres.");
    if (descripcion.length < 20) marcarError("descripcion", "La descripción debe tener al menos 20 caracteres.");
    if (fecha > hoy) marcarError("fecha", "La fecha no puede ser futura.");
    if (!formulario.reportValidity()) {
        anunciar("El formulario tiene errores. Revisa los campos marcados.");
        return;
    }
    try {
        const datos = Object.fromEntries(new FormData(formulario));
        await crearIncidente(datos);
        incidentes = await obtenerIncidentes();
        mostrar(incidentes);
        anunciar(`Incidente guardado en MySQL: ${datos.titulo}`);
        formulario.reset();
    } catch (error) {
        anunciar(error.message);
    }
});

lista.addEventListener("click", async (evento) => {
    const borrar = evento.target.dataset.borrar;
    const estado = evento.target.dataset.estado;
    try {
        if (borrar) await eliminarIncidente(borrar);
        if (estado) await cambiarEstado(estado, "Contención en curso");
        if (borrar || estado) {
            incidentes = await obtenerIncidentes();
            mostrar(incidentes);
            anunciar(borrar ? "Incidente eliminado" : "Estado actualizado");
        }
    } catch (error) {
        anunciar(error.message);
    }
});

iniciar();