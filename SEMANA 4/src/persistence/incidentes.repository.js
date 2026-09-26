const fs = require("fs/promises");
const path = require("path");
const ARCHIVO = path.join(__dirname, "data", "incidentes.json");

async function listar() {
    const texto = await fs.readFile(ARCHIVO, "utf8");
    return JSON.parse(texto);
}

async function obtenerPorId(id) {
    const incidentes = await listar();
    return incidentes.find((item) => item.id === id) || null;   
}

async function guardar(incidente) {
    const incidentes = await listar();
    const actualizados = [incidente, ...incidentes];
    await fs.writeFile(ARCHIVO, JSON.stringify(actualizados, null, 2), "utf8");
    return incidente;    
}

module.exports = { listar, obtenerPorId, guardar};