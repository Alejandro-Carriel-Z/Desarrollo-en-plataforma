jest.mock("../src/lib/prisma", () => ({
    $transaction: jest.fn(),
    incidente: {
        findFirst: jest.fn()
    }
}));

const prisma = require("../src/lib/prisma");
const modelo = require("../src/models/incidentes.model");

describe("modelo de incidentes", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test.each(["1.5", "1e309", "0", "-1"])(
        "no envía el identificador no válido %s como Int a Prisma",
        async (id) => {
            prisma.incidente.findFirst.mockResolvedValue(null);

            await expect(modelo.obtener(id)).resolves.toBeNull();
            expect(prisma.incidente.findFirst).toHaveBeenCalledWith({
                where: { OR: [{ codigo: id }] }
            });
        }
    );

    test("usa el id numérico para identificadores decimales positivos seguros", async () => {
        prisma.incidente.findFirst.mockResolvedValue(null);

        await modelo.obtener("42");

        expect(prisma.incidente.findFirst).toHaveBeenCalledWith({
            where: { OR: [{ codigo: "42" }, { id: 42 }] }
        });
    });

    test("asigna códigos según el id insertado dentro de una transacción", async () => {
        let siguienteId = 40;
        prisma.$transaction.mockImplementation(async (operacion) => {
            const transaccion = {
                incidente: {
                    create: jest.fn(async ({ data }) => ({ id: siguienteId++, ...data })),
                    update: jest.fn(async ({ where, data }) => ({
                        id: where.id,
                        titulo: "Acceso irregular",
                        descripcion: "Inicio de sesión desde ubicación no habitual.",
                        severidad: "alta",
                        prioridad: "alta",
                        fecha: "2026-09-03",
                        estado: "En investigación",
                        tipo: "phishing",
                        reportante: "sin-correo",
                        ...data
                    }))
                }
            };
            return operacion(transaccion);
        });
        const datos = {
            titulo: "Acceso irregular",
            descripcion: "Inicio de sesión desde ubicación no habitual.",
            severidad: "alta",
            tipo: "phishing",
            fecha: "2026-09-03"
        };

        const resultados = await Promise.all([
            modelo.crear(datos),
            modelo.crear(datos)
        ]);

        expect(resultados.map((incidente) => incidente.id)).toEqual(["INC-040", "INC-041"]);
        expect(new Set(resultados.map((incidente) => incidente.id)).size).toBe(2);
        expect(prisma.$transaction).toHaveBeenCalledTimes(2);
        expect(prisma.incidente.findFirst).not.toHaveBeenCalled();
    });
});
