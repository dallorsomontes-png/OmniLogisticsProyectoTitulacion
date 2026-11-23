
const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    password_hash: {
      type: String,
      required: true,
      select: false
    },

    rol: {
      type: String,
      enum: ["Administrador", "Operador"],
      required: true,
      default: "Operador"
    },

    estado: {
      type: String,
      enum: ["Activo", "Inactivo"],
      default: "Activo"
    }
  },
  {
    timestamps: true,
    collection: "usuarios"
  }
);

module.exports = mongoose.model("Usuario", usuarioSchema);
