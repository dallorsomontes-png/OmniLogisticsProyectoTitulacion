
"use strict";

// ==========================================
// OMNILOGISTICS - BIG DATA LOGISTICS
// Analítica de inventario con MongoDB
// ==========================================

(() => {
  let graficoBigData = null;
  let actualizando = false;
  let intervalo = null;

  function escribir(id, valor) {
    const elemento = document.getElementById(id);

    if (elemento) {
      elemento.textContent = String(valor);
    }
  }

  // ==========================================
  // CONSULTAR API CON JWT
  // ==========================================

  async function consultarAPI(url, token) {
    const respuesta = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!respuesta.ok) {
      throw new Error(
        `Error HTTP ${respuesta.status} al consultar ${url}`
      );
    }

    return respuesta.json();
  }

  // ==========================================
  // CONSULTAR TODAS LAS PAGINAS
  // ==========================================

  async function obtenerProductos(token) {
    const productos = [];
    let pagina = 1;
    let totalPaginas = 1;

    do {
      const datos = await consultarAPI(
        `/api/productos?pagina=${pagina}&limite=100`,
        token
      );

      if (!Array.isArray(datos.productos)) {
        throw new Error(
          "La API no devolvió un arreglo de productos."
        );
      }

      productos.push(...datos.productos);

      totalPaginas = Number(datos.totalPaginas) || 0;
      pagina++;

    } while (pagina <= totalPaginas);

    return productos;
  }

  // ==========================================
  // AGRUPAR STOCK POR CATEGORIA
  // ==========================================

  function procesarInventario(productos) {
    const categorias = new Map();

    for (const producto of productos) {
      const categoria = String(
        producto.categoria || "Sin categoría"
      ).trim();

      const stock = Number(producto.stock_actual) || 0;

      categorias.set(
        categoria,
        (categorias.get(categoria) || 0) + stock
      );
    }

    const ordenadas = [...categorias.entries()]
      .sort((a, b) => b[1] - a[1]);

    return {
      totalProductos: productos.length,
      totalCategorias: categorias.size,
      nombres: ordenadas.map(item => item[0]),
      unidades: ordenadas.map(item => item[1])
    };
  }

  // ==========================================
  // DIBUJAR GRAFICO CON CHART.JS
  // ==========================================

  function dibujarGrafico(datos) {
    const canvas = document.getElementById(
      "categoriasChart"
    );

    if (!canvas) {
      throw new Error(
        "No existe el canvas categoriasChart."
      );
    }

    if (typeof Chart === "undefined") {
      throw new Error(
        "Chart.js no está cargado."
      );
    }

    // Destruir gráfico anterior si existe.
    const graficoExistente = Chart.getChart(canvas);

    if (graficoExistente) {
      graficoExistente.destroy();
    }

    graficoBigData = new Chart(canvas, {
      type: "bar",

      data: {
        labels: datos.nombres,

        datasets: [{
          label: "Unidades disponibles",
          data: datos.unidades,

          backgroundColor: [
            "rgba(0, 229, 255, 0.75)",
            "rgba(99, 102, 241, 0.75)",
            "rgba(34, 197, 94, 0.75)",
            "rgba(245, 158, 11, 0.75)",
            "rgba(236, 72, 153, 0.75)"
          ],

          borderColor: "#00e5ff",
          borderWidth: 1,
          borderRadius: 6,
          maxBarThickness: 65
        }]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: true,
            labels: {
              color: "#ffffff"
            }
          },

          tooltip: {
            enabled: true
          }
        },

        scales: {
          x: {
            ticks: {
              color: "#cbd5e1"
            },

            grid: {
              display: false
            }
          },

          y: {
            beginAtZero: true,

            ticks: {
              color: "#cbd5e1",
              precision: 0
            },

            grid: {
              color: "rgba(255,255,255,0.08)"
            }
          }
        }
      }
    });

    console.log(
      "[BIG DATA] Gráfico creado correctamente."
    );
  }

  // ==========================================
  // ACTUALIZAR PANEL
  // ==========================================

  async function actualizarBigData() {
    if (actualizando) return;

    actualizando = true;

    try {
      console.log("[BIG DATA] Consultando inventario...");

      const token = sessionStorage.getItem("omni_token");

      if (!token) {
        throw new Error(
          "No existe token JWT en sessionStorage."
        );
      }

      const productos = await obtenerProductos(token);

      console.log(
        "[BIG DATA] Productos recibidos:",
        productos.length
      );

      const datos = procesarInventario(productos);

      // Actualizar indicadores.
      escribir("radarProductos", datos.totalProductos);
      escribir("radarAlertas", datos.totalCategorias);

      // Crear gráfico.
      dibujarGrafico(datos);

      console.log("[BIG DATA] Panel actualizado:", {
        productos: datos.totalProductos,
        categorias: datos.totalCategorias,
        unidades: datos.unidades
      });

    } catch (error) {
      console.error(
        "[BIG DATA] Error:",
        error
      );

      escribir("radarProductos", "--");
      escribir("radarAlertas", "--");

    } finally {
      actualizando = false;
    }
  }

  // ==========================================
  // INICIALIZAR MODULO
  // ==========================================

  function iniciarBigData() {
    console.log("[BIG DATA] Inicializando módulo...");

    actualizarBigData();

    if (!intervalo) {
      intervalo = setInterval(
        actualizarBigData,
        60000
      );
    }
  }

  // Funciona tanto antes como después
  // de DOMContentLoaded.
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      iniciarBigData,
      { once: true }
    );
  } else {
    iniciarBigData();
  }

})();
