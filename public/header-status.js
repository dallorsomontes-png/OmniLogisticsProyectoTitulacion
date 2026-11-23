
"use strict";

// OmniLogistics - Indicadores de estado
// Comprueba la API y una consulta autenticada a MongoDB.

(() => {
  const INTERVALO_MS = 30000;

  function actualizar(id, texto) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = texto;
  }

  async function comprobarEstado() {
    const token = sessionStorage.getItem("omni_token");

    // 1. Comprobar API REST
    try {
      const respuesta = await fetch("/api/health", {
        cache: "no-store"
      });

      if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
      }

      const datos = await respuesta.json();

      if (datos.estado !== "Operativo") {
        throw new Error("Estado de API no operativo");
      }

      actualizar("databaseState", "API OPERATIVA");
      actualizar(
        "databaseDescription",
        "API REST disponible. Comprobando MongoDB..."
      );

    } catch (error) {
      actualizar("databaseState", "SIN CONEXIÓN");
      actualizar(
        "databaseDescription",
        "No se pudo verificar la API REST."
      );
      actualizar("securityState", "NO VERIFICADO");
      actualizar(
        "securityDescription",
        "No se pudo completar la comprobación."
      );
      actualizar("monitorEstado", "Sin conexión con API");
      return;
    }

    // 2. Comprobar consulta autenticada a MongoDB
    if (!token) {
      actualizar("databaseState", "API OPERATIVA");
      actualizar(
        "databaseDescription",
        "API disponible. No hay sesión para consultar datos."
      );
      actualizar("securityState", "SIN SESIÓN");
      actualizar(
        "securityDescription",
        "No se encontró un token de autenticación."
      );
      actualizar("monitorEstado", "Sin sesión autenticada");
      return;
    }

    try {
      const respuesta = await fetch(
        "/api/productos/estadisticas",
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: "no-store"
        }
      );

      if (respuesta.status === 401 ||
          respuesta.status === 403) {
        actualizar("databaseState", "ACCESO RECHAZADO");
        actualizar(
          "databaseDescription",
          "La API rechazó la consulta autenticada."
        );
        actualizar("securityState", "ACCESO RECHAZADO");
        actualizar(
          "securityDescription",
          `Respuesta HTTP ${respuesta.status}.`
        );
        actualizar("monitorEstado", "Acceso no autorizado");
        return;
      }

      if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
      }

      await respuesta.json();

      actualizar("databaseState", "OPERATIVA");
      actualizar(
        "databaseDescription",
        "API REST y consulta autenticada de datos disponibles."
      );

      actualizar("securityState", "SESIÓN VALIDADA");
      actualizar(
        "securityDescription",
        "La API aceptó una solicitud autenticada mediante JWT."
      );

      actualizar(
        "monitorEstado",
        "Consulta autenticada disponible"
      );

    } catch (error) {
      actualizar("databaseState", "ERROR DE CONSULTA");
      actualizar(
        "databaseDescription",
        "No se pudo completar la consulta de estadísticas."
      );

      actualizar("securityState", "NO VERIFICADO");
      actualizar(
        "securityDescription",
        "No se pudo confirmar la autorización."
      );

      actualizar("monitorEstado", "Consulta no disponible");

      console.error(
        "OmniLogistics - Error de indicadores:",
        error.message
      );
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    comprobarEstado();
    setInterval(comprobarEstado, INTERVALO_MS);
  });
})();
