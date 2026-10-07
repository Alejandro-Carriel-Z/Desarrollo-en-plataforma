const { crearIncidente, SEVERIDADES, ESTADOS, etiquetaTipo } = require("../domain/incidente");
const modelo = require("../models/incidentes.model");

function validar(datos, parcial = false) {
  const errores = {};
  const titulo = String(datos.titulo || "").trim();
  const descripcion = String(datos.descripcion || "").trim();
  const correo = String(datos.correo || datos.reportante || "").trim();
  const severidad = String(datos.severidad || "").trim().toLowerCase();
  const fecha = String(datos.fecha || "").trim();

  if (!parcial || datos.titulo !== undefined) {
    if (titulo.length < 5) errores.titulo = "Escribe un título de al menos 5 caracteres.";
    else if (titulo.length > 100) errores.titulo = "El título no puede superar los 100 caracteres.";
  }

  if (!parcial || datos.descripcion !== undefined) {
    if (descripcion.length < 20) errores.descripcion = "La descripción debe tener al menos 20 caracteres.";
    else if (descripcion.length > 500) errores.descripcion = "La descripción no puede superar los 500 caracteres.";
  }

  if (!parcial || datos.severidad !== undefined) {
    if (!SEVERIDADES.includes(severidad)) errores.severidad = "Selecciona una severidad.";
  }

  if (!parcial || datos.tipo !== undefined) {
    if (!etiquetaTipo(datos.tipo)) errores.tipo = "Selecciona un tipo de incidente.";
  }

  if (!parcial || datos.fecha !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) errores.fecha = "Selecciona la fecha del incidente.";
    else if (fecha > new Date().toISOString().slice(0, 10)) {
      errores.fecha = "La fecha no puede ser futura.";
    }
  }

  if (!parcial || datos.correo !== undefined || datos.reportante !== undefined) {
    if (!/^\S+@\S+\.\S+$/.test(correo)) errores.correo = "Introduce un correo válido.";
  }

  if (datos.estado !== undefined && !ESTADOS.includes(String(datos.estado).trim())) {
    errores.estado = "Selecciona un estado válido.";
  }

  return errores;
}

function lanzarValidacion(errores) {
  if (!Object.keys(errores).length) return;
  const error = new Error("Validación fallida");
  error.status = 400;
  error.detalles = errores;
  throw error;
}

function prepararCambios(datos) {
  const cambios = {};

  if (datos.titulo !== undefined) cambios.titulo = String(datos.titulo).trim();
  if (datos.descripcion !== undefined) cambios.descripcion = String(datos.descripcion).trim();
  if (datos.severidad !== undefined) {
    cambios.severidad = String(datos.severidad).trim().toLowerCase();
    cambios.prioridad = cambios.severidad;
  }
  if (datos.tipo !== undefined) cambios.tipo = etiquetaTipo(datos.tipo);
  if (datos.fecha !== undefined) cambios.fecha = String(datos.fecha).trim();
  if (datos.correo !== undefined || datos.reportante !== undefined) {
    cambios.reportante = String(datos.correo || datos.reportante || "").trim();
  }
  if (datos.estado !== undefined) cambios.estado = String(datos.estado).trim();

  return cambios;
}

async function listarIncidentes(filtro) {
  return modelo.listar(filtro);
}

async function obtenerIncidente(id) {
  return modelo.obtenerPorId(id);
}

async function registrarIncidente(datos) {
  lanzarValidacion(validar(datos || {}));
  return modelo.guardar(crearIncidente(datos));
}

async function actualizarIncidente(id, datos, parcial = true) {
  const cuerpo = datos || {};
  lanzarValidacion(validar(cuerpo, parcial));

  const cambios = prepararCambios(cuerpo);
  if (!Object.keys(cambios).length) {
    const error = new Error("No hay campos para actualizar.");
    error.status = 400;
    throw error;
  }

  const actual = await modelo.obtenerPorId(id);
  if (!actual) return null;
  return modelo.actualizar(id, cambios);
}

async function eliminarIncidente(id) {
  return modelo.desactivar(id);
}

module.exports = {
  listarIncidentes,
  obtenerIncidente,
  registrarIncidente,
  actualizarIncidente,
  eliminarIncidente
};
