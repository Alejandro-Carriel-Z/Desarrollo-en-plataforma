const fs = require("fs");
const https = require("https");
const path = require("path");
const zlib = require("zlib");
const { createHash } = require("crypto");
const { performance } = require("perf_hooks");

const modo = process.argv[2] || "identity";
if (!["identity", "gzip"].includes(modo)) {
    throw new Error("Uso: node scripts/medir-red.js identity|gzip");
}

const baseUrl = new URL(process.env.BASE_URL || "https://localhost:3000");
const recurso = "/css/estilos.css";
const rutaLocal = path.join(__dirname, "..", "public", "css", "estilos.css");
const cuerpoEsperado = fs.readFileSync(rutaLocal);
const agente = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

function solicitar() {
    return new Promise((resolve, reject) => {
        const inicio = performance.now();
        const solicitud = https.request({
            hostname: baseUrl.hostname,
            port: baseUrl.port || 443,
            path: recurso,
            method: "GET",
            agent: agente,
            headers: {
                "Accept-Encoding": modo === "gzip" ? "gzip" : "identity",
                "Cache-Control": "no-cache"
            }
        }, (respuesta) => {
            const fragmentos = [];
            respuesta.on("data", (fragmento) => fragmentos.push(fragmento));
            respuesta.on("end", () => {
                const cuerpo = Buffer.concat(fragmentos);
                let decodificado;
                try {
                    decodificado = respuesta.headers["content-encoding"] === "gzip"
                        ? zlib.gunzipSync(cuerpo)
                        : cuerpo;
                } catch (error) {
                    reject(new Error(`No se pudo descomprimir la respuesta: ${error.message}`));
                    return;
                }
                const hash = createHash("sha256").update(decodificado).digest("hex");
                if (!decodificado.equals(cuerpoEsperado)) {
                    reject(new Error("El contenido recibido no coincide con estilos.css."));
                    return;
                }
                resolve({
                    estado: respuesta.statusCode,
                    duracionMs: Number((performance.now() - inicio).toFixed(3)),
                    bytesCuerpoTransferidos: cuerpo.length,
                    bytesCuerpoOriginal: decodificado.length,
                    codificacion: respuesta.headers["content-encoding"] || "identity",
                    hashSha256: hash
                });
            });
        });
        solicitud.on("error", reject);
        solicitud.end();
    });
}

async function main() {
    for (let i = 0; i < 2; i++) await solicitar();

    const muestras = [];
    for (let i = 0; i < 10; i++) {
        const muestra = await solicitar();
        if (muestra.estado !== 200) {
            throw new Error(`GET ${recurso} respondió ${muestra.estado}, se esperaba 200.`);
        }
        muestras.push(muestra);
    }
    const ordenadas = muestras.map((muestra) => muestra.duracionMs).sort((a, b) => a - b);
    const medianaMs = Number(((ordenadas[4] + ordenadas[5]) / 2).toFixed(3));
    const resultado = {
        fecha: new Date().toISOString(),
        endpoint: `GET ${recurso}`,
        modo: modo === "gzip" ? "despues-compresion" : "antes-compresion",
        cache: "no-cache; dos calentamientos descartados; sin navegador ni base de datos",
        calentamientosDescartados: 2,
        muestras,
        bytesCuerpoOriginal: muestras[0].bytesCuerpoOriginal,
        medianaMs,
        promedioMs: Number((muestras.reduce((suma, muestra) => suma + muestra.duracionMs, 0) / muestras.length).toFixed(3))
    };
    const destino = path.join(__dirname, "..", "evidencias",
        modo === "gzip" ? "medicion-red-despues.json" : "medicion-red-antes.json");
    fs.writeFileSync(destino, `${JSON.stringify(resultado, null, 2)}\n`);
    console.log(JSON.stringify(resultado, null, 2));
    console.log(`Evidencia guardada: ${path.relative(process.cwd(), destino)}`);
}

main()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => agente.destroy());
