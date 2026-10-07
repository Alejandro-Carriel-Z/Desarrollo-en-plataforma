require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

function configuracionMariaDb(databaseUrl) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: 5,
    // MySQL 8 autentica con caching_sha2_password y el driver no tiene la clave RSA local.
    allowPublicKeyRetrieval: true
  };
}

const adapter = new PrismaMariaDb(configuracionMariaDb(process.env.DATABASE_URL));
const prisma = new PrismaClient({ adapter });

module.exports = prisma;