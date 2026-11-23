
require("dotenv").config();

const mongoose = require("mongoose");
const SeguridadLog = require("../models/SeguridadLog");

async function verificarSeguridad() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const registros = await SeguridadLog.find()
      .select("-ip_origen -intento_usuario")
      .sort({ fecha_hora: -1 })
      .limit(10)
      .lean();

    console.log("REGISTROS DE CIBERSEGURIDAD:");
    console.log(JSON.stringify(registros, null, 2));

    console.log("Total de registros consultados:", registros.length);

  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

verificarSeguridad();
