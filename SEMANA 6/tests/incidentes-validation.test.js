const test = require("node:test");
const assert = require("node:assert/strict");
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

function errorDeValidacion(funcion, entrada) {
    assert.throws(() => funcion(entrada), (error) => error.status === 400);
}

test("validarCreacion normaliza texto y calcula la prioridad por defecto", () => {
    assert.deepEqual(validarCreacion(incidenteValido), {
        ...incidenteValido,
        titulo: "Acceso irregular",
        prioridad: "alta"
    });
});

test("validarCreacion rechaza propiedades ajenas al contrato", () => {
    errorDeValidacion(validarCreacion, { ...incidenteValido, estado: "Resuelto" });
});

test("validarCreacion rechaza severidad y fechas no válidas", () => {
    errorDeValidacion(validarCreacion, { ...incidenteValido, severidad: "urgente" });
    errorDeValidacion(validarCreacion, { ...incidenteValido, fecha: "2026-02-30" });
});

test("validarParche permite únicamente un estado conocido", () => {
    assert.deepEqual(validarParche({ estado: "Resuelto" }), { estado: "Resuelto" });
    errorDeValidacion(validarParche, { estado: "Resuelto", titulo: "Cambio no autorizado" });
    errorDeValidacion(validarParche, { estado: "Cerrado" });
});

test("validarReemplazo requiere todos los campos editables y rechaza campos internos", () => {
    const reemplazo = {
        ...incidenteValido,
        titulo: "Acceso irregular",
        prioridad: "alta",
        estado: "En investigación"
    };
    assert.deepEqual(validarReemplazo(reemplazo), reemplazo);
    errorDeValidacion(validarReemplazo, { ...reemplazo, id: 1 });
    errorDeValidacion(validarReemplazo, { titulo: reemplazo.titulo });
});
