
"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// ==========================================
// OMNILOGISTICS - CONFIGURACION MONGODB
// ==========================================

const conectarMongoDB = require("./config/db");

// ==========================================
// IMPORTACION DE RUTAS API REST
// ==========================================

const authRoutes = require("./routes/authRoutes");
const productoRoutes = require("./routes/productoRoutes");
const movimientoRoutes = require("./routes/movimientoRoutes");
const seguridadRoutes = require("./routes/seguridadRoutes");

// ==========================================
// CONFIGURACION DEL SERVIDOR
// ==========================================

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARES DE SEGURIDAD
// ==========================================

// Cabeceras de seguridad HTTP
app.use(helmet());

// Configuracion CORS
app.use(cors());

// Interpretar solicitudes JSON
app.use(express.json());

// ==========================================
// ARCHIVOS ESTATICOS DEL FRONTEND
// ==========================================

app.use(
  express.static(path.join(__dirname, "public"))
);

// ==========================================
// RUTAS DE LA API REST
// ==========================================

// Autenticacion y registro de usuarios
app.use("/api/auth", authRoutes);

// Gestion de productos e inventario
app.use("/api/productos", productoRoutes);

// Movimientos de entrada y salida
app.use("/api/movimientos", movimientoRoutes);

// Estadisticas y auditoria de ciberseguridad
app.use("/api/seguridad", seguridadRoutes);

// ==========================================
// ENDPOINT DE SALUD DE LA API
// ==========================================

app.get("/api/health", (req, res) => {
  res.json({
    proyecto: "OmniLogistics",
    estado: "Operativo",
    mensaje: "API REST funcionando correctamente"
  });
});

// ==========================================
// INICIALIZACION DEL SERVIDOR
// ==========================================

const iniciarServidor = async () => {
  try {

    // Establecer conexion con MongoDB
    await conectarMongoDB();

    // Iniciar servidor Express
    app.listen(PORT, () => {
      console.log(
        `OmniLogistics operativo en puerto ${PORT}`
      );

      console.log(
        `API REST: http://localhost:${PORT}/api/health`
      );

      console.log(
        "Modulo de ciberseguridad registrado"
      );
    });

  } catch (error) {

    console.error(
      "Error al iniciar OmniLogistics:",
      error.message
    );

    process.exit(1);
  }
};

iniciarServidor();
