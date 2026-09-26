const { crearIncidente } = require("../domain/incidente");
const modelo = require("../models/incidentes.model");

function validar(datos, parcial = false) {
  const errores = {};
  const titulo = String(datos.titulo || "").trim();
  const descripcion = String(datos.descripcion || "").trim();
  const correo = String(datos.correo || datos.reportante || "").trim();

  if (!parcial || datos.titulo !== undefined) {
    if (titulo.length < 5) errores.titulo = "Escribe un título de al menos 5 caracteres.";
    else if (titulo.length > 100) errores.titulo = "El titulo no puede superar los 100 caracteres.";
  }

  if (!parcial || datos.descripcion !== undefined) {
    if (descripcion.length < 20) errores.descripcion = "La descripción debe tener al menos 20 caracteres.";
    else if (descripcion.length > 500) errores.descripcion = "La descripción no puede superar los 500 caracteres.";
  }

  if (!parcial || datos.severidad !== undefined) {
    if (!datos.severidad) errores.severidad = "Seleccione una severidad";
  }

  if (!parcial || datos.tipo !== undefined) {
    if (!datos.tipo) errores.tipo = "Selecciona un tipo de incidente.";
  }

  if (!parcial || datos.fecha !== undefined) {
    if (!datos.fecha) errores.fecha = "Selecciona la fecha del incidente.";
    else if (datos.fecha > new Date().toISOString().slice(0, 10)) {
      errores.fecha = "La fecha no puede ser futura.";
    }
  }

  if (!parcial || datos.correo !== undefined || datos.reportante !== undefined) {
    if (correo && !/^\S+@\S+\.\S+$/.test(correo)) {
      errores.correo = "Introduce un correo válido.";
    }
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

async function listarIncidentes(filtro) {
  return modelo.listar(filtro);
}

async function obtenerIncidente(id) {
  return modelo.obtenerPorId(id);
}

async function registrarIncidente(datos) {
  lanzarValidacion(validar(datos));
  return modelo.guardar(crearIncidente(datos));
}

async function actualizarIncidente(id, datos) {
  const actual = modelo.obtenerPorId(id);
  if (!actual) return null;
  lanzarValidacion(validar(datos, true));
  return modelo.actualizar(id, datos);
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