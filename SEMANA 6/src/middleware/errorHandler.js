function noEncontrado(_req, res) {
    res.status(404).json({ ok: false, mensaje: "Ruta no encontrada" });
}

function errorHandler(error, _req, res, _next) {
    const status = error.status || 500;
    res.status(status).json({
        ok: false,
        mensaje: error.message || "Error interno del servidor",
        detalles: error.detalles
    });
}

module.exports = { noEncontrado, errorHandler };