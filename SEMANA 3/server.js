"use strict";

const { crearServidor } = require("./src/infrastructure/http");

const PUERTO = Number(process.env.PORT) || 3000;

crearServidor().listen(PUERTO, () => {
  console.log("SecureGuard — Unidad 3 (arquitectura por capas)");
  console.log(`Cliente:  http://localhost:${PUERTO}`);
  console.log(`API JSON: http://localhost:${PUERTO}/api/incidentes`);
  console.log(`Salud:    http://localhost:${PUERTO}/api/salud`);
});
