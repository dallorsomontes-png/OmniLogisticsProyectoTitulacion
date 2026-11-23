
"use strict";

const express = require("express");
const router = express.Router();

const productoController = require("../controllers/productoController");

const verificarToken = require("../middlewares/authMiddleware");
const verificarRol = require("../middlewares/roleMiddleware");

// ==========================================
// OMNILOGISTICS - RUTAS DE PRODUCTOS
// ==========================================

// Todas las rutas requieren autenticación JWT
router.use(verificarToken);

// ==========================================
// CONSULTAR INVENTARIO
// Administrador y Operador
// ==========================================

router.get(
  "/",
  verificarRol("Administrador", "Operador"),
  productoController.listarProductos
);

// ==========================================
// ESTADÍSTICAS GLOBALES DE MONGODB
// Administrador y Operador
// ==========================================

router.get(
  "/estadisticas",
  verificarRol("Administrador", "Operador"),
  productoController.estadisticasProductos
);

// ==========================================
// CONSULTAR PRODUCTO POR ID
// Administrador y Operador
// ==========================================

router.get(
  "/:id",
  verificarRol("Administrador", "Operador"),
  productoController.obtenerProducto
);

// ==========================================
// REGISTRAR PRODUCTO
// Solo Administrador
// ==========================================

router.post(
  "/",
  verificarRol("Administrador"),
  productoController.crearProducto
);

// ==========================================
// ACTUALIZAR PRODUCTO
// Solo Administrador
// ==========================================

router.put(
  "/:id",
  verificarRol("Administrador"),
  productoController.actualizarProducto
);

// ==========================================
// ELIMINAR PRODUCTO
// Solo Administrador
// ==========================================

router.delete(
  "/:id",
  verificarRol("Administrador"),
  productoController.eliminarProducto
);

// ==========================================
// EXPORTAR RUTAS
// ==========================================

module.exports = router;
