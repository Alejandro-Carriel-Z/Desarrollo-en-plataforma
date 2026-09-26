const servicio = require("../application/incidentes.service");

// status 400 = datos malos, 404 = no existe, 500 = fallo interno
function enviarError(res, error) {
    const status = error.status || 500;
    res.status(status).json({
        ok: false,
        mensaje: error.message || "Error interno del servidor",
        detalles: error.detalles || undefined
    });
}

//GET /api/incidentes  lista completa. 200 + {ok, total, datos}
async function listar(req, res) {
    try {
        const incidentes = await servicio.listarIncidentes();
        res.status(200).json({
            ok: true,
            total: incidentes.length,
            datos: incidentes
        });
    } catch (error) {
        enviarError(res, error);
    }
}

//GET /api/incidentes/:id 

async function obtener(req, res) {
    try {
        const incidente = await servicio.obtenerIncidente(req.params.id);
        if (!incidente) {
            return res.status(404).json({
                ok: false,
                mensaje: "Incidente no encontrado"
            });
        }
        res.status(200).json({ ok: true, datos: incidente });
    } catch (error) {
        enviarError(res, error);
    }
}

// POST /api/incidentes
async function crear(req, res) {
    try {
        const creado = await servicio.registrarIncidente(req.body);
        res.status(201).json({ ok: true, datos: creado });
    } catch (error) {
        enviarError(res, error);
    }
}

// GET /api/salud
async function salud(_req, res) {
    res.status(200).json({
        ok: true,
        servicio: "SecureGuard API",
        unidad:3,
        hora: new Date().toISOString()
    });
}

module.exports = { listar, obtener, crear, salud };