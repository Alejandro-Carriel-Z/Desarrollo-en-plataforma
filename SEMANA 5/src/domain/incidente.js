const TIPOS = {
  phishing: "Phishing",
  malware: "Malware",
  acceso: "Acceso no autorizado",
  vulnerabilidad: "Vulnerabilidad"
};

const SEVERIDADES = ["critica", "alta", "media", "baja"];

const ESTADOS = [
  "abierto",
  "En investigación",
  "Contención en curso",
  "Resuelto",
  "Cerrado"
];

function generarId() {
  const tiempo = Date.now().toString().slice(-6);
  const aleatorio = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `INC-${tiempo}-${aleatorio}`;
}

function etiquetaTipo(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return "";
  if (TIPOS[texto]) return TIPOS[texto];
  const porEtiqueta = Object.values(TIPOS).find(
    (etiqueta) => etiqueta.toLowerCase() === texto.toLowerCase()
  );
  return porEtiqueta || "";
}

function crearIncidente(datos) {
  return {
    id: generarId(),
    titulo: String(datos.titulo || "").trim(),
    descripcion: String(datos.descripcion || "").trim(),
    severidad: String(datos.severidad || "").trim().toLowerCase(),
    fecha: String(datos.fecha || "").trim(),
    estado: "En investigación",
    tipo: etiquetaTipo(datos.tipo),
    reportante: String(datos.correo || datos.reportante || "").trim()
  };
}

module.exports = { crearIncidente, TIPOS, SEVERIDADES, ESTADOS, etiquetaTipo };
