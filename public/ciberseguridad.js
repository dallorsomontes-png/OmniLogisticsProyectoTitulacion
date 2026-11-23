
"use strict";

// OMNILOGISTICS - CENTRO DE CIBERSEGURIDAD
// Estadísticas reales desde MongoDB.

(() => {
  let graficoSeguridad = null;

  function mostrar(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
  }

  async function cargarCiberseguridad() {
    const token = sessionStorage.getItem("omni_token");
    const usuario = JSON.parse(
      sessionStorage.getItem("omni_usuario") || "null"
    );

    if (!token || usuario?.rol !== "Administrador") {
      mostrar("monitorEntradas", "Restringido");
      mostrar("monitorSalidas", "Restringido");
      mostrar("monitorActualizacion", "--");
      return;
    }

    try {
      const respuesta = await fetch(
        "/api/seguridad/estadisticas",
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: "no-store"
        }
      );

      if (!respuesta.ok) {
        throw new Error(`HTTP ${respuesta.status}`);
      }

      const datos = await respuesta.json();

      mostrar("monitorEntradas", datos.fallidos ?? 0);
      mostrar("monitorSalidas", datos.amenazas ?? 0);

      mostrar(
        "monitorActualizacion",
        new Date(datos.actualizado).toLocaleTimeString("es-CL")
      );

      mostrar("monitorEstado", "Auditoría conectada");

      const canvas = document.getElementById("movimientosChart");

      if (!canvas) return;

      if (typeof Chart === "undefined") {
        console.warn("Chart.js no está disponible");
        return;
      }

      if (graficoSeguridad) {
        graficoSeguridad.destroy();
      }

      graficoSeguridad = new Chart(canvas, {
        type: "doughnut",
        data: {
          labels: [
            "Accesos exitosos",
            "Accesos fallidos",
            "Accesos bloqueados"
          ],
          datasets: [{
            data: [
              datos.exitosos ?? 0,
              datos.fallidos ?? 0,
              datos.bloqueados ?? 0
            ],
            backgroundColor: [
              "#00e5ff",
              "#ff4d6d",
              "#ffcc00"
            ],
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                color: "#ffffff",
                padding: 15
              }
            }
          }
        }
      });

    } catch (error) {
      console.error(
        "Error al cargar ciberseguridad:",
        error.message
      );

      mostrar("monitorEstado", "Auditoría no disponible");
      mostrar("monitorEntradas", "--");
      mostrar("monitorSalidas", "--");
      mostrar("monitorActualizacion", "--");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    cargarCiberseguridad();
    setInterval(cargarCiberseguridad, 30000);
  });
})();
