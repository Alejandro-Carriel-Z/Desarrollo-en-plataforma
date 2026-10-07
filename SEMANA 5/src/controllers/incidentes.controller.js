const servicio = require("../application/incidentes.service");

function esFalloDeBase(error) {
  const texto = String(error && error.message || "");
  return /pool timeout|ECONNREFUSED|Can't reach database|connect ETIMEDOUT/i.test(texto);
}

function enviarError(res, error) {
  if (esFalloDeBase(error)) {
    console.error(error);
    return res.status(503).json({
      ok: false,
      mensaje: "No se pudo conectar con la base de datos."
    });
  }

  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    ok: false,
    mensaje: status >= 500
      ? "Error interno del servidor"
      : (error.message || "Error interno del servidor"),
    detalles: error.detalles || undefined
  });
}

async function listar(req, res) {
  try {
    const incidentes = await servicio.listarIncidentes({
      severidad: req.query.severidad,
      prioridad: req.query.prioridad,
      estado: req.query.estado
    });
    res.status(200).json({
      ok: true,
      total: incidentes.length,
      datos: incidentes
    });
  } catch (error) {
    enviarError(res, error);
  }
}

async function obtener(req, res) {
  try {
    const incidente = await servicio.obtenerIncidente(req.params.id);
    if (!incidente) {
      return res.status(404).json({ ok: false, mensaje: "Incidente no encontrado" });
    }
    res.status(200).json({ ok: true, datos: incidente });
  } catch (error) {
    enviarError(res, error);
  }
}

async function crear(req, res) {
  try {
    const creado = await servicio.registrarIncidente(req.body);
    res.status(201).json({ ok: true, datos: creado });
  } catch (error) {
    enviarError(res, error);
  }
}

async function reemplazar(req, res) {
  try {
    const actualizado = await servicio.actualizarIncidente(req.params.id, req.body, false);
    if (!actualizado) {
      return res.status(404).json({ ok: false, mensaje: "Incidente no encontrado" });
    }
    res.status(200).json({ ok: true, datos: actualizado });
  } catch (error) {
    enviarError(res, error);
  }
}

async function actualizar(req, res) {
  try {
    const actualizado = await servicio.actualizarIncidente(req.params.id, req.body, true);
    if (!actualizado) {
      return res.status(404).json({ ok: false, mensaje: "Incidente no encontrado" });
    }
    res.status(200).json({ ok: true, datos: actualizado });
  } catch (error) {
    enviarError(res, error);
  }
}

async function eliminar(req, res) {
  try {
    const cerrado = await servicio.eliminarIncidente(req.params.id);
    if (!cerrado) {
      return res.status(404).json({ ok: false, mensaje: "Incidente no encontrado" });
    }
    res.status(200).json({ ok: true, datos: cerrado });
  } catch (error) {
    enviarError(res, error);
  }
}

module.exports = { listar, obtener, crear, reemplazar, actualizar, eliminar };