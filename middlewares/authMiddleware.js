
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");

const verificarToken = async (req, res, next) => {
  try {
    const autorizacion = req.headers.authorization;

    if (
      !autorizacion ||
      !autorizacion.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        mensaje: "Acceso denegado. Token requerido."
      });
    }

    const token = autorizacion.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        mensaje: "Token no proporcionado."
      });
    }

    const datos = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ["HS256"] }
    );

    const usuario = await Usuario.findById(datos.id);

    if (!usuario || usuario.estado !== "Activo") {
      return res.status(401).json({
        mensaje: "Usuario no autorizado."
      });
    }

    req.usuario = {
      id: usuario._id,
      username: usuario.username,
      rol: usuario.rol
    };

    next();

  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        mensaje: "Token inválido o expirado."
      });
    }

    console.error("Error de autenticación:", error.message);

    return res.status(500).json({
      mensaje: "Error interno del servidor."
    });
  }
};

module.exports = verificarToken;
