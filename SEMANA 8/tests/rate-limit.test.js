// Rate limiting del login: 5 intentos fallidos por IP en 15 min → 429.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "b".repeat(64);
process.env.DATABASE_URL = "postgresql://usuario:clave@127.0.0.1:5432/prueba";

jest.mock("../src/lib/prisma", () => ({
    $queryRaw: jest.fn(),
    usuario: { findUnique: jest.fn().mockResolvedValue(null) }
}));

const request = require("supertest");
const app = require("../src/app");

describe("rate limiting del login", () => {
    test("el sexto intento fallido devuelve 429 con mensaje JSON", async () => {
        const intento = () => request(app).post("/api/auth/login").send({ correo: "x@y.com", password: "mala" });
        for (let i = 0; i < 5; i++) {
            expect((await intento()).status).toBe(401);
        }
        const r = await intento();
        expect(r.status).toBe(429);
        expect(r.body.ok).toBe(false);
        expect(r.body.mensaje).toMatch(/Demasiados intentos/);
        expect(r.headers["ratelimit-policy"] || r.headers.ratelimit).toBeDefined();
    });
    test("las rutas de incidentes no consumen el límite del login", async () => {
        expect((await request(app).get("/api/incidentes")).status).toBe(401);
    });
});
