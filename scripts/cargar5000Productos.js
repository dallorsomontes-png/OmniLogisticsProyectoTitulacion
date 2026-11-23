
"use strict";

require("dotenv").config();

const mongoose = require("mongoose");
const Producto = require("../models/Producto");

// ==========================================
// OMNILOGISTICS
// CARGA DE 5.000 PRODUCTOS SINTETICOS
// ==========================================

const META_PRODUCTOS = 5000;
const TAMANO_LOTE = 250;

const categorias = [
  "Memorias RAM",
  "Almacenamiento",
  "Procesadores",
  "Tarjetas Graficas",
  "Placas Madre",
  "Fuentes de Poder",
  "Gabinetes",
  "Refrigeracion",
  "Monitores",
  "Perifericos"
];

const marcas = [
  "Kingston",
  "Samsung",
  "Corsair",
  "Crucial",
  "Western Digital",
  "Intel",
  "AMD",
  "ASUS",
  "MSI",
  "Gigabyte"
];

function generarProducto(numero) {
  const categoria = categorias[numero % categorias.length];
  const marca = marcas[(numero * 7) % marcas.length];

  const stock = (numero * 13) % 101;
  const stockMinimo = 5 + (numero % 6);

  return {
    codigo_sku: `SIM-${String(numero).padStart(6, "0")}`,

    nombre: `${categoria} ${marca} Modelo ${numero}`,

    categoria,

    marca,

    especificaciones: {
      origen: "Datos sinteticos",
      modelo: `OMNI-${numero}`,
      garantia_meses: 12 + (numero % 3) * 12,
      lote: Math.floor(numero / 100) + 1
    },

    stock_actual: stock,
    stock_minimo: stockMinimo,

    ubicacion_bodega:
      `Estante ${String.fromCharCode(65 + (numero % 10))}${(numero % 20) + 1}`
  };
}

async function ejecutar() {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/omnilogistics";

    await mongoose.connect(mongoURI);

    console.log("MongoDB conectado correctamente.");

    // Verificar base de datos y colección.
    console.log("Base de datos:", mongoose.connection.name);
    console.log("Colección:", Producto.collection.name);

    const existentes = await Producto.countDocuments();

    console.log("Productos actuales:", existentes);
    console.log("Meta:", META_PRODUCTOS);

    if (existentes >= META_PRODUCTOS) {
      console.log(
        "La colección ya cumple la meta de 5.000 productos."
      );
      return;
    }

    // Verificar SKU existentes para evitar duplicados.
    const skusExistentes = new Set(
      await Producto.distinct("codigo_sku")
    );

    const faltantes = META_PRODUCTOS - existentes;

    console.log("Productos por generar:", faltantes);

    let insertados = 0;
    let numero = 1;

    while (insertados < faltantes) {
      const lote = [];

      while (
        lote.length < TAMANO_LOTE &&
        insertados + lote.length < faltantes
      ) {
        const producto = generarProducto(numero);

        numero++;

        if (skusExistentes.has(producto.codigo_sku)) {
          continue;
        }

        skusExistentes.add(producto.codigo_sku);
        lote.push(producto);
      }

      const resultado = await Producto.insertMany(lote, {
        ordered: true
      });

      insertados += resultado.length;

      console.log(
        `Progreso: ${insertados}/${faltantes} productos nuevos`
      );
    }

    const totalFinal = await Producto.countDocuments();

    const categoriasRegistradas =
      await Producto.distinct("categoria");

    console.log("\n==================================");
    console.log("OMNILOGISTICS - CARGA FINALIZADA");
    console.log("==================================");
    console.log("Productos iniciales:", existentes);
    console.log("Productos insertados:", insertados);
    console.log("TOTAL PRODUCTOS:", totalFinal);
    console.log(
      "Categorias registradas:",
      categoriasRegistradas.length
    );
    console.log("==================================");

    if (totalFinal === META_PRODUCTOS) {
      console.log("OBJETIVO CUMPLIDO: 5.000 PRODUCTOS.");
    } else {
      console.warn(
        "ATENCION: el total no coincide con la meta."
      );
    }

  } catch (error) {
    console.error("ERROR DE CARGA:", error.message);
    process.exitCode = 1;

  } finally {
    await mongoose.disconnect();
    console.log("Conexion MongoDB cerrada.");
  }
}

ejecutar();
