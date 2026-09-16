"use strict";

const { crearIncidente, validarDatosIncidente } = require("../domain/incidente");
const repositorio = require("../persistence/incidentes.repository");

async function listarIncidentes() {
  return repositorio.listar();
}

async function obtenerIncidente(id) {
  return repositorio.obtenerPorId(id);
}

async function registrarIncidente(datos) {
  const errores = validarDatosIncidente(datos);
  if (Object.keys(errores).length) {
    const error = new Error("Datos de incidente inválidos");
    error.statusCode = 400;
    error.errores = errores;
    throw error;
  }
  const incidente = crearIncidente(datos);
  return repositorio.guardar(incidente);
}

module.exports = { listarIncidentes, obtenerIncidente, registrarIncidente };
