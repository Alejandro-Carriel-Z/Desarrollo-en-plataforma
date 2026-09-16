import { crearIncidenteRemoto, obtenerIncidentes } from "./api.js";
import { anunciar, actualizarMetricas, mostrarCarga, mostrarErrores, renderizarIncidentes } from "./vista.js";

const formulario = document.querySelector("#formulario-incidente");
const lista = document.querySelector("#lista-incidentes");
const CAMPOS = ["titulo", "descripcion", "severidad", "tipo", "fecha", "correo", "confirmacion"];
let incidentes = [];

function validarFormulario(datos) {
  const errores = {};
  const titulo = datos.titulo.trim();
  const descripcion = datos.descripcion.trim();
  if (titulo.length < 5) errores.titulo = "Escribe un título de al menos 5 caracteres.";
  else if (titulo.length > 100) errores.titulo = "El título no puede superar los 100 caracteres.";
  if (descripcion.length < 20) errores.descripcion = "La descripción debe tener al menos 20 caracteres.";
  else if (descripcion.length > 500) errores.descripcion = "La descripción no puede superar los 500 caracteres.";
  if (!datos.severidad) errores.severidad = "Selecciona una severidad.";
  if (!datos.tipo) errores.tipo = "Selecciona un tipo de incidente.";
  if (!datos.fecha) errores.fecha = "Selecciona la fecha del incidente.";
  else if (datos.fecha > new Date().toISOString().slice(0, 10)) errores.fecha = "La fecha no puede ser futura.";
  if (!/^\S+@\S+\.\S+$/.test(datos.correo.trim())) errores.correo = "Introduce un correo válido.";
  if (!datos.confirmacion) errores.confirmacion = "Debes confirmar la información.";
  return errores;
}

function leerFormulario() {
  const datos = Object.fromEntries(new FormData(formulario).entries());
  datos.confirmacion = formulario.querySelector("#confirmacion").checked;
  return datos;
}

async function iniciar() {
  try {
    incidentes = await obtenerIncidentes();
    renderizarIncidentes(incidentes, lista);
    actualizarMetricas(incidentes);
    mostrarCarga(`${incidentes.length} casos desde API`);
  } catch (error) {
    mostrarCarga("No se pudo sincronizar");
    anunciar(error.message);
    lista.innerHTML = '<p class="load-state">No hay datos disponibles en este momento.</p>';
  }
}

formulario.addEventListener("input", () =>
  mostrarErrores(Object.fromEntries(CAMPOS.map((campo) => [campo, ""])))
);

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const datos = leerFormulario();
  const errores = validarFormulario(datos);
  mostrarErrores({ titulo: "", descripcion: "", severidad: "", tipo: "", fecha: "", correo: "", confirmacion: "", ...errores });
  if (Object.keys(errores).length) {
    anunciar("El formulario tiene errores. Revisa los campos indicados.");
    document.querySelector(".invalid input, .invalid select, .invalid textarea")?.focus();
    return;
  }

  try {
    const { confirmacion, ...payload } = datos;
    const nuevo = await crearIncidenteRemoto(payload);
    incidentes = [nuevo, ...incidentes];
    renderizarIncidentes(incidentes, lista);
    actualizarMetricas(incidentes);
    mostrarCarga(`${incidentes.length} casos desde API`);
    formulario.reset();
    anunciar(`Incidente ${nuevo.id} creado y persistido en el servidor.`);
    document.querySelector("#listado-incidentes").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    if (error.errores) {
      mostrarErrores({ titulo: "", descripcion: "", severidad: "", tipo: "", fecha: "", correo: "", confirmacion: "", ...error.errores });
    }
    anunciar(error.message);
  }
});

iniciar();
