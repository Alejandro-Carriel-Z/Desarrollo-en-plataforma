const FUENTE_INCIDENTES = './incidentes.json';

export async function obtenerIncidentes() {
    const respuesta = await fetch(FUENTE_INCIDENTES);
    if (!respuesta.ok) {
        throw new Error('No fue posible cargar los incidentes.');
    }
    return respuesta.json();
}

export function crearIncidente(datos) {
    const sufijoTiempo = Date.now().toString().slice(-6);
    const sufijoAleatorio = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return {
        id: `INC-${sufijoTiempo}-${sufijoAleatorio}`,
        titulo: datos.titulo.trim(),
        descripcion: datos.descripcion.trim(),
        severidad: datos.severidad,
        fecha: datos.fecha,
        estado: 'En investigación',
        tipo: datos.tipo
    };
}
