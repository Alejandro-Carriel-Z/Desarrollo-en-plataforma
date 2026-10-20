require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

// La conexion se toma de DATABASE_URL (.env); no se dejan credenciales en el codigo.
if (!process.env.DATABASE_URL) {
    throw new Error("Falta DATABASE_URL en .env. Copia .env.example a .env y completalo.");
}
const url = new URL(process.env.DATABASE_URL);

const adapter = new PrismaMariaDb({
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: 5,
    connectTimeout: 10000,
    allowPublicKeyRetrieval: true,
    ...(process.env.DATABASE_SSL === "true" ? { ssl: true } : {})
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;