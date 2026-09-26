const semilla = [
  {
    id: "INC-001",
    titulo: "Intento de acceso phishing masivo",
    descripcion: "Correos masivos solicitando credenciales del VPN institucional.",
    severidad: "alta",
    fecha: "2026-09-03",
    estado: "En investigación",
    tipo: "Phishing",
    reportante: "soc@secureguard.edu"
  },
  {
    id: "INC-002",
    titulo: "Acceso no autorizado a servidor",
    descripcion: "Inicio de sesión atípico en servidor interno fuera de horario laboral.",
    severidad: "critica",
    fecha: "2026-09-02",
    estado: "Contención en curso",
    tipo: "Acceso no autorizado",
    reportante: "admin@secureguard.edu"
  },
  {
    id: "INC-003",
    titulo: "Vulnerabilidad detectada en aplicación interna",
    descripcion: "Hallazgo de configuración insegura en panel interno de consultas.",
    severidad: "media",
    fecha: "2026-09-01",
    estado: "Resuelto",
    tipo: "Vulnerabilidad",
    reportante: "appsec@secureguard.edu"
  }
];

const incidentes = [...semilla];

function listar(filtro = {}) {
  let resultado = [...incidentes];
  if (filtro.severidad) {
    resultado = resultado.filter((item) => item.severidad === filtro.severidad);
  }
  return resultado;
}

function obtenerPorId(id) {
  return incidentes.find((item) => item.id === id) || null;
}

function guardar(incidente) {
  incidentes.unshift(incidente);
  return incidente;
}

function actualizar(id, cambios) {
  const indice = incidentes.findIndex((item) => item.id === id);
  if (indice === -1) return null;
  incidentes[indice] = { ...incidentes[indice], ...cambios, id };
  return incidentes[indice];
}

function desactivar(id) {
  return actualizar(id, { estado: "Cerrado" });
}

module.exports = { listar, obtenerPorId, guardar, actualizar, desactivar };