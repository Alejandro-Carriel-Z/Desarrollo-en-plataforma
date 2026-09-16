const API_BASE = "/api/incidentes";

export async function obtenerIncidentes() {
  const respuesta = await fetch(API_BASE);
  if (!respuesta.ok) throw new Error("No fue posible cargar los incidentes desde la API.");
  return respuesta.json();
}

export async function obtenerIncidente(id) {
  const respuesta = await fetch(`${API_BASE}/${encodeURIComponent(id)}`);
  if (respuesta.status === 404) return null;
  if (!respuesta.ok) throw new Error("No fue posible cargar el detalle del incidente.");
  return respuesta.json();
}

export async function crearIncidenteRemoto(datos) {
  const respuesta = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos)
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    const error = new Error(cuerpo.error || "No se pudo crear el incidente.");
    error.errores = cuerpo.errores || {};
    throw error;
  }
  return cuerpo;
}
