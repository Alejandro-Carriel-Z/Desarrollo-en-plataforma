require("dotenv").config();
const prisma = require("./lib/prisma");
const { crearHash } = require("./security/hash");

// Usuarios de demostración. En producción las claves DEBEN venir de variables
// (SEED_ANALISTA_PASSWORD, SEED_SUPERVISOR_PASSWORD, SEED_ADMIN_PASSWORD).
const PRODUCCION = process.env.NODE_ENV === "production";

const VARIABLES = ["SEED_ANALISTA_PASSWORD", "SEED_SUPERVISOR_PASSWORD", "SEED_ADMIN_PASSWORD"];

function clave(variable, demo) {
    const valor = process.env[variable];
    if (valor) return valor;
    return demo;
}

async function main() {
    // En producción el seed corre en cada arranque (npm run start:prod) y es idempotente (upsert).
    // Si faltan las claves por variable, se omite: nunca se crean cuentas con claves de demostración.
    if (PRODUCCION && VARIABLES.some((v) => !process.env[v])) {
        console.warn("Seed omitido: define SEED_ANALISTA_PASSWORD, SEED_SUPERVISOR_PASSWORD y SEED_ADMIN_PASSWORD.");
        return;
    }
    const cuentas = [
        ["Ana Analista", "analista@secureguard.edu", clave("SEED_ANALISTA_PASSWORD", "analista123"), "analista"],
        ["Sol Supervisor", "supervisor@secureguard.edu", clave("SEED_SUPERVISOR_PASSWORD", "supervisor123"), "supervisor"],
        ["Ada Admin", "admin@secureguard.edu", clave("SEED_ADMIN_PASSWORD", "admin123"), "admin"]
    ];
    for (const [nombre, correo, pass, rol] of cuentas) {
        const password = await crearHash(pass);
        await prisma.usuario.upsert({
            where: { correo },
            update: { nombre, password, rol, activo: true },
            create: { nombre, correo, password, rol }
        });
    }
    console.log("Usuarios listos");
}

main()
    .catch((e) => { console.error(e.message); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
