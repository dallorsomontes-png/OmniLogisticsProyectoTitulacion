
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Usuario = require("../models/Usuario");
const SeguridadLog = require("../models/SeguridadLog");

// Registrar eventos de seguridad
const registrarEvento = async (req, datos) => {
  try {
    await SeguridadLog.create({
      ip_origen: req.ip || "Desconocida",
      ...datos
    });
  } catch (error) {
    console.error("Error de auditoría:", error.message);
  }
};

// Registrar un usuario nuevo
const registrarUsuario = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      username.trim().length < 3 ||
      password.length < 8
    ) {
      return res.status(400).json({
        mensaje: "Usuario o contraseña no válidos"
      });
    }

    const existe = await Usuario.findOne({
      username: username.trim()
    });

    if (existe) {
      return res.status(409).json({
        mensaje: "El usuario ya existe"
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const usuario = await Usuario.create({
      username: username.trim(),
      password_hash,
      rol: "Operador",
      estado: "Activo"
    });

    return res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario: {
        id: usuario._id,
        username: usuario.username,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error("Error de registro:", error.message);

    return res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

// Iniciar sesión
const iniciarSesion = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        mensaje: "Credenciales no válidas"
      });
    }

    const usuario = await Usuario.findOne({
      username: username.trim()
    }).select("+password_hash");

    const passwordValida = usuario
      ? await bcrypt.compare(password, usuario.password_hash)
      : false;

    if (
      !usuario ||
      !passwordValida ||
      usuario.estado !== "Activo"
    ) {
      await registrarEvento(req, {
        intento_usuario: username.trim(),
        accion: "Inicio de sesión",
        resultado: "Fallido",
        nivel_alerta: "Medio",
        descripcion: "Intento de acceso no autorizado"
      });

      return res.status(401).json({
        mensaje: "Credenciales incorrectas o cuenta inactiva"
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET no configurado");
    }

    const token = jwt.sign(
      {
        id: usuario._id.toString()
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
        algorithm: "HS256"
      }
    );

    await registrarEvento(req, {
      usuario_id: usuario._id,
      intento_usuario: usuario.username,
      accion: "Inicio de sesión",
      resultado: "Exitoso",
      nivel_alerta: "Bajo",
      descripcion: "Acceso autorizado"
    });

    return res.json({
      mensaje: "Inicio de sesión correcto",
      token,
      usuario: {
        id: usuario._id,
        username: usuario.username,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error("Error de autenticación:", error.message);

    return res.status(500).json({
      mensaje: "Error interno del servidor"
    });
  }
};

module.exports = {
  registrarUsuario,
  iniciarSesion
};
