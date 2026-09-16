"use strict";

const TIPOS = {
  phishing: "Phishing",
  malware: "Malware",
  acceso: "Acceso no autorizado",
  vulnerabilidad: "Vulnerabilidad"
};

const SEVERIDADES = new Set(["critica", "alta", "media", "baja"]);

function generarId() {
  const t = Date.now().toString().slice(-6);
  const r = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `INC-${t}-${r}`;
}

function crearIncidente(datos) {
  const titulo = String(datos.titulo || "").trim();
  const descripcion = String(datos.descripcion || "").trim();
  const correo = String(datos.correo || datos.reportante || "").trim();
  const severidad = String(datos.severidad || "").trim();
  const tipoClave = String(datos.tipo || "").trim();
  const fecha = String(datos.fecha || "").trim();

  return {
    id: generarId(),
    titulo,
    descripcion,
    severidad,
    fecha,
    estado: "En investigación",
    tipo: TIPOS[tipoClave] || tipoClave,
    reportante: correo
  };
}

function validarDatosIncidente(datos) {
  const errores = {};
  const titulo = String(datos.titulo || "").trim();
  const descripcion = String(datos.descripcion || "").trim();
  const correo = String(datos.correo || datos.reportante || "").trim();
  const severidad = String(datos.severidad || "").trim();
  const tipo = String(datos.tipo || "").trim();
  const fecha = String(datos.fecha || "").trim();
  const hoy = new Date().toISOString().slice(0, 10);

  if (titulo.length < 5) errores.titulo = "Escribe un título de al menos 5 caracteres.";
  else if (titulo.length > 100) errores.titulo = "El título no puede superar los 100 caracteres.";

  if (descripcion.length < 20) errores.descripcion = "La descripción debe tener al menos 20 caracteres.";
  else if (descripcion.length > 500) errores.descripcion = "La descripción no puede superar los 500 caracteres.";

  if (!SEVERIDADES.has(severidad)) errores.severidad = "Selecciona una severidad válida.";
  if (!TIPOS[tipo] && !Object.values(TIPOS).includes(tipo)) {
    errores.tipo = "Selecciona un tipo de incidente válido.";
  }
  if (!fecha) errores.fecha = "Selecciona la fecha del incidente.";
  else if (fecha > hoy) errores.fecha = "La fecha no puede ser futura.";
  if (!/^\S+@\S+\.\S+$/.test(correo)) errores.correo = "Introduce un correo válido.";

  return errores;
}

module.exports = { crearIncidente, validarDatosIncidente, TIPOS, SEVERIDADES };
