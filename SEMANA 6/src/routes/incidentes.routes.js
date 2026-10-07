const express = require("express");
const controlador = require("../controllers/incidentes.controller");
const { exigirRol } = require("../security/rol");

const router = express.Router();

router.get("/", controlador.listar);
router.get("/:id", controlador.obtener);
router.post("/", exigirRol("analista", "admin"), controlador.crear);
router.patch("/:id", exigirRol("supervisor", "admin"), controlador.actualizar);
router.put("/:id", exigirRol("admin"), controlador.actualizar);
router.delete("/:id", exigirRol("admin"), controlador.eliminar);

module.exports = router;