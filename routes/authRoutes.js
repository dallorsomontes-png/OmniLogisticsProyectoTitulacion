
const express = require("express");
const router = express.Router();

const {
  registrarUsuario,
  iniciarSesion
} = require("../controllers/authController");

const verificarToken = require("../middlewares/authMiddleware");
const verificarRol = require("../middlewares/roleMiddleware");

// Ruta para iniciar sesión
router.post("/login", iniciarSesion);

// Ruta para registrar usuarios
// Solo puede utilizarla un Administrador
router.post(
  "/registro",
  verificarToken,
  verificarRol("Administrador"),
  registrarUsuario
);

// Ruta para consultar el perfil
router.get("/perfil", verificarToken, (req, res) => {
  res.json({
    mensaje: "Usuario autenticado correctamente",
    usuario: req.usuario
  });
});

module.exports = router;
