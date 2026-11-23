
require("dotenv").config();

const mongoose = require("mongoose");
const Usuario = require("../models/Usuario");

async function verificarAdministrador() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const administradores = await Usuario.find({
      rol: "Administrador"
    }).select("username rol estado");

    console.log("Administradores encontrados:");

    console.log(
      JSON.stringify(administradores, null, 2)
    );

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verificarAdministrador();
