const modelo = require("../models/incidentes.model");

function exigir(datos) {
    const errores = {};
    if (!datos.titulo || String(datos.titulo).trim().length < 5) errores.titulo = "Mínimo 5 caracteres.";
    if (!datos.descripcion || String(datos.descripcion).trim().length < 20) errores.descripcion = "Mínimo 20 caracteres.";
    if (!datos.severidad) errores.severidad = "Selecciona una severidad.";
    if (!datos.tipo) errores.tipo = "Selecciona un tipo.";
    if (!datos.fecha) errores.fecha = "Selecciona la fecha.";
    if (Object.keys(errores).length) {
        const error = new Error("Validación fallida");
        error.status = 400;
        error.detalles = errores;
        throw error;
    }
}

async function listar(req, res, next) {
    try {
        const datos = await modelo.listar({
            severidad: req.query.severidad,
            prioridad: req.query.prioridad,
            estado: req.query.estado
        });
        res.status(200).json({ ok: true, total: datos.length, datos });
    } catch (error) {
        next(error);
    }
}

async function obtener(req, res, next) {
    try {
        const incidente = await modelo.obtener(req.params.id);
        if (!incidente) return res.status(404).json({ ok: false, mensaje: "Incidente no encontrado" });
        res.status(200).json({ ok: true, datos: incidente });
    } catch (error) {
        next(error);
    }
}

async function crear(req, res, next) {
    try {
        exigir(req.body);
        res.status(201).json({ ok: true, datos: await modelo.crear(req.body) });
    } catch (error) {
        next(error);
    }
}

async function actualizar(req, res, next) {
    try {
        const actualizado = await modelo.actualizar(req.params.id, req.body);
        if (!actualizado) return res.status(404).json({ ok: false, mensaje: "Incidente no encontrado" });
        res.status(200).json({ ok: true, datos: actualizado });
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        const borrado = await modelo.eliminar(req.params.id);
        if (!borrado) return res.status(404).json({ ok: false, mensaje: "Incidente no encontrado" });
        res.status(200).json({ ok: true, datos: borrado });
    } catch (error) {
        next(error);
    }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };