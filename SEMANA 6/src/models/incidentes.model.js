const prisma = require("../lib/prisma");

function aCliente(row) {
    if (!row) return null;
    return {
        id: row.codigo,
        titulo: row.titulo,
        descripcion: row.descripcion,
        severidad: row.severidad,
        prioridad: row.prioridad,
        fecha: row.fecha,
        estado: row.estado,
        tipo: row.tipo,
        reportante: row.reportante
    };
}

function donde(id) {
    return {
        OR: [
            { codigo: String(id) },
            ...(Number(id) ? [{ id: Number(id) }] : [])
        ]
    };
}

async function listar(filtro = {}) {
    const where = {};
    if (filtro.severidad) where.severidad = filtro.severidad;
    if (filtro.prioridad) where.prioridad = filtro.prioridad;
    if (filtro.estado) where.estado = filtro.estado;
    const filas = await prisma.incidente.findMany({ where, orderBy: { id: "desc" } });
    return filas.map(aCliente);
}

async function obtener(id) {
    return aCliente(await prisma.incidente.findFirst({ where: donde(id) }));
}

async function siguienteCodigo() {
    const ultimo = await prisma.incidente.findFirst({ orderBy: { id: "desc" } });
    return `INC-${String((ultimo ? ultimo.id : 0) + 1).padStart(3, "0")}`;
}

async function crear(datos) {
    const creado = await prisma.incidente.create({
        data: {
            codigo: await siguienteCodigo(),
            titulo: String(datos.titulo).trim(),
            descripcion: String(datos.descripcion).trim(),
            severidad: datos.severidad,
            prioridad: datos.prioridad || datos.severidad,
            estado: "En investigación",
            tipo: datos.tipo,
            fecha: datos.fecha,
            reportante: datos.reportante || datos.correo || "sin-correo"
        }
    });
    return aCliente(creado);
}

async function actualizar(id, cambios) {
    const actual = await prisma.incidente.findFirst({ where: donde(id) });
    if (!actual) return null;
    const data = { ...cambios };
    delete data.id;
    if (data.severidad && !data.prioridad) data.prioridad = data.severidad;
    return aCliente(await prisma.incidente.update({ where: { id: actual.id }, data }));
}

async function eliminar(id) {
    const actual = await prisma.incidente.findFirst({ where: donde(id) });
    if (!actual) return null;
    await prisma.incidente.delete({ where: { id: actual.id } });
    return aCliente(actual);
}

module.exports = { listar, obtener, crear, actualizar, eliminar };