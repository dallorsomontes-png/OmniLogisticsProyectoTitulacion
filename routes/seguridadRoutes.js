
"use strict";

const express = require("express");
const router = express.Router();

const SeguridadLog = require("../models/SeguridadLog");
const verificarToken = require("../middlewares/authMiddleware");
const verificarRol = require("../middlewares/roleMiddleware");

// Solo Administrador puede consultar estadísticas
// de auditoría y seguridad.
router.use(verificarToken);
router.use(verificarRol("Administrador"));

router.get("/estadisticas", async (req, res) => {
  try {
    const [total, exitosos, fallidos, bloqueados,
      amenazas, ultimosEventos] = await Promise.all([
      SeguridadLog.countDocuments(),
      SeguridadLog.countDocuments({ resultado: "Exitoso" }),
      SeguridadLog.countDocuments({ resultado: "Fallido" }),
      SeguridadLog.countDocuments({ resultado: "Bloqueado" }),
      SeguridadLog.countDocuments({
        nivel_alerta: { $in: ["Alto", "Critico"] }
      }),
      SeguridadLog.find()
        .sort({ fecha_hora: -1 })
        .limit(10)
        .select("accion resultado nivel_alerta fecha_hora")
        .lean()
    ]);

    res.json({
      total,
      exitosos,
      fallidos,
      bloqueados,
      amenazas,
      ultimosEventos,
      actualizado: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error de estadísticas de seguridad:", error.message);
    res.status(500).json({
      mensaje: "No se pudieron consultar las estadísticas"
    });
  }
});

module.exports = router;
