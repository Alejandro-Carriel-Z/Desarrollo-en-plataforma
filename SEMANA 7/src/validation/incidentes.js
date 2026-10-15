const CAMPOS_CREACION = [
    "titulo",
    "descripcion",
    "severidad",
    "prioridad",
    "tipo",
    "fecha",
    "correo",
    "reportante"
];
const CAMPOS_REEMPLAZO = [
    "titulo",
    "descripcion",
    "severidad",
    "prioridad",
    "estado",
    "tipo",
    "fecha"
];
const SEVERIDADES = ["critica", "alta", "media", "baja"];
const ESTADOS = ["En investigación", "Contención en curso", "Resuelto"];

function errorValidacion(detalles) {
    const error = new Error("Validación fallida");
    error.status = 400;
    error.detalles = detalles;
    return error;
}

function objetoValido(datos) {
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
        throw errorValidacion({ cuerpo: "Se esperaba un objeto JSON." });
    }
}

function validarCampos(datos, permitidos) {
    const desconocidos = Object.keys(datos).filter((campo) => !permitidos.includes(campo));
    if (desconocidos.length) {
        throw errorValidacion({ campos: `Campos no permitidos: ${desconocidos.join(", ")}.` });
    }
}

function validarTexto(datos, campo, { requerido = true, minimo = 1, maximo = 200 } = {}) {
    if (!Object.hasOwn(datos, campo) && !requerido) return;
    const valor = datos[campo];
    if (typeof valor !== "string") {
        throw errorValidacion({ [campo]: "Debe ser texto." });
    }
    const limpio = valor.trim();
    if ((!limpio && requerido) || limpio.length < minimo || limpio.length > maximo) {
        throw errorValidacion({ [campo]: `Debe tener entre ${minimo} y ${maximo} caracteres.` });
    }
    datos[campo] = limpio;
}

function validarFecha(datos) {
    const fecha = datos.fecha;
    if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        throw errorValidacion({ fecha: "Usa el formato AAAA-MM-DD." });
    }
    const fechaUtc = new Date(`${fecha}T00:00:00.000Z`);
    if (Number.isNaN(fechaUtc.getTime()) || fechaUtc.toISOString().slice(0, 10) !== fecha) {
        throw errorValidacion({ fecha: "La fecha no es válida." });
    }
    if (fecha > new Date().toISOString().slice(0, 10)) {
        throw errorValidacion({ fecha: "La fecha no puede ser futura." });
    }
}

function validarSeveridad(datos, campo) {
    if (!SEVERIDADES.includes(datos[campo])) {
        throw errorValidacion({ [campo]: "Selecciona una severidad válida." });
    }
}

function validarTipo(datos) {
    validarTexto(datos, "tipo", { minimo: 2, maximo: 80 });
}

function validarContenido(datos, { reemplazo = false } = {}) {
    validarTexto(datos, "titulo", { minimo: 5, maximo: 100 });
    validarTexto(datos, "descripcion", { minimo: 20, maximo: 500 });
    validarSeveridad(datos, "severidad");
    validarTipo(datos);
    validarFecha(datos);

    if (Object.hasOwn(datos, "prioridad")) validarSeveridad(datos, "prioridad");
    if (Object.hasOwn(datos, "estado") && !ESTADOS.includes(datos.estado)) {
        throw errorValidacion({ estado: "Selecciona un estado válido." });
    }
    if (Object.hasOwn(datos, "correo")) {
        validarTexto(datos, "correo", { maximo: 254 });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
            throw errorValidacion({ correo: "Ingresa un correo válido." });
        }
    }
    if (Object.hasOwn(datos, "reportante")) {
        validarTexto(datos, "reportante", { maximo: 254 });
    }
    if (!Object.hasOwn(datos, "prioridad") && !reemplazo) {
        datos.prioridad = datos.severidad;
    }
    return datos;
}

function validarCreacion(entrada) {
    objetoValido(entrada);
    validarCampos(entrada, CAMPOS_CREACION);
    const datos = { ...entrada };
    return validarContenido(datos);
}

function validarParche(entrada) {
    objetoValido(entrada);
    validarCampos(entrada, ["estado"]);
    if (!Object.hasOwn(entrada, "estado")) {
        throw errorValidacion({ estado: "Indica el estado que se actualizará." });
    }
    const datos = { estado: entrada.estado };
    validarTexto(datos, "estado", { maximo: 40 });
    if (!ESTADOS.includes(datos.estado)) {
        throw errorValidacion({ estado: "Selecciona un estado válido." });
    }
    return datos;
}

function validarReemplazo(entrada) {
    objetoValido(entrada);
    validarCampos(entrada, CAMPOS_REEMPLAZO);
    const faltantes = CAMPOS_REEMPLAZO.filter((campo) => !Object.hasOwn(entrada, campo));
    if (faltantes.length) {
        throw errorValidacion({ campos: `Faltan campos obligatorios: ${faltantes.join(", ")}.` });
    }
    return validarContenido({ ...entrada }, { reemplazo: true });
}

module.exports = { validarCreacion, validarParche, validarReemplazo };
