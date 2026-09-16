"use strict";

const servicio = require("../application/incidentes.service");

function enviarJson(res, statusCode, payload) {
  const cuerpo = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(cuerpo),
    "Cache-Control": "no-store"
  });
  res.end(cuerpo);
}

async function manejarApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/salud") {
    enviarJson(res, 200, { ok: true, servicio: "SecureGuard SEMANA 3", timestamp: new Date().toISOString() });
    return true;
  }

  if (req.method === "GET" && pathname === "/api/incidentes") {
    const incidentes = await servicio.listarIncidentes();
    enviarJson(res, 200, incidentes);
    return true;
  }

  const detalle = pathname.match(/^\/api\/incidentes\/([^/]+)$/);
  if (req.method === "GET" && detalle) {
    const incidente = await servicio.obtenerIncidente(decodeURIComponent(detalle[1]));
    if (!incidente) {
      enviarJson(res, 404, { error: "Incidente no encontrado" });
      return true;
    }
    enviarJson(res, 200, incidente);
    return true;
  }

  if (req.method === "POST" && pathname === "/api/incidentes") {
    let cuerpo = "";
    for await (const chunk of req) cuerpo += chunk;
    let datos;
    try {
      datos = JSON.parse(cuerpo || "{}");
    } catch {
      enviarJson(res, 400, { error: "JSON inválido" });
      return true;
    }
    try {
      const creado = await servicio.registrarIncidente(datos);
      enviarJson(res, 201, creado);
    } catch (error) {
      enviarJson(res, error.statusCode || 500, {
        error: error.message,
        errores: error.errores || undefined
      });
    }
    return true;
  }

  return false;
}

module.exports = { manejarApi, enviarJson };
