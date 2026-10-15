const bcrypt = require("bcryptjs");

function crearHash(clave) {
    return bcrypt.hash(clave, 10);
}

function coincide(clave, hash) {
    return bcrypt.compare(clave, hash);
}

module.exports = { crearHash, coincide };