// Pruebas finales de integración HTTP (supertest) con la base simulada:
// salud, autenticación, autorización, validación, CRUD y rutas sensibles.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "a".repeat(64);
process.env.DATABASE_URL = "mysql://usuario:clave@127.0.0.1:3306/prueba";

jest.mock("../src/lib/prisma", () => ({
    $queryRaw: jest.fn(),
    usuario: { findUnique: jest.fn() }
}));
jest.mock("../src/models/incidentes.model", () => ({
    listar: jest.fn(),
    obtener: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn()
}));

const request = require("supertest");
const bcrypt = require("bcryptjs");
const prisma = require("../src/lib/prisma");
const modelo = require("../src/models/incidentes.model");
const app = require("../src/app");
const { firmar } = require("../src/security/token");
const { limpiar } = require("../src/middleware/logger");

const usuarios = {
    1: { id: 1, correo: "analista@secureguard.edu", rol: "analista", activo: true },
    2: { id: 2, correo: "supervisor@secureguard.edu", rol: "supervisor", activo: true },
    3: { id: 3, correo: "admin@secureguard.edu", rol: "admin", activo: true }
};
const bearer = (id) => `Bearer ${firmar(usuarios[id])}`;
const incidente = {
    titulo: "Acceso sospechoso VPN",
    descripcion: "Múltiples intentos fallidos desde una IP externa",
    severidad: "alta",
    tipo: "phishing",
    fecha: "2026-10-01"
};

beforeEach(() => {
    jest.clearAllMocks();
    prisma.usuario.findUnique.mockImplementation(({ where }) =>
        Promise.resolve(where.id ? usuarios[where.id] : null));
});

describe("health check", () => {
    test("200 con base conectada", async () => {
        prisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
        const r = await request(app).get("/api/salud");
        expect(r.status).toBe(200);
        expect(r.body).toMatchObject({ ok: true, base: "conectada", unidad: 8 });
        expect(r.headers["x-request-id"]).toBeDefined();
    });
    test("503 si la base no responde", async () => {
        prisma.$queryRaw.mockRejectedValue(new Error("ECONNREFUSED"));
        const r = await request(app).get("/api/salud");
        expect(r.status).toBe(503);
        expect(r.body.base).toBe("no disponible");
    });
});

describe("autenticación", () => {
    test("credenciales inválidas → 401", async () => {
        prisma.usuario.findUnique.mockResolvedValue(null);
        const r = await request(app).post("/api/auth/login").send({ correo: "x@y.com", password: "mal" });
        expect(r.status).toBe(401);
    });
    test("login correcto devuelve token firmado sin hash", async () => {
        const hash = await bcrypt.hash("clave-demo", 4);
        prisma.usuario.findUnique.mockResolvedValue({ ...usuarios[1], nombre: "Ana", password: hash });
        const r = await request(app).post("/api/auth/login").send({ correo: "analista@secureguard.edu", password: "clave-demo" });
        expect(r.status).toBe(200);
        expect(r.body.token.split(".")).toHaveLength(3);
        expect(JSON.stringify(r.body)).not.toContain(hash);
    });
    test("token ausente → 401", async () => {
        expect((await request(app).get("/api/incidentes")).status).toBe(401);
    });
    test("token alterado → 401", async () => {
        const r = await request(app).get("/api/incidentes").set("Authorization", bearer(1) + "x");
        expect(r.status).toBe(401);
    });
});

describe("autorización por rol", () => {
    test("analista no puede eliminar → 403", async () => {
        const r = await request(app).delete("/api/incidentes/INC-1").set("Authorization", bearer(1));
        expect(r.status).toBe(403);
        expect(modelo.eliminar).not.toHaveBeenCalled();
    });
    test("supervisor no puede crear → 403", async () => {
        const r = await request(app).post("/api/incidentes").set("Authorization", bearer(2)).send(incidente);
        expect(r.status).toBe(403);
    });
});

describe("CRUD", () => {
    test("analista lista incidentes → 200", async () => {
        modelo.listar.mockResolvedValue([{ id: "INC-1" }]);
        const r = await request(app).get("/api/incidentes").set("Authorization", bearer(1));
        expect(r.status).toBe(200);
        expect(r.body.total).toBe(1);
    });
    test("analista crea con datos válidos → 201", async () => {
        modelo.crear.mockResolvedValue({ id: "INC-2", ...incidente });
        const r = await request(app).post("/api/incidentes").set("Authorization", bearer(1)).send(incidente);
        expect(r.status).toBe(201);
    });
    test("datos incorrectos → 400", async () => {
        const r = await request(app).post("/api/incidentes").set("Authorization", bearer(1)).send({ titulo: "x" });
        expect(r.status).toBe(400);
        expect(modelo.crear).not.toHaveBeenCalled();
    });
    test("JSON mal formado → 400", async () => {
        const r = await request(app).post("/api/incidentes").set("Authorization", bearer(1))
            .set("Content-Type", "application/json").send("{malo");
        expect(r.status).toBe(400);
    });
    test("registro inexistente → 404", async () => {
        modelo.obtener.mockResolvedValue(null);
        const r = await request(app).get("/api/incidentes/NO-EXISTE").set("Authorization", bearer(1));
        expect(r.status).toBe(404);
    });
    test("supervisor cambia estado → 200", async () => {
        modelo.actualizar.mockResolvedValue({ id: "INC-1", estado: "Resuelto" });
        const r = await request(app).patch("/api/incidentes/INC-1").set("Authorization", bearer(2)).send({ estado: "Resuelto" });
        expect(r.status).toBe(200);
    });
    test("admin cierra (DELETE lógico) → 200 con estado Cerrado y auditoría", async () => {
        modelo.eliminar.mockResolvedValue({ id: "INC-1", estado: "Cerrado", actualizadoPor: "admin@secureguard.edu" });
        const r = await request(app).delete("/api/incidentes/INC-1").set("Authorization", bearer(3));
        expect(r.status).toBe(200);
        expect(r.body.datos.estado).toBe("Cerrado");
        expect(modelo.eliminar).toHaveBeenCalledWith("INC-1", "admin@secureguard.edu");
    });
    test("cerrar un incidente ya cerrado → 409", async () => {
        modelo.eliminar.mockResolvedValue({ yaCerrado: true });
        const r = await request(app).delete("/api/incidentes/INC-1").set("Authorization", bearer(3));
        expect(r.status).toBe(409);
    });
    test("supervisor no puede pasar a Cerrado por PATCH → 400", async () => {
        const r = await request(app).patch("/api/incidentes/INC-1").set("Authorization", bearer(2)).send({ estado: "Cerrado" });
        expect(r.status).toBe(400);
        expect(modelo.actualizar).not.toHaveBeenCalled();
    });
    const reemplazo = { ...incidente, prioridad: "media", estado: "Resuelto" };
    test("admin reemplaza con PUT → 200 y registra quién lo hizo", async () => {
        modelo.actualizar.mockResolvedValue({ id: "INC-1", ...reemplazo });
        const r = await request(app).put("/api/incidentes/INC-1").set("Authorization", bearer(3)).send(reemplazo);
        expect(r.status).toBe(200);
        expect(modelo.actualizar).toHaveBeenCalledWith("INC-1", expect.objectContaining({ estado: "Resuelto" }), "admin@secureguard.edu");
    });
    test("supervisor no puede usar PUT → 403", async () => {
        const r = await request(app).put("/api/incidentes/INC-1").set("Authorization", bearer(2)).send(reemplazo);
        expect(r.status).toBe(403);
    });
    test("PUT incompleto → 400", async () => {
        const r = await request(app).put("/api/incidentes/INC-1").set("Authorization", bearer(3)).send({ titulo: "Solo título" });
        expect(r.status).toBe(400);
    });
    test("PUT a un inexistente → 404", async () => {
        modelo.actualizar.mockResolvedValue(null);
        const r = await request(app).put("/api/incidentes/NO-EXISTE").set("Authorization", bearer(3)).send(reemplazo);
        expect(r.status).toBe(404);
    });
});

describe("superficie expuesta", () => {
    test.each(["/.env", "/server.js", "/certs/key.pem", "/package.json", "/src/app.js", "/prisma/schema.prisma"])(
        "%s → 404", async (ruta) => {
            expect((await request(app).get(ruta)).status).toBe(404);
        });
    test("cabeceras de seguridad presentes y sin X-Powered-By", async () => {
        const r = await request(app).get("/");
        expect(r.headers["x-content-type-options"]).toBe("nosniff");
        expect(r.headers["content-security-policy"]).toBeDefined();
        expect(r.headers["x-powered-by"]).toBeUndefined();
    });
    test("el logger oculta campos sensibles", () => {
        expect(limpiar({ authorization: "Bearer abc", password: "x", ruta: "/api" }))
            .toEqual({ authorization: "[OCULTO]", password: "[OCULTO]", ruta: "/api" });
    });
});
