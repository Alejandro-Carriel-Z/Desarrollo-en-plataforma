require("dotenv").config();
const prisma = require("./lib/prisma");
const { crearHash } = require("./security/hash");

// Usuarios de demostración. En producción las claves DEBEN venir de variables
// (SEED_ANALISTA_PASSWORD, SEED_SUPERVISOR_PASSWORD, SEED_ADMIN_PASSWORD).
const PRODUCCION = process.env.NODE_ENV === "production";

function clave(variable, demo) {
    const valor = process.env[variable];
    if (valor) return valor;
    if (PRODUCCION) throw new Error(`Falta ${variable}: en producción no se usan claves de demostración.`);
    return demo;
}

async function main() {
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
