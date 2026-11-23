
"use strict";

const mongoose = require("mongoose");

const Producto = require("../models/Producto");
const Movimiento = require("../models/Movimiento");

// ==========================================
// VALIDAR LOS DATOS DE UN PRODUCTO
// ==========================================

function validarProducto(datos) {
  const campos = [
    "codigo_sku",
    "nombre",
    "categoria",
    "marca",
    "ubicacion_bodega"
  ];

  for (const campo of campos) {
    if (
      typeof datos[campo] !== "string" ||
      !datos[campo].trim()
    ) {
      return `El campo ${campo} es obligatorio.`;
    }
  }

  for (const campo of ["stock_actual", "stock_minimo"]) {
    if (
      datos[campo] !== undefined &&
      (
        typeof datos[campo] !== "number" ||
        !Number.isFinite(datos[campo]) ||
        datos[campo] < 0 ||
        !Number.isInteger(datos[campo])
      )
    ) {
      return `${campo} debe ser un entero no negativo.`;
    }
  }

  if (
    datos.especificaciones !== undefined &&
    (
      datos.especificaciones === null ||
      typeof datos.especificaciones !== "object" ||
      Array.isArray(datos.especificaciones)
    )
  ) {
    return "Las especificaciones deben ser un objeto.";
  }

  return null;
}

// ==========================================
// REGISTRAR UN PRODUCTO
// ==========================================

exports.crearProducto = async (req, res) => {
  try {
    const error = validarProducto(req.body);

    if (error) {
      return res.status(400).json({
        mensaje: error
      });
    }

    const sku = req.body.codigo_sku.trim();

    const existente = await Producto.findOne({
      codigo_sku: sku
    });

    if (existente) {
      return res.status(409).json({
        mensaje: "El código SKU ya está registrado."
      });
    }

    const producto = await Producto.create({
      codigo_sku: sku,
      nombre: req.body.nombre.trim(),
      categoria: req.body.categoria.trim(),
      marca: req.body.marca.trim(),
      especificaciones: req.body.especificaciones ?? {},
      stock_actual: req.body.stock_actual ?? 0,
      stock_minimo: req.body.stock_minimo ?? 5,
      ubicacion_bodega: req.body.ubicacion_bodega.trim()
    });

    return res.status(201).json({
      mensaje: "Producto registrado correctamente.",
      producto
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        mensaje: "El código SKU ya está registrado."
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        mensaje: error.message
      });
    }

    console.error("Error al crear producto:", error);

    return res.status(500).json({
      mensaje: "Error al registrar el producto."
    });
  }
};

// ==========================================
// LISTAR PRODUCTOS CON PAGINACIÓN Y FILTROS
// ==========================================

exports.listarProductos = async (req, res) => {
  try {
    function enteroPositivo(valor, defecto) {
      if (valor === undefined) return defecto;

      const texto = String(valor);

      if (!/^[1-9]\d*$/.test(texto)) {
        return null;
      }

      const numero = Number(texto);

      return Number.isSafeInteger(numero)
        ? numero
        : null;
    }

    const pagina = enteroPositivo(
      req.query.pagina,
      1
    );

    const limiteSolicitado = enteroPositivo(
      req.query.limite,
      25
    );

    if (
      pagina === null ||
      limiteSolicitado === null
    ) {
      return res.status(400).json({
        mensaje:
          "La página y el límite deben ser enteros positivos."
      });
    }

    const limite = Math.min(limiteSolicitado, 100);

    const filtro = {};

    // Búsqueda por nombre o SKU
    if (req.query.buscar !== undefined) {
      if (typeof req.query.buscar !== "string") {
        return res.status(400).json({
          mensaje: "El parámetro buscar debe ser texto."
        });
      }

      const buscar = req.query.buscar.trim();

      if (buscar.length > 100) {
        return res.status(400).json({
          mensaje:
            "La búsqueda no puede superar 100 caracteres."
        });
      }

      if (buscar) {
        const textoSeguro = buscar.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        filtro.$or = [
          {
            nombre: {
              $regex: textoSeguro,
              $options: "i"
            }
          },
          {
            codigo_sku: {
              $regex: textoSeguro,
              $options: "i"
            }
          }
        ];
      }
    }

    // Filtrar por categoría
    if (req.query.categoria !== undefined) {
      if (
        typeof req.query.categoria !== "string" ||
        req.query.categoria.length > 100
      ) {
        return res.status(400).json({
          mensaje: "Categoría inválida."
        });
      }

      const categoria = req.query.categoria.trim();

      if (categoria) {
        filtro.categoria = categoria;
      }
    }

    // Filtrar por marca
    if (req.query.marca !== undefined) {
      if (
        typeof req.query.marca !== "string" ||
        req.query.marca.length > 100
      ) {
        return res.status(400).json({
          mensaje: "Marca inválida."
        });
      }

      const marca = req.query.marca.trim();

      if (marca) {
        filtro.marca = marca;
      }
    }

    // Filtrar productos con stock bajo
    if (req.query.stock_bajo !== undefined) {
      if (
        req.query.stock_bajo !== "true" &&
        req.query.stock_bajo !== "false"
      ) {
        return res.status(400).json({
          mensaje:
            "stock_bajo debe ser true o false."
        });
      }

      if (req.query.stock_bajo === "true") {
        filtro.$expr = {
          $lte: [
            "$stock_actual",
            "$stock_minimo"
          ]
        };
      }
    }

    const total = await Producto.countDocuments(filtro);

    const totalPaginas = Math.ceil(total / limite);

    const salto = (pagina - 1) * limite;

    if (!Number.isSafeInteger(salto)) {
      return res.status(400).json({
        mensaje: "Número de página demasiado grande."
      });
    }

    const productos = await Producto.find(filtro)
      .sort({
        createdAt: -1,
        _id: -1
      })
      .skip(salto)
      .limit(limite)
      .lean();

    return res.json({
      total,
      pagina,
      limite,
      totalPaginas,
      productos,
      paginacion: {
        paginaActual: pagina,
        totalPaginas,
        totalRegistros: total,
        registrosPorPagina: limite,
        tieneAnterior: pagina > 1,
        tieneSiguiente: pagina < totalPaginas
      }
    });

  } catch (error) {
    console.error(
      "Error al listar productos:",
      error
    );

    return res.status(500).json({
      mensaje: "Error al consultar el inventario."
    });
  }
};

// ==========================================
// ESTADÍSTICAS GLOBALES DEL INVENTARIO
// ==========================================

exports.estadisticasProductos = async (req, res) => {
  try {
    const [resultado] = await Producto.aggregate([
      {
        $group: {
          _id: null,

          totalProductos: {
            $sum: 1
          },

          totalStock: {
            $sum: "$stock_actual"
          },

          totalAlertas: {
            $sum: {
              $cond: [
                {
                  $lte: [
                    "$stock_actual",
                    "$stock_minimo"
                  ]
                },
                1,
                0
              ]
            }
          },

          productosSinStock: {
            $sum: {
              $cond: [
                { $eq: ["$stock_actual", 0] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    return res.json({
      totalProductos: resultado?.totalProductos ?? 0,
      totalStock: resultado?.totalStock ?? 0,
      totalAlertas: resultado?.totalAlertas ?? 0,
      productosSinStock:
        resultado?.productosSinStock ?? 0,
      actualizado: new Date().toISOString()
    });

  } catch (error) {
    console.error(
      "Error al consultar estadísticas:",
      error
    );

    return res.status(500).json({
      mensaje:
        "Error al consultar estadísticas del inventario."
    });
  }
};

// ==========================================
// CONSULTAR PRODUCTO POR ID
// ==========================================

exports.obtenerProducto = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: "Identificador de producto inválido."
      });
    }

    const producto = await Producto.findById(
      req.params.id
    );

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado."
      });
    }

    return res.json({ producto });

  } catch (error) {
    console.error(
      "Error al consultar producto:",
      error
    );

    return res.status(500).json({
      mensaje: "Error al consultar el producto."
    });
  }
};

// ==========================================
// ACTUALIZAR PRODUCTO
// ==========================================

exports.actualizarProducto = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: "Identificador de producto inválido."
      });
    }

    // El stock se modifica mediante movimientos
    if (
      Object.prototype.hasOwnProperty.call(
        req.body,
        "stock_actual"
      )
    ) {
      return res.status(400).json({
        mensaje:
          "El stock solo puede modificarse mediante movimientos de inventario."
      });
    }

    const camposPermitidos = [
      "codigo_sku",
      "nombre",
      "categoria",
      "marca",
      "especificaciones",
      "stock_minimo",
      "ubicacion_bodega"
    ];

    const cambios = {};

    for (const campo of camposPermitidos) {
      if (
        Object.prototype.hasOwnProperty.call(
          req.body,
          campo
        )
      ) {
        cambios[campo] = req.body[campo];
      }
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({
        mensaje: "No se enviaron campos válidos."
      });
    }

    const productoActual = await Producto.findById(
      req.params.id
    );

    if (!productoActual) {
      return res.status(404).json({
        mensaje: "Producto no encontrado."
      });
    }

    const datosCompletos = {
      ...productoActual.toObject(),
      ...cambios
    };

    const error = validarProducto(datosCompletos);

    if (error) {
      return res.status(400).json({
        mensaje: error
      });
    }

    for (const campo of Object.keys(cambios)) {
      productoActual[campo] =
        typeof cambios[campo] === "string"
          ? cambios[campo].trim()
          : cambios[campo];
    }

    await productoActual.save();

    return res.json({
      mensaje: "Producto actualizado correctamente.",
      producto: productoActual
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        mensaje: "El código SKU ya está registrado."
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        mensaje: error.message
      });
    }

    console.error(
      "Error al actualizar producto:",
      error
    );

    return res.status(500).json({
      mensaje: "Error al actualizar el producto."
    });
  }
};

// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

exports.eliminarProducto = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        mensaje: "Identificador de producto inválido."
      });
    }

    const producto = await Producto.findById(
      req.params.id
    );

    if (!producto) {
      return res.status(404).json({
        mensaje: "Producto no encontrado."
      });
    }

    // Evitar eliminar productos con historial
    const tieneMovimientos = await Movimiento.exists({
      producto_id: producto._id
    });

    if (tieneMovimientos) {
      return res.status(409).json({
        mensaje:
          "No se puede eliminar el producto porque tiene movimientos de inventario registrados."
      });
    }

    await Producto.findByIdAndDelete(producto._id);

    return res.json({
      mensaje: "Producto eliminado correctamente."
    });

  } catch (error) {
    console.error(
      "Error al eliminar producto:",
      error
    );

    return res.status(500).json({
      mensaje: "Error al eliminar el producto."
    });
  }
};
