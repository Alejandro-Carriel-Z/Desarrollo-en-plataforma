const prisma = require("../lib/prisma");
const { randomUUID } = require("crypto");

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
    const textoId = String(id);
    const idNumerico = /^[1-9]\d*$/.test(textoId) ? Number(textoId) : null;
    return {
        OR: [
            { codigo: textoId },
            ...(Number.isSafeInteger(idNumerico) ? [{ id: idNumerico }] : [])
        ]
    };
}

async function listar(filtro = {}) {
    const where = {};
    if (filtro.severidad) where.severidad = filtro.severidad;
    if (filtro.prioridad) where.prioridad = filtro.prioridad;
    if (filtro.estado) where.estado = filtro.estado;
    const filas = await prisma.incidente.findMany({
        where,
        orderBy: { id: "desc" },
        select: {
            codigo: true,
            titulo: true,
            descripcion: true,
            severidad: true,
            prioridad: true,
            fecha: true,
            estado: true,
            tipo: true,
            reportante: true
        }
    });
    return filas.map(aCliente);
}

async function obtener(id) {
    return aCliente(await prisma.incidente.findFirst({ where: donde(id) }));
}

async function crear(datos) {
    return prisma.$transaction(async (transaccion) => {
        const creado = await transaccion.incidente.create({
            data: {
                codigo: `PEND-${randomUUID()}`,
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
        const codigo = `INC-${String(creado.id).padStart(3, "0")}`;
        return aCliente(await transaccion.incidente.update({
            where: { id: creado.id },
            data: { codigo }
        }));
    });
}

async function actualizar(id, cambios) {
    const actual = await prisma.incidente.findFirst({ where: donde(id) });
    if (!actual) return null;
    const camposPermitidos = ["titulo", "descripcion", "severidad", "prioridad", "estado", "tipo", "fecha"];
    const data = {};
    for (const campo of camposPermitidos) {
        if (Object.hasOwn(cambios, campo)) data[campo] = cambios[campo];
    }
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