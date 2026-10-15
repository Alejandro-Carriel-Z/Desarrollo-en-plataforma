require("dotenv").config();
const prisma = require("./lib/prisma");
const { crearHash } = require("./security/hash");

async function main() {
    const cuentas = [
        ["Ana Analista", "analista@secureguard.edu", "analista123", "analista"],
        ["Sol Supervisor", "supervisor@secureguard.edu", "supervisor123", "supervisor"],
        ["Ada Admin", "admin@secureguard.edu", "admin123", "admin"]
    ];
    for (const [nombre, correo, clave, rol] of cuentas) {
        const password = await crearHash(clave);
        await prisma.usuario.upsert({
            where: { correo },
            update: { nombre, password, rol, activo: true },
            create: { nombre, correo, password, rol }
        });
    }
    console.log("Usuarios listos");
}

main().finally(() => prisma.$disconnect());