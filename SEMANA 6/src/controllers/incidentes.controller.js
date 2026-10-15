const modelo = require("../models/incidentes.model");
const { validarCreacion, validarParche, validarReemplazo } = require("../validation/incidentes");

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
        const datos = validarCreacion(req.body);
        res.status(201).json({ ok: true, datos: await modelo.crear(datos) });
    } catch (error) {
        next(error);
    }
}

async function actualizar(req, res, next) {
    try {
        const cambios = req.method === "PATCH"
            ? validarParche(req.body)
            : validarReemplazo(req.body);
        const actualizado = await modelo.actualizar(req.params.id, cambios);
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