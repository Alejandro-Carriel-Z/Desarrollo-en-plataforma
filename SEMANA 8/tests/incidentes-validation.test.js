const {
    validarCreacion,
    validarParche,
    validarReemplazo
} = require("../src/validation/incidentes");

const incidenteValido = {
    titulo: "  Acceso irregular  ",
    descripcion: "Inicio de sesión desde una ubicación no habitual.",
    severidad: "alta",
    tipo: "phishing",
    fecha: "2026-09-03"
};

describe("validación de incidentes", () => {
    test("normaliza texto y calcula la prioridad por defecto", () => {
        expect(validarCreacion(incidenteValido)).toEqual({
            ...incidenteValido,
            titulo: "Acceso irregular",
            prioridad: "alta"
        });
    });

    test("rechaza propiedades ajenas al contrato", () => {
        expect(() => validarCreacion({ ...incidenteValido, estado: "Resuelto" }))
            .toThrow(expect.objectContaining({ status: 400 }));
    });

    test("rechaza severidad y fechas no válidas", () => {
        expect(() => validarCreacion({ ...incidenteValido, severidad: "urgente" }))
            .toThrow(expect.objectContaining({ status: 400 }));
        expect(() => validarCreacion({ ...incidenteValido, fecha: "2026-02-30" }))
            .toThrow(expect.objectContaining({ status: 400 }));
    });

    test.each([
        ["título vacío", { titulo: "   " }],
        ["título menor al mínimo", { titulo: "abcd" }],
        ["título mayor al máximo", { titulo: "x".repeat(101) }],
        ["descripción menor al mínimo", { descripcion: "corta" }],
        ["descripción mayor al máximo", { descripcion: "x".repeat(501) }],
        ["severidad ausente", { severidad: undefined }],
        ["tipo ausente", { tipo: undefined }],
        ["fecha con formato inválido", { fecha: "03-09-2026" }],
        ["fecha futura", { fecha: new Date(Date.now() + 86400000).toISOString().slice(0, 10) }],
        ["correo inválido", { correo: "no-es-un-correo" }],
        ["prioridad inválida", { prioridad: "urgente" }],
        ["estado no permitido", { estado: "Cerrado" }]
    ])("rechaza %s en una creación", (_caso, cambio) => {
        expect(() => validarCreacion({ ...incidenteValido, ...cambio }))
            .toThrow(expect.objectContaining({ status: 400 }));
    });

    test.each([null, [], "incidente", 42])("rechaza un cuerpo que no es objeto: %p", (entrada) => {
        expect(() => validarCreacion(entrada))
            .toThrow(expect.objectContaining({ status: 400 }));
    });

    test("acepta título y descripción en sus límites y normaliza espacios", () => {
        const datos = validarCreacion({
            ...incidenteValido,
            titulo: ` ${"x".repeat(100)} `,
            descripcion: ` ${"d".repeat(500)} `,
            prioridad: "critica",
            correo: "persona@empresa.com",
            reportante: "Analista SOC"
        });

        expect(datos.titulo).toBe("x".repeat(100));
        expect(datos.descripcion).toBe("d".repeat(500));
        expect(datos.prioridad).toBe("critica");
    });

    test("el parche solo permite un estado conocido", () => {
        expect(validarParche({ estado: "Resuelto" })).toEqual({ estado: "Resuelto" });
        expect(() => validarParche({ estado: "Resuelto", titulo: "Cambio no autorizado" }))
            .toThrow(expect.objectContaining({ status: 400 }));
        expect(() => validarParche({ estado: "Cerrado" }))
            .toThrow(expect.objectContaining({ status: 400 }));
    });

    test("rechaza un parche vacío o con un estado que no es texto", () => {
        expect(() => validarParche({})).toThrow(expect.objectContaining({ status: 400 }));
        expect(() => validarParche({ estado: 42 })).toThrow(expect.objectContaining({ status: 400 }));
    });

    test("el reemplazo exige campos editables y rechaza internos", () => {
        const reemplazo = {
            ...incidenteValido,
            titulo: "Acceso irregular",
            prioridad: "alta",
            estado: "En investigación"
        };
        expect(validarReemplazo(reemplazo)).toEqual(reemplazo);
        expect(() => validarReemplazo({ ...reemplazo, id: 1 }))
            .toThrow(expect.objectContaining({ status: 400 }));
        expect(() => validarReemplazo({ titulo: reemplazo.titulo }))
            .toThrow(expect.objectContaining({ status: 400 }));
    });

    test("rechaza reemplazo con estado inválido y prioridad inválida", () => {
        const reemplazo = {
            ...incidenteValido,
            titulo: "Acceso irregular",
            prioridad: "alta",
            estado: "En investigación"
        };
        expect(() => validarReemplazo({ ...reemplazo, estado: "Archivado" }))
            .toThrow(expect.objectContaining({ status: 400 }));
        expect(() => validarReemplazo({ ...reemplazo, prioridad: "urgente" }))
            .toThrow(expect.objectContaining({ status: 400 }));
    });
});