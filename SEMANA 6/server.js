require("dotenv").config();
const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const logger = require("./src/middleware/logger");
const { noEncontrado, errorHandler } = require("./src/middleware/errorHandler");
const { exigirToken } = require("./src/security/rol");
const incidentesRoutes = require("./src/routes/incidentes.routes");
const authRoutes = require("./src/routes/auth.routes");

const app = express();
const PUERTO = process.env.PORT || 3000;

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
    console.error("Faltan variables en .env (DATABASE_URL y JWT_SECRET). Copia .env.example a .env y completalas.");
    process.exit(1);
}

const KEY = path.join(__dirname, "certs", "key.pem");
const CERT = path.join(__dirname, "certs", "cert.pem");
if (!fs.existsSync(KEY) || !fs.existsSync(CERT)) {
    console.error("No hay certificado HTTPS. Ejecuta: npm run cert");
    process.exit(1);
}

app.use(cors({
    origin: [
        "https://localhost:3000",
        "https://127.0.0.1:3000",
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(logger);
app.use(express.json());
// Solo se publica la carpeta public/: asi no se exponen .env, certs/ ni el codigo del servidor.
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/salud", (_req, res) => {
    res.status(200).json({ ok: true, servicio: "SecureGuard API", unidad: 6, canal: "https" });
});

app.use("/api/auth", authRoutes);
app.use("/api/incidentes", exigirToken, incidentesRoutes);
app.use(noEncontrado);
app.use(errorHandler);

https.createServer({
    key: fs.readFileSync(KEY),
    cert: fs.readFileSync(CERT)
}, app).listen(PUERTO, () => {
    console.log(`HTTPS en https://localhost:${PUERTO}`);
});