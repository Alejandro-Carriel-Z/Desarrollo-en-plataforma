const fs = require('fs/promises');
const path = require('path');
const ARCHIVO = path.join(__dirname, 'data', 'incidentes.json');
async function listar() { return JSON.parse(await fs.readFile(ARCHIVO, 'utf8')); }
async function obtenerPorId(id) { return (await listar()).find((i) => i.id === id) || null; }
async function guardar(incidente) {
  const actualizados = [incidente, ...(await listar())];
  await fs.writeFile(ARCHIVO, JSON.stringify(actualizados, null, 2), 'utf8');
  return incidente;
}
module.exports = { listar, obtenerPorId, guardar };
