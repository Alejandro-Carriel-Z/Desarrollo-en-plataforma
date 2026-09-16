const etiquetasSeveridad = { critica: "Crítica", alta: "Alta", media: "Media", baja: "Baja" };

function escapar(texto) {
  const elemento = document.createElement("span");
  elemento.textContent = String(texto ?? "");
  return elemento.innerHTML;
}

export function renderizarIncidentes(incidentes, contenedor) {
  if (!incidentes.length) {
    contenedor.innerHTML = '<p class="load-state">No hay incidentes registrados.</p>';
    return;
  }
  contenedor.innerHTML = incidentes.map((incidente, indice) => `
    <article class="incident-card severity-${escapar(incidente.severidad)}" style="animation-delay: ${indice * 80}ms">
      <div class="card-top"><span>${escapar(incidente.id)}</span><span class="badge">${etiquetasSeveridad[incidente.severidad] || "Pendiente"}</span></div>
      <h3>${escapar(incidente.titulo)}</h3>
      <p>${escapar(incidente.tipo)} · ${escapar(incidente.estado)}</p>
      <div class="card-footer"><span>${escapar(incidente.fecha)}</span><a href="/detalle.html?id=${encodeURIComponent(incidente.id)}">Ver detalle ↗</a></div>
    </article>
  `).join("");
}

export function actualizarMetricas(incidentes) {
  document.querySelector("#total-incidentes").textContent = incidentes.length;
  document.querySelector("#incidentes-abiertos").textContent =
    incidentes.filter(({ estado }) => estado !== "Resuelto").length;
}

export function anunciar(mensaje) {
  document.querySelector("#mensaje-estado").textContent = mensaje;
}

export function mostrarCarga(mensaje) {
  document.querySelector("#estado-carga").textContent = mensaje;
}

export function mostrarErrores(errores) {
  Object.entries(errores).forEach(([campo, mensaje]) => {
    const entrada = document.querySelector(`#${campo}`);
    if (!entrada) return;
    const contenedor = entrada.closest(".campo") || entrada.closest(".checkbox");
    const mensajeElemento = document.querySelector(`#${campo}-error`);
    contenedor?.classList.toggle("invalid", Boolean(mensaje));
    entrada.setAttribute("aria-invalid", Boolean(mensaje));
    if (mensajeElemento) mensajeElemento.textContent = mensaje;
  });
}

export { etiquetasSeveridad, escapar };
