const { crearIncidente } = require("../domain/incidente");
const repositorio = require("../persistence/incidentes.repository");

function validar(datos) {
    const errores = {};
    const titulo = String(datos.titulo || "").trim();
    const descripcion = String(datos.descripcion || "").trim();
    const correo = String(datos.correo || "").trim();

    if (titulo.length < 5) {
        errores.titulo = "Escribe un título de al menos 5 caracteres.";
    } else if (titulo.length > 100) {
        errores.titulo = "El titulo no puede superar los 100 caracteres.";
    }

    if (descripcion.length < 20) {
        errores.descripcion = "La descripción debe tener al menos 20 caracteres.";
    } else if (descripcion.length > 500) {
        errores.descripcion = "La descripción no puede superar los 500 caracteres.";
    }

    if (!datos.severidad) {
        errores.severidad = "Seleccione una severidad";
    }

    if (!datos.tipo) {
        errores.tipo = "Selecciona un tipo de incidente.";
    }

    if (!datos.fecha) {
        errores.fecha = "Selecciona la fecha del incidente.";
    } else if (datos.fecha > new Date().toISOString().slice(0, 10)) {
        errores.fecha = "La fecha no puede ser futura.";
    }

    if (!/^\S+@\S+\.\S+$/.test(correo)) {
        errores.correo = "Introduce un correo válido.";
    }
    return errores;
}

async function listarIncidentes() {
    return repositorio.listar();
}

async function obtenerIncidente(id) {
    return repositorio.obtenerPorId(id);
}

async function registrarIncidente(datos) {
    const errores = validar(datos);

    if (Object.keys(errores).length) {
        const error = new Error("Validación fallida");
        error.status = 400;
        error.detalles = errores;
        throw error;
    }
    
    const incidente = crearIncidente(datos);
    return repositorio.guardar(incidente);
}

module.exports = { listarIncidentes, obtenerIncidente, registrarIncidente };