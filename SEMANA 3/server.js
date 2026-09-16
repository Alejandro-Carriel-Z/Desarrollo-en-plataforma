const { crearServidor } = require('./src/infrastructure/http');
const PUERTO = process.env.PORT || 3000;
crearServidor().listen(PUERTO, () => {
  console.log('SecureGuard — Unidad 3');
  console.log(`Cliente:  http://localhost:${PUERTO}`);
  console.log(`API JSON: http://localhost:${PUERTO}/api/incidentes`);
});
