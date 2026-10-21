const express = require("express");
const path = require("path");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const { config } = require("./config/env");
const logger = require("./middleware/logger");
const { log } = logger;
const { noEncontrado, errorHandler } = require("./middleware/errorHandler");
const { exigirToken } = require("./security/rol");
const incidentesRoutes = require("./routes/incidentes.routes");
const authRoutes = require("./routes/auth.routes");
const prisma = require("./lib/prisma");

const app = express();
app.disable("x-powered-by");
// Detrás del proxy del hosting (Railway/Render) se confía en X-Forwarded-*.
if (config.TRUST_PROXY) app.set("trust proxy", 1);

// En producción solo se aceptan los orígenes configurados en CORS_ORIGINS
// (el propio front se sirve desde el mismo origen y no necesita CORS).
const origenesPermitidos = config.PRODUCCION
    ? config.CORS_ORIGINS
    : ["https://localhost:3000", "https://127.0.0.1:3000", "http://127.0.0.1:5500", "http://localhost:5500", ...config.CORS_ORIGINS];

// Cabeceras de seguridad básicas
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:; script-src 'self' https://code.jquery.com; connect-src 'self'; frame-ancestors 'none'");
    if (config.PRODUCCION || config.HTTPS_ENABLED) {
        res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    }
    next();
});

// En producción, cualquier petición HTTP que llegue por el proxy se redirige a HTTPS.
if (config.PRODUCCION && config.TRUST_PROXY) {
    app.use((req, res, next) => {
        if (req.secure || req.path === "/api/salud") return next();
        return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    });
}

app.use(cors({
    origin: origenesPermitidos,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(logger);
app.use(express.json({ limit: "20kb" }));
app.use(compression({ threshold: 1024 }));
// Solo se publica la carpeta public/: así no se exponen .env, certs/ ni el código del servidor.
app.use(express.static(path.join(__dirname, "..", "public")));

const arranque = Date.now();
async function estadoBase() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return "conectada";
    } catch {
        return "no disponible";
    }
}

// Health check: proceso + base de datos. Lo usa el hosting para decidir si hay tráfico.
app.get("/api/salud", async (_req, res) => {
    const base = await estadoBase();
    const ok = base === "conectada";
    res.status(ok ? 200 : 503).json({
        ok,
        servicio: "SecureGuard API",
        unidad: 8,
        entorno: config.NODE_ENV,
        version: config.APP_VERSION,
        commit: config.COMMIT,
        base,
        uptimeSeg: Math.round((Date.now() - arranque) / 1000),
        fecha: new Date().toISOString()
    });
});

// Se mantiene por compatibilidad con Semana 7.
app.get("/api/listo", async (_req, res) => {
    const base = await estadoBase();
    res.status(base === "conectada" ? 200 : 503).json({ ok: base === "conectada", servicio: "SecureGuard API", base });
});

// Rate limiting del login: máx. LOGIN_MAX_INTENTOS fallidos por IP cada LOGIN_VENTANA_MIN minutos.
// Los logins correctos no cuentan. Detrás del proxy la IP sale de X-Forwarded-For (trust proxy).
const limiteLogin = rateLimit({
    windowMs: config.LOGIN_VENTANA_MIN * 60 * 1000,
    limit: config.LOGIN_MAX_INTENTOS,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res) => {
        log.warn("login bloqueado por rate limit", { requestId: req.id, ip: req.ip });
        res.status(429).json({
            ok: false,
            mensaje: `Demasiados intentos de inicio de sesión. Intenta de nuevo en ${config.LOGIN_VENTANA_MIN} minutos.`,
            requestId: req.id
        });
    }
});
app.use("/api/auth/login", limiteLogin);
app.use("/api/auth", authRoutes);
app.use("/api/incidentes", exigirToken, incidentesRoutes);
app.use(noEncontrado);
app.use(errorHandler);

module.exports = app;
