const jwt = require("jsonwebtoken");

function firmar(usuario) {
    return jwt.sign(
        { id: usuario.id, rol: usuario.rol },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
    );
}

function verificar(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { firmar, verificar };