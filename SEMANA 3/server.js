const { crearServidor } = require("./src/infrastructure/http");
const PUERTO = process.env.PORT || 3000;
const servidor = crearServidor();

servidor.listen(PUERTO, () => {
    console.log("SecureGuard - Unidad 3");
    console.log(`Cliente: http://localhost:${PUERTO}`);
    console.log(`API JSON: http://localhost:${PUERTO}/api/incidentes`);
    console.log(`Salud: http://localhost:${PUERTO}/api/salud`);
});