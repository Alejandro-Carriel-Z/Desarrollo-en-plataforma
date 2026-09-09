const FUENTE_INCIDENTES = '../incidentes.json';

export async function obtenerIncidentes() {
    const respuesta = await fetch(FUENTE_INCIDENTES);
    if (!respuesta.ok) {
        throw new Error('No fue posible cargar los incidentes.');
    }
    return respuesta.json();
}

export function crearIncidente(datos) {
    return {
        id: `INC-${String(Date.now()).slice(-3)}`,
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        severidad: datos.severidad,
        fecha: datos.fecha,
        estado: 'En investigación',
        tipo: datos.tipo
    };
}
