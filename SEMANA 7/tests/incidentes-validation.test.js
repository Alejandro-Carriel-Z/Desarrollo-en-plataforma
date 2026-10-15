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

    test("el parche solo permite un estado conocido", () => {
        expect(validarParche({ estado: "Resuelto" })).toEqual({ estado: "Resuelto" });
        expect(() => validarParche({ estado: "Resuelto", titulo: "Cambio no autorizado" }))
            .toThrow(expect.objectContaining({ status: 400 }));
        expect(() => validarParche({ estado: "Cerrado" }))
            .toThrow(expect.objectContaining({ status: 400 }));
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
});