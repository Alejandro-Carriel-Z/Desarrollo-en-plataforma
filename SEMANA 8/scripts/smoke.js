// Prueba productiva corta (smoke test) contra una URL desplegada o local.
// Uso: BASE_URL=https://tu-app.up.railway.app node scripts/smoke.js
// Opcional: SMOKE_CORREO y SMOKE_PASSWORD (cuenta de demostración, nunca real).
// Local con certificado autofirmado: NODE_TLS_REJECT_UNAUTHORIZED=0 solo en tu PC.
const BASE = (process.env.BASE_URL || "https://localhost:3000").replace(/\/$/, "");
let fallos = 0;

async function caso(nombre, fn) {
    try {
        const detalle = await fn();
        console.log(`OK   ${nombre}${detalle ? " — " + detalle : ""}`);
    } catch (e) {
        fallos++;
        console.log(`FALLA ${nombre} — ${e.message}`);
    }
}
function esperar(real, esperado) {
    if (real !== esperado) throw new Error(`esperado ${esperado}, recibido ${real}`);
}

(async () => {
    console.log(`Smoke test contra ${BASE} — ${new Date().toISOString()}`);
    await caso("GET /api/salud → 200 y base conectada", async () => {
        const r = await fetch(`${BASE}/api/salud`);
        const j = await r.json();
        esperar(r.status, 200);
        esperar(j.base, "conectada");
        return `entorno=${j.entorno} version=${j.version} commit=${String(j.commit).slice(0, 7)}`;
    });
    await caso("GET /api/incidentes sin token → 401", async () => {
        esperar((await fetch(`${BASE}/api/incidentes`)).status, 401);
    });
    await caso("login con credenciales inválidas → 401", async () => {
        const r = await fetch(`${BASE}/api/auth/login`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo: "nadie@secureguard.edu", password: "incorrecta" })
        });
        esperar(r.status, 401);
    });
    for (const ruta of ["/.env", "/server.js", "/certs/key.pem", "/package.json"]) {
        await caso(`GET ${ruta} → 404`, async () => esperar((await fetch(`${BASE}${ruta}`)).status, 404));
    }
    if (process.env.SMOKE_CORREO && process.env.SMOKE_PASSWORD) {
        await caso("login de demostración y listado → 200", async () => {
            const r = await fetch(`${BASE}/api/auth/login`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo: process.env.SMOKE_CORREO, password: process.env.SMOKE_PASSWORD })
            });
            esperar(r.status, 200);
            const { token } = await r.json();
            const l = await fetch(`${BASE}/api/incidentes`, { headers: { Authorization: `Bearer ${token}` } });
            esperar(l.status, 200);
            return `${(await l.json()).total} incidentes`;
        });
    }
    console.log(fallos ? `${fallos} caso(s) fallaron` : "Todos los casos pasaron");
    process.exit(fallos ? 1 : 0);
})();
