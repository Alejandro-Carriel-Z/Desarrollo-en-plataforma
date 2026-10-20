const prisma = require("../lib/prisma");
const { coincide } = require("../security/hash");
const { firmar } = require("../security/token");

async function login(req, res, next) {
    try {
        const correo = String(req.body.correo || "").trim().toLowerCase();
        const clave = String(req.body.password || "");
        const usuario = await prisma.usuario.findUnique({ where: { correo } });
        if (!usuario || !usuario.activo || !(await coincide(clave, usuario.password))) {
            return res.status(401).json({ ok: false, mensaje: "Credenciales inválidas" });
        }
        res.status(200).json({
            ok: true,
            token: firmar(usuario),
            usuario: { nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { login };