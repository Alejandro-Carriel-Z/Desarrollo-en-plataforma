require("dotenv").config();
const path = require("path");
const express = require("express");
const logger = require("./src/middleware/logger");
const { noEncontrado, errorHandler } = require("./src/middleware/errorHandler");
const incidentesRoutes = require("./src/routes/incidentes.routes");
const PUERTO = process.env.PORT || 3000;
const app = express();

app.use(logger);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/salud", (_req, res) => {
  res.status(200).json({
    ok: true,
    servicio: "SecureGuard API",
    unidad: 4,
    hora: new Date().toISOString()
  });
});

app.use("/api/incidentes", incidentesRoutes);
app.use(noEncontrado);
app.use(errorHandler);

app.listen(PUERTO, () => {
  console.log("SecureGuard - Unidad 4");
  console.log(`Cliente: http://localhost:${PUERTO}`);
  console.log(`Salud:   http://localhost:${PUERTO}/api/salud`);
});