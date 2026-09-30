const TIPOS = {
  phishing: "Phishing",
  malware: "Malware",
  acceso: "Acceso no autorizado",
  vulnerabilidad: "Vulnerabilidad"
};

function generarId() {
  const tiempo = Date.now().toString().slice(-6);
  const aleatorio = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `INC-${tiempo}-${aleatorio}`;
}

function crearIncidente(datos) {
  return {
    id: generarId(),
    titulo: String(datos.titulo || "").trim(),
    descripcion: String(datos.descripcion || "").trim(),
    severidad: datos.severidad,
    fecha: datos.fecha,
    estado: "En investigación",
    tipo: TIPOS[datos.tipo] || datos.tipo,
    reportante: String(datos.correo || "").trim()
  };
}

module.exports = { crearIncidente, TIPOS };