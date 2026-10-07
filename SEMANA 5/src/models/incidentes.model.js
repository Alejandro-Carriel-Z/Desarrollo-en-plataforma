const prisma = require("../lib/prisma");
const { etiquetaTipo } = require("../domain/incidente");

const CAMPOS_EDITABLES = [
  "titulo",
  "descripcion",
  "severidad",
  "prioridad",
  "estado",
  "tipo",
  "fecha",
  "reportante"
];

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
  if (filtro.severidad) where.severidad = String(filtro.severidad).trim().toLowerCase();
  if (filtro.prioridad) where.prioridad = String(filtro.prioridad).trim();
  if (filtro.estado) where.estado = String(filtro.estado).trim();
  if (filtro.tipo) where.tipo = etiquetaTipo(filtro.tipo) || String(filtro.tipo).trim();

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

  const data = {};
  for (const campo of CAMPOS_EDITABLES) {
    if (cambios[campo] !== undefined) data[campo] = cambios[campo];
  }
  if (data.severidad && data.prioridad === undefined) data.prioridad = data.severidad;
  if (!Object.keys(data).length) return aCliente(actual);

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