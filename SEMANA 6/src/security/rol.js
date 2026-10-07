const prisma = require("../lib/prisma");
const { verificar } = require("./token");

async function exigirToken(req, res, next) {
    const encabezado = req.headers.authorization || "";
    const token = encabezado.startsWith("Bearer ") ? encabezado.slice(7) : "";
    if (!token) return res.status(401).json({ ok: false, mensaje: "Token ausente" });
    try {
        const payload = verificar(token);
        const usuario = await prisma.usuario.findUnique({ where: { id: payload.id } });
        if (!usuario || !usuario.activo) {
            return res.status(401).json({ ok: false, mensaje: "Usuario no activo" });
        }
        req.usuario = { id: usuario.id, correo: usuario.correo, rol: usuario.rol };
        next();
    } catch (error) {
        return res.status(401).json({ ok: false, mensaje: "Token inválido o vencido" });
    }
}

function exigirRol(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.usuario.rol)) {
            return res.status(403).json({ ok: false, mensaje: "Permiso insuficiente" });
        }
        next();
    };
}

module.exports = { exigirToken, exigirRol };