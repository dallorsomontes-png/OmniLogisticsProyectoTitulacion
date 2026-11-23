
"use strict";

const mongoose = require("mongoose");

const Movimiento = require("../models/Movimiento");
const Producto = require("../models/Producto");

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

// Registrar entrada o salida de inventario
exports.registrarMovimiento = async (req, res) => {
  try {
    const {
      producto_id,
      tipo_movimiento,
      cantidad,
      observacion,
      region_destino,
      comuna_destino,
      codigo_despacho
    } = req.body;

    if (!mongoose.isValidObjectId(producto_id)) {
      return res.status(400).json({
        mensaje: "Identificador de producto inválido."
      });
    }

    if (!["Entrada", "Salida"].includes(tipo_movimiento)) {
      return res.status(400).json({
        mensaje: "El movimiento debe ser Entrada o Salida."
      });
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      return res.status(400).json({
        mensaje: "La cantidad debe ser un entero mayor que cero."
      });
    }

    if (
      observacion !== undefined &&
      typeof observacion !== "string"
    ) {
      return res.status(400).json({
        mensaje: "La observación debe ser texto."
      });
    }

    const camposTexto = {
      region_destino,
      comuna_destino,
      codigo_despacho
    };

    for (const [campo, valor] of Object.entries(camposTexto)) {
      if (
        valor !== undefined &&
        valor !== null &&
        typeof valor !== "string"
      ) {
        return res.status(400).json({
          mensaje: `${campo} debe ser texto.`
        });
      }
    }

    const region = region_destino?.trim() || null;
    const comuna = comuna_destino?.trim() || "";
    const codigo = codigo_despacho?.trim() || "";

    if (region && !REGIONES_CHILE.includes(region)) {
      return res.status(400).json({
        mensaje: "La región de destino no es válida."
      });
    }

    if (comuna.length > 100 || codigo.length > 80) {
      return res.status(400).json({
        mensaje: "Los datos del despacho son demasiado largos."
      });
    }

    if (tipo_movimiento === "Entrada" && (region || comuna || codigo)) {
      return res.status(400).json({
        mensaje: "Los datos de destino solo corresponden a salidas."
      });
    }

    const usuarioId = req.usuario.id;

    const sesion = await mongoose.startSession();

    try {
      let resultado;

      await sesion.withTransaction(async () => {
        const cambio =
          tipo_movimiento === "Entrada"
            ? cantidad
            : -cantidad;

        const filtro = {
          _id: producto_id
        };

        if (tipo_movimiento === "Salida") {
          filtro.stock_actual = { $gte: cantidad };
        }

        const producto = await Producto.findOneAndUpdate(
          filtro,
          { $inc: { stock_actual: cambio } },
          {
            new: true,
            runValidators: true,
            session: sesion
          }
        );

        if (!producto) {
          const existe = await Producto.exists({
            _id: producto_id
          }).session(sesion);

          const error = new Error(
            existe
              ? "Stock insuficiente para realizar la salida."
              : "Producto no encontrado."
          );

          error.status = existe ? 400 : 404;
          throw error;
        }

        const datosMovimiento = {
          producto_id,
          usuario_id: usuarioId,
          tipo_movimiento,
          cantidad,
          observacion: observacion?.trim() || ""
        };

        if (tipo_movimiento === "Salida") {
          datosMovimiento.region_destino = region;
          datosMovimiento.comuna_destino = comuna;
          datosMovimiento.codigo_despacho = codigo;
        }

        const movimientos = await Movimiento.create(
          [datosMovimiento],
          { session: sesion }
        );

        resultado = {
          mensaje: "Movimiento registrado correctamente.",
          movimiento: movimientos[0],
          producto: {
            id: producto._id,
            nombre: producto.nombre,
            stock_actual: producto.stock_actual
          }
        };
      });

      return res.status(201).json(resultado);

    } finally {
      await sesion.endSession();
    }

  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        mensaje: error.message
      });
    }

    if (
      error.code === 20 ||
      error.codeName === "IllegalOperation"
    ) {
      return res.status(503).json({
        mensaje:
          "MongoDB requiere un replica set para registrar movimientos mediante transacciones."
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        mensaje: error.message
      });
    }

    console.error("Error registrando movimiento:", error);

    return res.status(500).json({
      mensaje: "Error al registrar el movimiento."
    });
  }
};

// Consultar historial de movimientos
exports.listarMovimientos = async (req, res) => {
  try {
    const movimientos = await Movimiento.find()
      .populate("producto_id", "codigo_sku nombre")
      .populate("usuario_id", "username rol")
      .sort({ fecha_movimiento: -1 })
      .limit(100)
      .lean();

    return res.json({
      total: movimientos.length,
      movimientos
    });

  } catch (error) {
    console.error("Error consultando movimientos:", error);

    return res.status(500).json({
      mensaje: "Error al consultar los movimientos."
    });
  }
};

// Big Data: analizar demanda y destinos de despachos
exports.estadisticasBigData = async (req, res) => {
  try {
    const inicio = performance.now();

    const filtroSalidas = {
      tipo_movimiento: "Salida"
    };

    const resultados = await Movimiento.aggregate([
      {
        $match: filtroSalidas
      },
      {
        $facet: {
          resumen: [
            {
              $group: {
                _id: null,
                unidadesRetiradas: { $sum: "$cantidad" },
                movimientosAnalizados: { $sum: 1 },
                productosUnicos: {
                  $addToSet: "$producto_id"
                }
              }
            },
            {
              $project: {
                _id: 0,
                unidadesRetiradas: 1,
                movimientosAnalizados: 1,
                modelosDistintos: {
                  $size: "$productosUnicos"
                }
              }
            }
          ],

          productos: [
            {
              $group: {
                _id: "$producto_id",
                unidadesRetiradas: { $sum: "$cantidad" },
                cantidadMovimientos: { $sum: 1 },
                ultimoRetiro: { $max: "$fecha_movimiento" },
                regiones: {
                  $addToSet: "$region_destino"
                }
              }
            },
            {
              $lookup: {
                from: Producto.collection.name,
                localField: "_id",
                foreignField: "_id",
                as: "producto"
              }
            },
            {
              $unwind: {
                path: "$producto",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $project: {
                _id: 0,
                producto_id: "$_id",
                nombre: {
                  $ifNull: [
                    "$producto.nombre",
                    "Producto no disponible"
                  ]
                },
                codigo_sku: {
                  $ifNull: [
                    "$producto.codigo_sku",
                    "Sin SKU"
                  ]
                },
                unidadesRetiradas: 1,
                cantidadMovimientos: 1,
                ultimoRetiro: 1,
                stockActual: {
                  $ifNull: ["$producto.stock_actual", null]
                },
                regiones: {
                  $filter: {
                    input: "$regiones",
                    as: "region",
                    cond: {
                      $and: [
                        { $ne: ["$$region", null] },
                        { $ne: ["$$region", ""] }
                      ]
                    }
                  }
                }
              }
            },
            {
              $sort: {
                unidadesRetiradas: -1,
                nombre: 1
              }
            },
            {
              $limit: 10
            }
          ],

          regiones: [
            {
              $group: {
                _id: {
                  $ifNull: [
                    "$region_destino",
                    "Sin región registrada"
                  ]
                },
                unidadesRetiradas: { $sum: "$cantidad" },
                movimientos: { $sum: 1 },
                productosUnicos: {
                  $addToSet: "$producto_id"
                }
              }
            },
            {
              $project: {
                _id: 0,
                region: "$_id",
                unidadesRetiradas: 1,
                movimientos: 1,
                modelosDistintos: {
                  $size: "$productosUnicos"
                }
              }
            },
            {
              $sort: {
                unidadesRetiradas: -1,
                region: 1
              }
            }
          ],

          actividad: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$fecha_movimiento",
                    timezone: "America/Santiago"
                  }
                },
                unidadesRetiradas: { $sum: "$cantidad" },
                movimientos: { $sum: 1 }
              }
            },
            {
              $sort: { _id: -1 }
            },
            {
              $limit: 30
            },
            {
              $sort: { _id: 1 }
            },
            {
              $project: {
                _id: 0,
                fecha: "$_id",
                unidadesRetiradas: 1,
                movimientos: 1
              }
            }
          ]
        }
      }
    ]);

    const datos = resultados[0] || {};
    const resumen = datos.resumen?.[0] || {
      unidadesRetiradas: 0,
      movimientosAnalizados: 0,
      modelosDistintos: 0
    };

    const regiones = datos.regiones || [];

    return res.json({
      estado: "OK",
      actualizado: new Date().toISOString(),

      resumen: {
        ...resumen,
        regionesConDestino: regiones.filter(
          r => r.region !== "Sin región registrada" &&
               r.region !== ""
        ).length
      },

      productos: datos.productos || [],
      regiones,
      actividad: datos.actividad || [],

      rendimiento: {
        tiempoConsultaMs: Number(
          (performance.now() - inicio).toFixed(2)
        )
      }
    });

  } catch (error) {
    console.error("Error en Big Data:", error);

    return res.status(500).json({
      mensaje: "Error al calcular las estadísticas Big Data."
    });
  }
};
