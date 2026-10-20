const { log } = require("./logger");
const { config } = require("../config/env");

function noEncontrado(_req, res) {
    res.status(404).json({ ok: false, mensaje: "Ruta no encontrada" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(error, req, res, _next) {
    // JSON mal formado enviado por el cliente
    const status = error.type === "entity.parse.failed" ? 400 : (error.status || 500);
    if (status >= 500) {
        log.error("error no controlado", { requestId: req.id, ruta: req.originalUrl, error: error.message });
    }
    const mensaje = status >= 500 && config.PRODUCCION
        ? "Error interno del servidor"
        : (error.type === "entity.parse.failed" ? "JSON inválido" : (error.message || "Error interno del servidor"));
    res.status(status).json({ ok: false, mensaje, detalles: error.detalles, requestId: req.id });
}

module.exports = { noEncontrado, errorHandler };
