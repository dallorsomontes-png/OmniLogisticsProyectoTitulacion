
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");

async function restablecerOperador() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/omnilogistics"
    );

    const usuario = await Usuario.findOne({
      username: "operador1",
      rol: "Operador"
    });

    if (!usuario) {
      console.log("No se encontró operador1");
      return;
    }

    const nuevaClave = process.env.OPERADOR_CLAVE_TEMPORAL;

    if (!nuevaClave || nuevaClave.length < 12) {
      throw new Error("La contraseña debe tener al menos 12 caracteres");
    }

    usuario.password_hash = await bcrypt.hash(nuevaClave, 12);
    await usuario.save();

    console.log("Contraseña de operador1 actualizada correctamente");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

restablecerOperador();
