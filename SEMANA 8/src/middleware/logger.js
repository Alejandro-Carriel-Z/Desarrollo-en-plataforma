const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { config } = require("../config/env");

// Logger estructurado (JSON por línea) con niveles. Nunca registra cuerpos,
// contraseñas, tokens ni el encabezado Authorization.
const NIVELES = { debug: 10, info: 20, warn: 30, error: 40 };
const minimo = NIVELES[config.LOG_LEVEL] || NIVELES.info;
let archivo = null;
if (config.LOG_FILE) {
    fs.mkdirSync(path.dirname(path.resolve(config.LOG_FILE)), { recursive: true });
    archivo = fs.createWriteStream(path.resolve(config.LOG_FILE), { flags: "a" });
}

const SENSIBLE = /(password|clave|token|authorization|secret|cookie)/i;
function limpiar(datos) {
    const salida = {};
    for (const [k, v] of Object.entries(datos || {})) {
        salida[k] = SENSIBLE.test(k) ? "[OCULTO]" : v;
    }
    return salida;
}

function escribir(nivel, mensaje, datos) {
    if (NIVELES[nivel] < minimo || process.env.NODE_ENV === "test") return;
    const linea = JSON.stringify({ fecha: new Date().toISOString(), nivel: nivel.toUpperCase(), mensaje, ...limpiar(datos) });
    (nivel === "error" || nivel === "warn" ? console.error : console.log)(linea);
    if (archivo) archivo.write(linea + "\n");
}

const log = {
    debug: (m, d) => escribir("debug", m, d),
    info: (m, d) => escribir("info", m, d),
    warn: (m, d) => escribir("warn", m, d),
    error: (m, d) => escribir("error", m, d)
};

function logger(req, res, next) {
    const inicio = process.hrtime.bigint();
    req.id = randomUUID();
    res.setHeader("X-Request-Id", req.id);
    res.on("finish", () => {
        const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
        const nivel = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
        log[nivel]("solicitud", {
            requestId: req.id,
            metodo: req.method,
            ruta: req.originalUrl.split("?")[0],
            estado: res.statusCode,
            duracionMs: Math.round(ms * 10) / 10,
            usuario: req.usuario ? req.usuario.id : undefined
        });
    });
    next();
}

module.exports = logger;
module.exports.log = log;
module.exports.limpiar = limpiar;
