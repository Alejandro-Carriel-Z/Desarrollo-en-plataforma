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
        reportante: row.reportante,
        actualizadoPor: row.actualizadoPor || null,
        actualizadoEn: row.updatedAt || null
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
            reportante: true,
            actualizadoPor: true,
            updatedAt: true
        }
    });
    return filas.map(aCliente);
}

async function obtener(id) {
    return aCliente(await prisma.incidente.findFirst({ where: donde(id) }));
}

async function crear(datos, usuario = null) {
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
                reportante: datos.reportante || datos.correo || "sin-correo",
                actualizadoPor: usuario
            }
        });
        const codigo = `INC-${String(creado.id).padStart(3, "0")}`;
        return aCliente(await transaccion.incidente.update({
            where: { id: creado.id },
            data: { codigo }
        }));
    });
}

async function actualizar(id, cambios, usuario = null) {
    const actual = await prisma.incidente.findFirst({ where: donde(id) });
    if (!actual) return null;
    const camposPermitidos = ["titulo", "descripcion", "severidad", "prioridad", "estado", "tipo", "fecha"];
    const data = {};
    for (const campo of camposPermitidos) {
        if (Object.hasOwn(cambios, campo)) data[campo] = cambios[campo];
    }
    if (data.severidad && !data.prioridad) data.prioridad = data.severidad;
    data.actualizadoPor = usuario;
    return aCliente(await prisma.incidente.update({ where: { id: actual.id }, data }));
}

// Borrado lógico: el incidente no se elimina, pasa a "Cerrado" y queda para auditoría.
// Devuelve null si no existe y { yaCerrado: true } si ya estaba cerrado.
async function eliminar(id, usuario = null) {
    const actual = await prisma.incidente.findFirst({ where: donde(id) });
    if (!actual) return null;
    if (actual.estado === "Cerrado") return { yaCerrado: true };
    return aCliente(await prisma.incidente.update({
        where: { id: actual.id },
        data: { estado: "Cerrado", actualizadoPor: usuario }
    }));
}

module.exports = { listar, obtener, crear, actualizar, eliminar };