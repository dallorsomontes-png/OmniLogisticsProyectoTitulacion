
const express = require("express");
const router = express.Router();

const movimientoController = require("../controllers/movimientoController");

const verificarToken = require("../middlewares/authMiddleware");
const verificarRol = require("../middlewares/roleMiddleware");

// Todas las rutas requieren autenticación JWT
router.use(verificarToken);

// Consultar historial de movimientos
// Administrador y Operador
router.get(
  "/",
  verificarRol("Administrador", "Operador"),
  movimientoController.listarMovimientos
);

// Registrar entradas y salidas
// Solo Administrador
router.post(
  "/",
  verificarRol("Administrador"),
  movimientoController.registrarMovimiento
);

module.exports = router;
