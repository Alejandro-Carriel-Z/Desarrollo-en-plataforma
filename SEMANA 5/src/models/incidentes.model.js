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

async function listar(filtro = {}) {
  const where = {};
  if (filtro.severidad) where.severidad = filtro.severidad;
  if (filtro.prioridad) where.prioridad = filtro.prioridad;
  if (filtro.estado) where.estado = filtro.estado;

  const filas = await prisma.incidente.findMany({
    where,
    orderBy: { id: "desc" }
  });
  return filas.map(aCliente);
}

async function obtenerPorId(id) {
  const fila = await prisma.incidente.findFirst({
    where: {
      OR: [
        { codigo: String(id) },
        ...(Number(id) ? [{ id: Number(id) }] : [])
      ]
    }
  });
  return aCliente(fila);
}

async function siguienteCodigo() {
  const ultimo = await prisma.incidente.findFirst({ orderBy: { id: "desc" } });
  const n = ultimo ? ultimo.id + 1 : 1;
  return `INC-${String(n).padStart(3, "0")}`;
}

async function guardar(datos) {
  const prioridad = datos.prioridad || datos.severidad;
  const creado = await prisma.incidente.create({
    data: {
      codigo: datos.id || (await siguienteCodigo()),
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      severidad: datos.severidad,
      prioridad,
      estado: datos.estado || "abierto",
      tipo: datos.tipo,
      fecha: datos.fecha,
      reportante: datos.reportante
    }
  });
  return aCliente(creado);
}

async function actualizar(id, cambios) {
  const actual = await prisma.incidente.findFirst({
    where: {
      OR: [
        { codigo: String(id) },
        ...(Number(id) ? [{ id: Number(id) }] : [])
      ]
    }
  });
  if (!actual) return null;

  const data = { ...cambios };
  if (data.severidad && !data.prioridad) data.prioridad = data.severidad;
  delete data.id;

  const actualizado = await prisma.incidente.update({
    where: { id: actual.id },
    data
  });
  return aCliente(actualizado);
}

async function desactivar(id) {
  return actualizar(id, { estado: "Cerrado" });
}

module.exports = { listar, obtenerPorId, guardar, actualizar, desactivar };