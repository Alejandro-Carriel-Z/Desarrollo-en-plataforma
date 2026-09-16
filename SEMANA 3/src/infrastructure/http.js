const fsPromises = require("fs/promises");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const controlador = require("../presentation/incidentes.controller");
const PUBLICO = path.join(__dirname, "../../public");

const MIME = {
    ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function leerCuerpo(req) {
    return new Promise((resolve, reject) => {
        const trozos = [];
        req.on("data", (parte) => trozos.push(parte));
        req.on("end", () => {
            const raw = Buffer.concat(trozos).toString("utf8");
            if (!raw) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch (_error) {
                reject(Object.assign(new Error("JSON inválido"), { status: 400}));
            }
        });
        req.on("error", reject);
    });
}

function enviarJson(res, status, cuerpo) {
    const payload = JSON.stringify(cuerpo);
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(payload)
    });
    res.end(payload);
}

function adaptarRespuesta(res) {
    return {
        _status: 200,
        status(codigo) {
            this._status = codigo;
            return this;
        },
        json(cuerpo) {
            enviarJson(res, this._status || 200, cuerpo);
        }
    };
}

async function servirEstatico(rutaURL, res) {
    let relativa = decodeURIComponent(rutaURL);
    if (relativa === "/") relativa = "/index.html";

    const absoluto = path.normalize(path.join(PUBLICO, relativa));
    if (!absoluto.startsWith(PUBLICO)) {
        res.writeHead(403);
        return res.end("Prohibido");
    }

    try {
        const datos = await fsPromises.readFile(absoluto);
        const ext = path.extname(absoluto);
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(datos);
    } catch (_error) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Recurso no encontrado");
    }
}

function crearServidor() {
    return http.createServer(async (req, res) => {
        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        const metodo = req.method.toUpperCase();
        const ruta = url.pathname;
        const fakeRes = adaptarRespuesta(res);

        try {
            if (metodo === "GET" && ruta === "/api/salud") {
                return controlador.salud(req, fakeRes);
            }

            if (metodo === "GET" && ruta === "/api/incidentes") {
                return controlador.listar(req, fakeRes);
            }

            const detalle = ruta.match(/^\/api\/incidentes\/([^/]+)$/);
            if (metodo === "GET" && detalle) {
                req.params = { id: decodeURIComponent(detalle[1]) };
                return controlador.obtener(req, fakeRes);
            }

            if (metodo === "POST" && ruta === "/api/incidentes") {
                req.body = await leerCuerpo(req);
                return controlador.crear(req, fakeRes);
            }

            if (ruta.startsWith("/api/")) {
                return enviarJson(res, 404, { ok: false, mensaje: "Ruta no encontrada" });
            }

            if (metodo === "GET" || metodo === "HEAD") {
                return servirEstatico(ruta, res);
            }

            res.writeHead(405);
            res.end("Método no permitido");
        } catch (error) {
            enviarJson(res, error.status || 500, {
                ok: false,
                mensaje: error.message || "Error interno del servidor"
            });
        }
    });
}

module.exports = { crearServidor };