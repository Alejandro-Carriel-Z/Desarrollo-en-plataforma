"use strict";

const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const { URL } = require("url");
const { manejarApi, enviarJson } = require("../presentation/api.controller");

const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf"
};

function rutaSegura(pathname) {
  const limpia = decodeURIComponent(pathname.split("?")[0]);
  const relativa = limpia === "/" ? "/index.html" : limpia;
  const absoluta = path.normalize(path.join(PUBLIC_DIR, relativa));
  if (!absoluta.startsWith(PUBLIC_DIR)) return null;
  return absoluta;
}

async function servirEstatico(req, res, pathname) {
  const archivo = rutaSegura(pathname);
  if (!archivo) {
    enviarJson(res, 400, { error: "Ruta inválida" });
    return;
  }
  try {
    const data = await fs.readFile(archivo);
    const ext = path.extname(archivo).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    enviarJson(res, 404, { error: "Recurso no encontrado" });
  }
}

function crearServidor() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      const pathname = url.pathname;

      if (pathname.startsWith("/api/")) {
        const atendido = await manejarApi(req, res, pathname);
        if (!atendido) enviarJson(res, 404, { error: "Endpoint no encontrado" });
        return;
      }

      await servirEstatico(req, res, pathname);
    } catch (error) {
      console.error("[SecureGuard]", error);
      if (!res.headersSent) enviarJson(res, 500, { error: "Error interno del servidor" });
    }
  });
}

module.exports = { crearServidor };
