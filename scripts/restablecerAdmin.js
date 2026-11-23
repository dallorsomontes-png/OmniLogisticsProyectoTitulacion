
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const Usuario = require("../models/Usuario");

async function restablecerAdmin() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const password = await new Promise((resolve) => {
      rl.question("Nueva contraseña del Administrador: ", resolve);
    });

    rl.close();

    if (password.length < 12) {
      throw new Error(
        "La contraseña debe tener al menos 12 caracteres."
      );
    }

    await mongoose.connect(process.env.MONGO_URI);

    const usuario = await Usuario.findOne({
      username: "admin",
      rol: "Administrador"
    });

    if (!usuario) {
      throw new Error("No se encontró el Administrador.");
    }

    usuario.password_hash = await bcrypt.hash(password, 12);
    await usuario.save();

    console.log("Contraseña actualizada correctamente.");

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    rl.close();

    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

restablecerAdmin();
