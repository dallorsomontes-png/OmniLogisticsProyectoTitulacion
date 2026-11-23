
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/Usuario");

const crearAdministrador = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existeAdmin = await Usuario.exists({
      rol: "Administrador"
    });

    if (existeAdmin) {
      console.log("Ya existe un Administrador.");
      return;
    }

    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;

    if (
      !username ||
      username.trim().length < 3 ||
      !password ||
      password.length < 12
    ) {
      throw new Error(
        "Configura ADMIN_USERNAME y ADMIN_PASSWORD (mínimo 12 caracteres)."
      );
    }

    const usuarioExistente = await Usuario.exists({
      username: username.trim()
    });

    if (usuarioExistente) {
      throw new Error("El nombre de usuario ya existe.");
    }

    const password_hash = await bcrypt.hash(password, 12);

    await Usuario.create({
      username: username.trim(),
      password_hash,
      rol: "Administrador",
      estado: "Activo"
    });

    console.log("Administrador creado correctamente.");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

crearAdministrador();
