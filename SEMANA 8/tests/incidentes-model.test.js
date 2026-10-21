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

describe("borrado lógico y auditoría", () => {
    const fila = { id: 7, codigo: "INC-007", titulo: "t", descripcion: "d", severidad: "alta", prioridad: "alta", estado: "Resuelto", tipo: "phishing", fecha: "2026-10-01", reportante: "r" };

    beforeEach(() => {
        jest.clearAllMocks();
        prisma.incidente.update = jest.fn();
        prisma.incidente.delete = jest.fn();
    });

    test("eliminar no borra: actualiza a Cerrado con el usuario", async () => {
        prisma.incidente.findFirst.mockResolvedValue(fila);
        prisma.incidente.update.mockResolvedValue({ ...fila, estado: "Cerrado", actualizadoPor: "admin@x.com" });
        const r = await modelo.eliminar("INC-007", "admin@x.com");
        expect(prisma.incidente.delete).not.toHaveBeenCalled();
        expect(prisma.incidente.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { estado: "Cerrado", actualizadoPor: "admin@x.com" } });
        expect(r.estado).toBe("Cerrado");
    });

    test("cerrar uno ya cerrado no lo modifica", async () => {
        prisma.incidente.findFirst.mockResolvedValue({ ...fila, estado: "Cerrado" });
        await expect(modelo.eliminar("INC-007", "admin@x.com")).resolves.toEqual({ yaCerrado: true });
        expect(prisma.incidente.update).not.toHaveBeenCalled();
    });

    test("actualizar registra actualizadoPor", async () => {
        prisma.incidente.findFirst.mockResolvedValue(fila);
        prisma.incidente.update.mockResolvedValue(fila);
        await modelo.actualizar("INC-007", { estado: "Resuelto", id: 99 }, "sup@x.com");
        expect(prisma.incidente.update).toHaveBeenCalledWith({ where: { id: 7 }, data: { estado: "Resuelto", actualizadoPor: "sup@x.com" } });
    });
});
