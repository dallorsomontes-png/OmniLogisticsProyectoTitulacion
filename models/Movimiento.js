
"use strict";

const mongoose = require("mongoose");

const REGIONES_CHILE = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes"
];

const movimientoSchema = new mongoose.Schema(
  {
    producto_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: true
    },

    usuario_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true
    },

    tipo_movimiento: {
      type: String,
      enum: ["Entrada", "Salida"],
      required: true
    },

    cantidad: {
      type: Number,
      required: true,
      min: 1
    },

    fecha_movimiento: {
      type: Date,
      default: Date.now
    },

    observacion: {
      type: String,
      trim: true,
      default: ""
    },

    // Datos logísticos para análisis Big Data
    region_destino: {
      type: String,
      enum: REGIONES_CHILE,
      default: null
    },

    comuna_destino: {
      type: String,
      trim: true,
      default: ""
    },

    codigo_despacho: {
      type: String,
      trim: true,
      default: ""
    }
  },
  {
    timestamps: true,
    collection: "movimientos"
  }
);

// Optimización de consultas analíticas
movimientoSchema.index({
  tipo_movimiento: 1,
  fecha_movimiento: -1
});

movimientoSchema.index({
  producto_id: 1,
  tipo_movimiento: 1
});

movimientoSchema.index({
  region_destino: 1,
  tipo_movimiento: 1
});

module.exports = mongoose.model(
  "Movimiento",
  movimientoSchema
);
