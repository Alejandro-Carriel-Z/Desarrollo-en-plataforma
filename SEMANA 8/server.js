const https = require("https");
const fs = require("fs");
const path = require("path");

const { config, validarEntorno } = require("./src/config/env");
const { log } = require("./src/middleware/logger");

// Falla con un mensaje claro antes de aceptar tráfico si falta configuración.
const problema = validarEntorno();
if (problema) {
    log.error("configuración inválida", { detalle: problema });
    process.exit(1);
}

const app = require("./src/app");
const prisma = require("./src/lib/prisma");

let servidor;
if (config.HTTPS_ENABLED) {
    const KEY = path.join(__dirname, "certs", "key.pem");
    const CERT = path.join(__dirname, "certs", "cert.pem");
    if (!fs.existsSync(KEY) || !fs.existsSync(CERT)) {
        log.error("no hay certificado HTTPS", { detalle: "Ejecuta: npm run cert (o HTTPS_ENABLED=false detrás de un proxy HTTPS)" });
        process.exit(1);
    }
    servidor = https.createServer({ key: fs.readFileSync(KEY), cert: fs.readFileSync(CERT) }, app)
        .listen(config.PORT, () => {
            log.info("servidor iniciado", { url: `https://localhost:${config.PORT}`, entorno: config.NODE_ENV, version: config.APP_VERSION, commit: config.COMMIT });
        });
} else {
    servidor = app.listen(config.PORT, "0.0.0.0", () => {
        log.info("servidor iniciado", { puerto: config.PORT, entorno: config.NODE_ENV, tls: "terminado en el proxy del hosting", version: config.APP_VERSION, commit: config.COMMIT });
    });
}

function apagar(senal) {
    log.warn("apagado solicitado", { senal });
    servidor.close(async () => {
        await prisma.$disconnect().catch(() => {});
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", () => apagar("SIGTERM"));
process.on("SIGINT", () => apagar("SIGINT"));
process.on("unhandledRejection", (e) => log.error("promesa rechazada sin manejar", { error: String(e && e.message || e) }));
