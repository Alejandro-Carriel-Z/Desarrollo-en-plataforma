import { obtenerIncidente } from "./api.js";
import { etiquetasSeveridad, escapar } from "./vista.js";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const contenedor = document.querySelector("#detalle-contenido");

async function renderizar() {
  if (!id) {
    contenedor.innerHTML = `
      <a class="back-link" href="/">← Volver al centro</a>
      <p class="load-state">Indica un identificador en la URL, por ejemplo <code>detalle.html?id=INC-002</code>.</p>`;
    return;
  }

  try {
    const incidente = await obtenerIncidente(id);
    if (!incidente) {
      contenedor.innerHTML = `
        <a class="back-link" href="/">← Volver al centro</a>
        <p class="load-state">No se encontró el incidente <strong>${escapar(id)}</strong>.</p>`;
      return;
    }

    document.title = `SecureGuard | ${incidente.id}`;
    const severidad = etiquetasSeveridad[incidente.severidad] || incidente.severidad;
    contenedor.innerHTML = `
      <a class="back-link" href="/">← Volver al centro</a>
      <div class="section-heading detail-heading">
        <div>
          <p class="eyebrow">CASO / ${escapar(incidente.id)}</p>
          <h1>${escapar(incidente.titulo)}</h1>
        </div>
        <span class="badge">${escapar(severidad)}</span>
      </div>
      <div class="detail-meta">
        <div><span>ID del incidente</span><strong>${escapar(incidente.id)}</strong></div>
        <div><span>Fecha</span><strong>${escapar(incidente.fecha)}</strong></div>
        <div><span>Estado</span><strong>${escapar(incidente.estado)}</strong></div>
        <div><span>Reportante</span><strong>${escapar(incidente.reportante || "—")}</strong></div>
      </div>
      <div class="detail-copy">
        <h2>Descripción</h2>
        <p>${escapar(incidente.descripcion || "Sin descripción.")}</p>
        <h2>Clasificación</h2>
        <p><strong>Tipo:</strong> ${escapar(incidente.tipo)} · <strong>Severidad:</strong> ${escapar(severidad)}</p>
      </div>`;
  } catch (error) {
    contenedor.innerHTML = `
      <a class="back-link" href="/">← Volver al centro</a>
      <p class="load-state">${escapar(error.message)}</p>`;
  }
}

renderizar();
