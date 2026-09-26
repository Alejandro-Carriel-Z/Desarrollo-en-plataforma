const { Router } = require("express");
const controlador = require("../controllers/incidentes.controller");

const router = Router();

router.get("/", controlador.listar);
router.get("/:id", controlador.obtener);
router.post("/", controlador.crear);
router.patch("/:id", controlador.actualizar);
router.delete("/:id", controlador.eliminar);

module.exports = router;