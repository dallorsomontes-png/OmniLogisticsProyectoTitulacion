
const mongoose = require("mongoose");

// ==========================================
// OMNILOGISTICS - MODELO DE PRODUCTOS
// BASE DE DATOS MONGODB (NOSQL)
// ==========================================

const productoSchema = new mongoose.Schema(
  {
    codigo_sku: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    nombre: {
      type: String,
      required: true,
      trim: true
    },

    categoria: {
      type: String,
      required: true,
      trim: true
    },

    marca: {
      type: String,
      required: true,
      trim: true
    },

    especificaciones: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },

    stock_actual: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: "El stock debe ser un número entero."
      }
    },

    stock_minimo: {
      type: Number,
      min: 0,
      default: 5,
      validate: {
        validator: Number.isInteger,
        message: "El stock mínimo debe ser un número entero."
      }
    },

    ubicacion_bodega: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true,
    collection: "productos"
  }
);

// ==========================================
// ÍNDICES PARA CONSULTAS DE INVENTARIO
// ==========================================

// El índice único de codigo_sku ya se crea
// mediante unique: true en el esquema.

// Consultas por categoría y fecha
productoSchema.index({
  categoria: 1,
  createdAt: -1,
  _id: -1
});

// Consultas por marca y fecha
productoSchema.index({
  marca: 1,
  createdAt: -1,
  _id: -1
});

// Ordenamiento general del inventario
productoSchema.index({
  createdAt: -1,
  _id: -1
});

// ==========================================
// EXPORTAR MODELO
// ==========================================

module.exports = mongoose.model(
  "Producto",
  productoSchema
);
