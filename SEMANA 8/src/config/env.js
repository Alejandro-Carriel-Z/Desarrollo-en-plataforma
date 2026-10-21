require("dotenv").config();

// Configuración por entorno: todo sale de variables, nunca del código.
const NODE_ENV = process.env.NODE_ENV || "development";
const PRODUCCION = NODE_ENV === "production";

function booleano(valor, porDefecto) {
    if (valor === undefined || valor === "") return porDefecto;
    return String(valor).toLowerCase() === "true";
}

function validarEntorno(env = process.env) {
    const faltantes = ["DATABASE_URL", "JWT_SECRET"].filter((n) => !env[n]);
    if (faltantes.length) {
        return `Faltan variables obligatorias: ${faltantes.join(", ")}. Copia .env.example a .env (local) o configúralas en el panel del hosting.`;
    }
    if (!/^[a-f0-9]{64}$/i.test(env.JWT_SECRET)) {
        return "JWT_SECRET debe tener 64 caracteres hexadecimales. Genéralo con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"";
    }
    return null;
}

const config = {
    NODE_ENV,
    PRODUCCION,
    PORT: Number(process.env.PORT) || 3000,
    // En local se usa HTTPS propio; en el hosting el proxy termina TLS y la app escucha HTTP.
    HTTPS_ENABLED: booleano(process.env.HTTPS_ENABLED, !PRODUCCION),
    TRUST_PROXY: booleano(process.env.TRUST_PROXY, PRODUCCION),
    CORS_ORIGINS: (process.env.CORS_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
    // Límite de intentos fallidos de login por IP
    LOGIN_MAX_INTENTOS: Number(process.env.LOGIN_MAX_INTENTOS) || 5,
    LOGIN_VENTANA_MIN: Number(process.env.LOGIN_VENTANA_MIN) || 15,
    LOG_LEVEL: process.env.LOG_LEVEL || (PRODUCCION ? "info" : "debug"),
    LOG_FILE: process.env.LOG_FILE || "",
    APP_VERSION: process.env.APP_VERSION || require("../../package.json").version,
    COMMIT: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || "local"
};

module.exports = { config, validarEntorno };
