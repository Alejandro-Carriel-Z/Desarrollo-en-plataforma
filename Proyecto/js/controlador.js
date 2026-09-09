import { crearIncidente, obtenerIncidentes } from './modelo.js';
import { anunciar, actualizarMetricas, mostrarCarga, mostrarErrores, renderizarIncidentes } from './vista.js';

const formulario = document.querySelector('#formulario-incidente');
const lista = document.querySelector('#lista-incidentes');
let incidentes = [];

function validarFormulario(datos) {
    const errores = {};
    if (datos.titulo.trim().length < 5) errores.titulo = 'Escribe un título de al menos 5 caracteres.';
    if (datos.descripcion.trim().length < 20) errores.descripcion = 'La descripción debe tener al menos 20 caracteres.';
    if (!datos.severidad) errores.severidad = 'Selecciona una severidad.';
    if (!datos.tipo) errores.tipo = 'Selecciona un tipo de incidente.';
    if (!datos.fecha) errores.fecha = 'Selecciona la fecha del incidente.';
    if (!/^\S+@\S+\.\S+$/.test(datos.correo)) errores.correo = 'Introduce un correo válido.';
    if (!datos.confirmacion) errores.confirmacion = 'Debes confirmar la información.';
    return errores;
}

function leerFormulario() {
    const datos = Object.fromEntries(new FormData(formulario).entries());
    datos.confirmacion = formulario.confirmacion.checked;
    return datos;
}

async function iniciar() {
    try {
        incidentes = await obtenerIncidentes();
        renderizarIncidentes(incidentes, lista);
        actualizarMetricas(incidentes);
        mostrarCarga(`${incidentes.length} casos sincronizados`);
    } catch (error) {
        mostrarCarga('No se pudo sincronizar');
        anunciar(error.message);
        lista.innerHTML = '<p class="load-state">No hay datos disponibles en este momento.</p>';
    }
}

formulario.addEventListener('input', () => mostrarErrores({}));
formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const datos = leerFormulario();
    const errores = validarFormulario(datos);
    mostrarErrores({ titulo: '', descripcion: '', severidad: '', tipo: '', fecha: '', correo: '', confirmacion: '', ...errores });
    if (Object.keys(errores).length) {
        anunciar('El formulario tiene errores. Revisa los campos indicados.');
        document.querySelector('.invalid input, .invalid select, .invalid textarea')?.focus();
        return;
    }
    const nuevoIncidente = crearIncidente(datos);
    incidentes = [nuevoIncidente, ...incidentes];
    renderizarIncidentes(incidentes, lista);
    actualizarMetricas(incidentes);
    mostrarCarga(`${incidentes.length} casos sincronizados`);
    formulario.reset();
    anunciar(`Incidente ${nuevoIncidente.id} creado correctamente.`);
    document.querySelector('#listado-incidentes').scrollIntoView({ behavior: 'smooth' });
});

iniciar();
