
const mongoose = require("mongoose");

const seguridadLogSchema = new mongoose.Schema(
  {
    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      default: null
    },

    intento_usuario: {
      type: String,
      trim: true,
      default: ""
    },

    ip_origen: {
      type: String,
      required: true
    },

    accion: {
      type: String,
      required: true,
      trim: true
    },

    resultado: {
      type: String,
      enum: ["Exitoso", "Fallido", "Bloqueado"],
      required: true
    },

    nivel_alerta: {
      type: String,
      enum: ["Bajo", "Medio", "Alto", "Critico"],
      default: "Bajo"
    },

    descripcion: {
      type: String,
      trim: true,
      default: ""
    },

    fecha_hora: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true,
    collection: "seguridad_logs"
  }
);

// Índices para consultar eventos de seguridad
seguridadLogSchema.index({
  ip_origen: 1,
  fecha_hora: -1
});

seguridadLogSchema.index({
  nivel_alerta: 1,
  fecha_hora: -1
});

module.exports = mongoose.model(
  "SeguridadLog",
  seguridadLogSchema
);
