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
  const status = err.status || 500;
  res.status(status).json({
    ok: false,
    mensaje: err.message || "Error interno del servidor",
    detalles: err.detalles
  });
}

module.exports = { noEncontrado, errorHandler };