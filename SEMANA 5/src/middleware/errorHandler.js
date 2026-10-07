function noEncontrado(req, res, next) {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      ok: false,
      mensaje: "Ruta no encontrada"
    });
  }
  next();
}

function errorHandler(err, _req, res, _next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      ok: false,
      mensaje: "JSON inválido"
    });
  }

  const texto = String(err && err.message || "");
  if (/pool timeout|ECONNREFUSED|Can't reach database|connect ETIMEDOUT/i.test(texto)) {
    console.error(err);
    return res.status(503).json({
      ok: false,
      mensaje: "No se pudo conectar con la base de datos."
    });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    ok: false,
    mensaje: status >= 500
      ? "Error interno del servidor"
      : (err.message || "Error interno del servidor"),
    detalles: err.detalles
  });
}

module.exports = { noEncontrado, errorHandler };