import {
  actualizarIncidente,
  cambiarEstado,
  claveTipo,
  crearIncidente,
  eliminarIncidente,
  obtenerIncidente,
  obtenerIncidentes
} from "./modelo.js";
import {
  anunciar,
  actualizarMetricas,
  mostrarCarga,
  mostrarErrores,
  renderizarIncidentes
} from "./vista.js";

const formulario = document.querySelector("#formulario-incidente");
const lista = document.querySelector("#lista-incidentes");
const filtroSeveridad = document.querySelector("#filtro-severidad");
const filtroEstado = document.querySelector("#filtro-estado");
const botonEnviar = document.querySelector("#boton-enviar");
const botonCancelar = document.querySelector("#boton-cancelar");
const etiquetaFormulario = document.querySelector("#etiqueta-formulario");
const tituloFormulario = document.querySelector("#titulo-formulario");

const CAMPOS_FORMULARIO = [
  "titulo", "descripcion", "severidad", "tipo", "fecha", "correo", "confirmacion"
];

let incidentesVisibles = [];
let editandoId = null;
let ocupado = false;
let carga = 0;

function erroresVacios() {
  return Object.fromEntries(CAMPOS_FORMULARIO.map((campo) => [campo, ""]));
}

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
  else if (datos.fecha > new Date().toISOString().slice(0, 10)) {
    errores.fecha = "La fecha no puede ser futura.";
  }

  if (!/^\S+@\S+\.\S+$/.test(datos.correo.trim())) {
    errores.correo = "Introduce un correo válido.";
  }

  if (!datos.confirmacion) errores.confirmacion = "Debes confirmar la información.";
  return errores;
}

function leerFormulario() {
  const datos = Object.fromEntries(new FormData(formulario).entries());
  datos.confirmacion = formulario.querySelector("#confirmacion").checked;
  return datos;
}

function filtrosActuales() {
  return {
    severidad: filtroSeveridad.value,
    estado: filtroEstado.value
  };
}

function modoCreacion() {
  editandoId = null;
  etiquetaFormulario.textContent = "NUEVO REPORTE";
  tituloFormulario.textContent = "Registrar incidente";
  botonEnviar.textContent = "Crear reporte";
  botonCancelar.hidden = true;
  formulario.reset();
  mostrarErrores(erroresVacios());
}

function modoEdicion(incidente) {
  editandoId = incidente.id;
  etiquetaFormulario.textContent = "EDICIÓN";
  tituloFormulario.textContent = `Editar ${incidente.id}`;
  botonEnviar.textContent = "Guardar cambios";
  botonCancelar.hidden = false;
  mostrarErrores(erroresVacios());

  formulario.elements.titulo.value = incidente.titulo || "";
  formulario.elements.descripcion.value = incidente.descripcion || "";
  formulario.elements.severidad.value = incidente.severidad || "";
  formulario.elements.tipo.value = claveTipo(incidente.tipo);
  formulario.elements.fecha.value = incidente.fecha || "";
  formulario.elements.correo.value = incidente.reportante || "";
  formulario.elements.confirmacion.checked = false;
}

function textoError(error) {
  const detalles = error.detalles ? Object.values(error.detalles).filter(Boolean) : [];
  if (!detalles.length) return error.message;
  return `${error.message} ${detalles.join(" ")}`;
}

function marcarOcupado(activo, textoBoton) {
  ocupado = activo;
  botonEnviar.disabled = activo;
  lista.setAttribute("aria-busy", String(activo));
  if (textoBoton) botonEnviar.textContent = textoBoton;
}

async function iniciar() {
  const filtros = filtrosActuales();
  const activo = Boolean(filtros.severidad || filtros.estado);
  const ticket = ++carga;
  try {
    const visibles = await obtenerIncidentes(filtros);
    const todos = activo ? await obtenerIncidentes() : visibles;
    if (ticket !== carga) return;
    incidentesVisibles = visibles;
    renderizarIncidentes(visibles, lista);
    actualizarMetricas(todos);
    mostrarCarga(activo
      ? `${visibles.length} casos con el filtro activo · ${todos.length} en total`
      : `${visibles.length} casos sincronizados vía API REST`);
  } catch (error) {
    if (ticket !== carga) return;
    mostrarCarga("No se pudo sincronizar con el servidor");
    anunciar(textoError(error));
    lista.innerHTML = '<p class="empty-state">El cliente no recibió JSON del servidor Express.</p>';
  }
}

async function entrarEnEdicion(id) {
  try {
    const incidente = incidentesVisibles.find((item) => item.id === id) || await obtenerIncidente(id);
    if (!incidente) {
      anunciar(`No existe el incidente ${id}.`);
      return;
    }
    modoEdicion(incidente);
    anunciar(`Editando ${incidente.id}. Los cambios se enviarán con PUT.`);
    document.querySelector("#registro-incidente").scrollIntoView({ behavior: "smooth" });
    formulario.elements.titulo.focus();
  } catch (error) {
    anunciar(error.message);
  }
}

formulario.addEventListener("input", () => {
  mostrarErrores(erroresVacios());
});

botonCancelar.addEventListener("click", () => {
  modoCreacion();
  anunciar("Edición cancelada.");
});

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (ocupado) return;

  const datos = leerFormulario();
  const errores = validarFormulario(datos);
  mostrarErrores({ ...erroresVacios(), ...errores });

  if (Object.keys(errores).length) {
    anunciar("El formulario tiene errores. Revisa los campos indicados.");
    document.querySelector(".invalid input, .invalid select, .invalid textarea")?.focus();
    return;
  }

  const { confirmacion, ...payload } = datos;
  const eraEdicion = Boolean(editandoId);
  const idEditado = editandoId;

  try {
    marcarOcupado(true, eraEdicion ? "Guardando..." : "Creando...");
    if (eraEdicion) {
      await actualizarIncidente(idEditado, payload);
      anunciar(`Incidente ${idEditado} actualizado en el servidor.`);
    } else {
      const nuevoIncidente = await crearIncidente(payload);
      anunciar(`Incidente ${nuevoIncidente.id} persistido en el servidor.`);
    }
    modoCreacion();
    await iniciar();
    document.querySelector("#listado-incidentes").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    if (error.detalles) mostrarErrores({ ...erroresVacios(), ...error.detalles });
    anunciar(textoError(error));
    botonEnviar.textContent = eraEdicion ? "Guardar cambios" : "Crear reporte";
  } finally {
    ocupado = false;
    botonEnviar.disabled = false;
    lista.setAttribute("aria-busy", "false");
  }
});

lista.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("[data-accion='editar'], [data-accion='eliminar']");
  if (!boton || ocupado) return;

  const id = boton.dataset.id;
  if (boton.dataset.accion === "editar") {
    await entrarEnEdicion(id);
    return;
  }

  const confirmar = window.confirm(
    `¿Eliminar ${id}? El servidor no borra la fila: cierra el caso y deja el estado en Cerrado.`
  );
  if (!confirmar) return;

  try {
    marcarOcupado(true);
    await eliminarIncidente(id);
    anunciar(`Incidente ${id} cerrado. DELETE aplicó el cierre lógico.`);
    await iniciar();
  } catch (error) {
    anunciar(textoError(error));
  } finally {
    ocupado = false;
    botonEnviar.disabled = false;
    lista.setAttribute("aria-busy", "false");
  }
});

lista.addEventListener("change", async (evento) => {
  const select = evento.target.closest("[data-accion='estado']");
  if (!select || ocupado) return;

  const id = select.dataset.id;
  const estado = select.value;

  try {
    marcarOcupado(true);
    await cambiarEstado(id, estado);
    anunciar(`Estado de ${id} actualizado a ${estado}.`);
    await iniciar();
  } catch (error) {
    anunciar(textoError(error));
    await iniciar();
  } finally {
    ocupado = false;
    botonEnviar.disabled = false;
    lista.setAttribute("aria-busy", "false");
  }
});

filtroSeveridad.addEventListener("change", () => iniciar());
filtroEstado.addEventListener("change", () => iniciar());

document.querySelector("#fecha").max = new Date().toISOString().slice(0, 10);

iniciar().then(() => {
  const editar = new URLSearchParams(window.location.search).get("editar");
  if (editar) entrarEnEdicion(editar);
});
