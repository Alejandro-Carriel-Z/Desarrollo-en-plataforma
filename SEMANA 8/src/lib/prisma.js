require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// La conexión sale de DATABASE_URL (.env local o panel de Render); no hay credenciales en el código.
if (!process.env.DATABASE_URL) {
    throw new Error("Falta DATABASE_URL en .env. Copia .env.example a .env y complétalo.");
}

// DATABASE_SSL=true cuando la base exige TLS (por ejemplo, la URL externa de Render Postgres).
// La URL interna de Render (misma región) no necesita TLS.
const ssl = process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10000,
    ...(ssl ? { ssl } : {})
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
