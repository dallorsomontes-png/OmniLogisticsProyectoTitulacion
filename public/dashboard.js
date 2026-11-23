
"use strict";

document.addEventListener("DOMContentLoaded", () => {

  // ==========================================
  // OMNILOGISTICS - AUTENTICACIÓN
  // ==========================================

  const token = sessionStorage.getItem("omni_token");
  const usuarioGuardado = sessionStorage.getItem("omni_usuario");

  if (!token || !usuarioGuardado) {
    window.location.replace("/");
    return;
  }

  let usuario;

  try {
    usuario = JSON.parse(usuarioGuardado);
  } catch {
    sessionStorage.removeItem("omni_token");
    sessionStorage.removeItem("omni_usuario");
    window.location.replace("/");
    return;
  }

  const esAdmin = usuario.rol === "Administrador";

  const usernameDisplay = document.getElementById("usernameDisplay");
  const roleDisplay = document.getElementById("roleDisplay");
  const logoutBtn = document.getElementById("logoutBtn");

  if (usernameDisplay) {
    usernameDisplay.textContent = usuario.username || "Usuario";
  }

  if (roleDisplay) {
    roleDisplay.textContent = usuario.rol || "Sin rol";
  }

  logoutBtn?.addEventListener("click", () => {
    sessionStorage.removeItem("omni_token");
    sessionStorage.removeItem("omni_usuario");
    window.location.replace("/");
  });

  // ==========================================
  // ELEMENTOS DEL DASHBOARD
  // ==========================================

  const monitor = document.getElementById("liveMovements");
  const entradasEl = document.getElementById("liveEntradas");
  const salidasEl = document.getElementById("liveSalidas");
  const ultimoEl = document.getElementById("liveUltimo");
  const estadoEl = document.getElementById("liveEstado");

  const movimientosList = document.getElementById("movimientosList");
  const totalMovimientos = document.getElementById("totalMovimientos");

  const totalProductos = document.getElementById("totalProductos");
  const totalStock = document.getElementById("totalStock");
  const totalAlertas = document.getElementById("totalAlertas");
  const alertasList = document.getElementById("alertasList");

  const tablaProductos = document.getElementById("productosTable");
  const buscadorProductos = document.getElementById("searchProducto");

  const paginaAnterior = document.getElementById("paginaAnterior");
  const paginaSiguiente = document.getElementById("paginaSiguiente");
  const paginaActualEl = document.getElementById("paginaActual");
  const totalPaginasEl = document.getElementById("totalPaginas");
  const accionesHeader = document.getElementById("accionesHeader");

  if (accionesHeader) {
    accionesHeader.hidden = !esAdmin;
  }

  let ultimoMovimientoId = null;
  let movimientosInicializados = false;
  let consultandoMovimientos = false;
  let consultandoEstadisticas = false;

  let paginaInventario = 1;
  let totalPaginasInventario = 0;
  let busquedaInventario = "";
  let solicitudInventario = 0;
  let controladorInventario = null;

  const LIMITE_INVENTARIO = 25;

  // ==========================================
  // FUNCIONES GENERALES
  // ==========================================

  function animarNumero(elemento, valor) {
    if (!elemento) return;

    const fin = Number(valor);
    if (!Number.isFinite(fin)) return;

    const inicio = Number(elemento.dataset.valor ?? 0);

    if (elemento._animacionNumero) {
      cancelAnimationFrame(elemento._animacionNumero);
    }

    const duracion = 650;
    const tiempoInicial = performance.now();

    function actualizar(tiempo) {
      const progreso = Math.min(
        (tiempo - tiempoInicial) / duracion,
        1
      );

      const suavizado = 1 - Math.pow(1 - progreso, 3);

      const actual = Math.round(
        inicio + (fin - inicio) * suavizado
      );

      elemento.textContent = actual.toLocaleString("es-CL");

      if (progreso < 1) {
        elemento._animacionNumero =
          requestAnimationFrame(actualizar);
      } else {
        elemento._animacionNumero = null;
      }
    }

    elemento.dataset.valor = String(fin);

    elemento._animacionNumero =
      requestAnimationFrame(actualizar);
  }

  function fechaMovimiento(movimiento) {
    const fecha = movimiento.fecha_movimiento;

    if (!fecha) return "Fecha no disponible";

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return "Fecha no disponible";
    }

    return valor.toLocaleString("es-CL", {
      dateStyle: "short",
      timeStyle: "medium"
    });
  }

  function obtenerNombreProducto(movimiento) {
    return (
      movimiento.producto_id?.nombre ||
      "Producto no disponible"
    );
  }

  // ==========================================
  // ÚLTIMO MOVIMIENTO
  // ==========================================

  function mostrarUltimo(movimiento) {
    if (!ultimoEl) return;

    ultimoEl.replaceChildren();

    if (!movimiento) {
      ultimoEl.textContent = "Sin movimientos registrados";
      return;
    }

    const esEntrada =
      movimiento.tipo_movimiento === "Entrada";

    const nombre = document.createElement("strong");
    nombre.textContent = obtenerNombreProducto(movimiento);

    const detalle = document.createElement("span");

    detalle.textContent =
      `${esEntrada ? "Ingreso" : "Retiro"} ` +
      `${esEntrada ? "+" : "-"}${movimiento.cantidad} · ` +
      fechaMovimiento(movimiento);

    detalle.className = esEntrada
      ? "live-entry"
      : "live-exit";

    ultimoEl.append(nombre, detalle);
  }

  // ==========================================
  // HISTORIAL DE MOVIMIENTOS
  // ==========================================

  function mostrarHistorial(movimientos) {
    if (!movimientosList) return;

    movimientosList.replaceChildren();

    if (movimientos.length === 0) {
      movimientosList.textContent =
        "No hay movimientos registrados.";
      return;
    }

    movimientos.slice(0, 8).forEach((movimiento) => {
      const fila = document.createElement("div");
      fila.className = "movement-row";

      const esEntrada =
        movimiento.tipo_movimiento === "Entrada";

      const descripcion = document.createElement("span");

      descripcion.textContent =
        `${obtenerNombreProducto(movimiento)} · ` +
        fechaMovimiento(movimiento);

      const cantidad = document.createElement("strong");

      cantidad.textContent =
        `${esEntrada ? "+" : "-"}${movimiento.cantidad}`;

      cantidad.className = esEntrada
        ? "live-entry"
        : "live-exit";

      fila.append(descripcion, cantidad);
      movimientosList.appendChild(fila);
    });
  }

  // ==========================================
  // EFECTOS DEL MONITOR LIVE
  // ==========================================

  function activarDestello(tipo) {
    if (!monitor) return;

    monitor.classList.remove(
      "flash-entry",
      "flash-exit"
    );

    void monitor.offsetWidth;

    monitor.classList.add(
      tipo === "Entrada"
        ? "flash-entry"
        : "flash-exit"
    );
  }

  // ==========================================
  // MOVIMIENTOS EN TIEMPO REAL
  // ==========================================

  async function actualizarMovimientos() {
    if (consultandoMovimientos) return;

    consultandoMovimientos = true;

    try {
      const respuesta = await fetch(
        "/api/movimientos",
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: "no-store"
        }
      );

      if (
        respuesta.status === 401 ||
        respuesta.status === 403
      ) {
        if (estadoEl) {
          estadoEl.textContent = "SIN AUTORIZACIÓN";
          estadoEl.className = "live-status offline";
        }
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          `Error HTTP ${respuesta.status}`
        );
      }

      const datos = await respuesta.json();

      const movimientos = Array.isArray(datos.movimientos)
        ? datos.movimientos
        : [];

      // Totales de movimientos recientes.
      const entradas = movimientos
        .filter(m => m.tipo_movimiento === "Entrada")
        .reduce(
          (total, m) => total + Number(m.cantidad || 0),
          0
        );

      const salidas = movimientos
        .filter(m => m.tipo_movimiento === "Salida")
        .reduce(
          (total, m) => total + Number(m.cantidad || 0),
          0
        );

      animarNumero(entradasEl, entradas);
      animarNumero(salidasEl, salidas);

      animarNumero(
        totalMovimientos,
        datos.total ?? movimientos.length
      );

      const reciente = movimientos[0] || null;
      const nuevoId = reciente?._id || null;

      if (
        movimientosInicializados &&
        nuevoId &&
        nuevoId !== ultimoMovimientoId
      ) {
        activarDestello(reciente.tipo_movimiento);

        actualizarInventario();
        actualizarEstadisticas();
      }

      ultimoMovimientoId = nuevoId;
      movimientosInicializados = true;

      mostrarUltimo(reciente);
      mostrarHistorial(movimientos);

      if (estadoEl) {
        estadoEl.textContent = "LIVE";
        estadoEl.className = "live-status online";
      }

    } catch (error) {
      console.error("Monitor de movimientos:", error);

      if (estadoEl) {
        estadoEl.textContent = "SIN CONEXIÓN";
        estadoEl.className = "live-status offline";
      }

    } finally {
      consultandoMovimientos = false;
    }
  }

  // ==========================================
  // INVENTARIO - TABLA
  // ==========================================

  function obtenerCuerpoTabla() {
    if (!tablaProductos) return null;

    if (tablaProductos.tagName === "TBODY") {
      return tablaProductos;
    }

    return tablaProductos.querySelector("tbody");
  }

  function crearCelda(valor) {
    const celda = document.createElement("td");
    celda.textContent = String(valor ?? "—");
    return celda;
  }

  function mostrarMensajeInventario(mensaje) {
    const cuerpo = obtenerCuerpoTabla();
    if (!cuerpo) return;

    cuerpo.replaceChildren();

    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = esAdmin ? 7 : 6;
    celda.textContent = mensaje;

    fila.appendChild(celda);
    cuerpo.appendChild(fila);
  }

  // ==========================================
  // MOSTRAR PRODUCTOS Y BOTÓN EDITAR
  // ==========================================

  function mostrarProductos(productos) {
    const cuerpo = obtenerCuerpoTabla();
    if (!cuerpo) return;

    cuerpo.replaceChildren();

    if (productos.length === 0) {
      mostrarMensajeInventario(
        "No se encontraron productos."
      );
      return;
    }

    const fragmento = document.createDocumentFragment();

    productos.forEach((producto) => {
      const fila = document.createElement("tr");

      const stock = Number(
        producto.stock_actual ?? 0
      );

      const minimo = Number(
        producto.stock_minimo ?? 5
      );

      fila.append(
        crearCelda(producto.codigo_sku),
        crearCelda(producto.nombre),
        crearCelda(producto.categoria),
        crearCelda(producto.marca),
        crearCelda(stock),
        crearCelda(producto.ubicacion_bodega)
      );

      // Botón Editar exclusivo del Administrador.
      if (esAdmin) {
        const celdaAcciones = document.createElement("td");
        const editar = document.createElement("button");

        editar.type = "button";
        editar.className = "editar-producto";
        editar.textContent = "Editar";

        editar.setAttribute(
          "aria-label",
          `Editar ${producto.nombre || "producto"}`
        );

        editar.addEventListener("click", () => {
          window.dispatchEvent(
            new CustomEvent("omni:editar-producto", {
              detail: producto
            })
          );
        });

        celdaAcciones.appendChild(editar);
        fila.appendChild(celdaAcciones);
      }

      if (stock <= minimo) {
        fila.classList.add("stock-bajo");
        fila.title = "Producto con stock bajo";
      }

      fragmento.appendChild(fila);
    });

    cuerpo.appendChild(fragmento);
  }

  // ==========================================
  // INVENTARIO - PAGINACIÓN
  // ==========================================

  function actualizarControlesPaginacion() {
    if (paginaActualEl) {
      paginaActualEl.textContent =
        String(paginaInventario);
    }

    if (totalPaginasEl) {
      totalPaginasEl.textContent =
        String(totalPaginasInventario);
    }

    if (paginaAnterior) {
      paginaAnterior.disabled =
        paginaInventario <= 1;
    }

    if (paginaSiguiente) {
      paginaSiguiente.disabled =
        paginaInventario >= totalPaginasInventario;
    }
  }

  // ==========================================
  // INVENTARIO - CONSULTAR MONGODB
  // ==========================================

  async function actualizarInventario() {
    if (controladorInventario) {
      controladorInventario.abort();
    }

    const controlador = new AbortController();
    controladorInventario = controlador;

    const numeroSolicitud = ++solicitudInventario;

    try {
      const parametros = new URLSearchParams({
        pagina: String(paginaInventario),
        limite: String(LIMITE_INVENTARIO)
      });

      if (busquedaInventario) {
        parametros.set("buscar", busquedaInventario);
      }

      const respuesta = await fetch(
        `/api/productos?${parametros.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: "no-store",
          signal: controlador.signal
        }
      );

      if (
        respuesta.status === 401 ||
        respuesta.status === 403
      ) {
        mostrarMensajeInventario(
          "No tienes autorización para consultar el inventario."
        );
        return;
      }

      if (!respuesta.ok) {
        throw new Error(
          `Error HTTP ${respuesta.status}`
        );
      }

      const datos = await respuesta.json();

      if (numeroSolicitud !== solicitudInventario) {
        return;
      }

      const productos = Array.isArray(datos.productos)
        ? datos.productos
        : [];

      totalPaginasInventario = Number(
        datos.totalPaginas ?? 0
      );

      if (
        totalPaginasInventario > 0 &&
        paginaInventario > totalPaginasInventario
      ) {
        paginaInventario = totalPaginasInventario;
        actualizarInventario();
        return;
      }

      if (
        totalPaginasInventario === 0 &&
        paginaInventario !== 1
      ) {
        paginaInventario = 1;
        actualizarInventario();
        return;
      }

      mostrarProductos(productos);
      actualizarControlesPaginacion();

    } catch (error) {
      if (error.name === "AbortError") return;

      console.error(
        "Error al consultar inventario:",
        error
      );

      if (numeroSolicitud === solicitudInventario) {
        mostrarMensajeInventario(
          "No se pudo conectar con el inventario."
        );
      }

    } finally {
      if (controladorInventario === controlador) {
        controladorInventario = null;
      }
    }
  }

  // ==========================================
  // ESTADÍSTICAS GLOBALES MONGODB
  // ==========================================

  async function actualizarEstadisticas() {
    if (consultandoEstadisticas) return;

    consultandoEstadisticas = true;

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

      if (!respuesta.ok) {
        throw new Error(
          `Estadísticas: HTTP ${respuesta.status}`
        );
      }

      const datos = await respuesta.json();

      // Total de registros.
      animarNumero(
        totalProductos,
        datos.totalProductos
      );

      // Stock global.
      animarNumero(
        totalStock,
        datos.totalStock
      );

      // Productos con stock bajo.
      animarNumero(
        totalAlertas,
        datos.totalAlertas
      );

      // Centro de alertas.
      if (alertasList) {
        const alertas = Number(
          datos.totalAlertas ?? 0
        );

        if (alertas === 0) {
          alertasList.textContent =
            "No hay productos con stock bajo.";
        } else {
          alertasList.textContent =
            `${alertas.toLocaleString("es-CL")} ` +
            "producto(s) con stock bajo o agotado. " +
            "Consulta el inventario para revisar sus existencias.";
        }
      }

    } catch (error) {
      console.error(
        "Error al consultar estadísticas:",
        error
      );

      if (alertasList) {
        alertasList.textContent =
          "No se pudieron consultar las alertas.";
      }

    } finally {
      consultandoEstadisticas = false;
    }
  }

  // ==========================================
  // INVENTARIO - BUSCADOR
  // ==========================================

  let temporizadorBusqueda = null;

  buscadorProductos?.addEventListener(
    "input",
    (evento) => {
      clearTimeout(temporizadorBusqueda);

      temporizadorBusqueda = setTimeout(() => {
        busquedaInventario =
          evento.target.value.trim();

        paginaInventario = 1;

        actualizarInventario();
      }, 350);
    }
  );

  // ==========================================
  // INVENTARIO - BOTONES DE PÁGINA
  // ==========================================

  paginaAnterior?.addEventListener(
    "click",
    () => {
      if (paginaInventario <= 1) return;

      paginaInventario--;
      actualizarInventario();
    }
  );

  paginaSiguiente?.addEventListener(
    "click",
    () => {
      if (
        paginaInventario >= totalPaginasInventario
      ) {
        return;
      }

      paginaInventario++;
      actualizarInventario();
    }
  );

  // ==========================================
  // ACTUALIZAR DESPUÉS DE GUARDAR PRODUCTOS
  // ==========================================

  window.addEventListener(
    "omni:productos-actualizados",
    () => {
      actualizarInventario();
      actualizarEstadisticas();
    }
  );

  // ==========================================
  // INICIAR MONITORES
  // ==========================================

  actualizarMovimientos();
  actualizarInventario();
  actualizarEstadisticas();

  // Movimientos cada 5 segundos.
  setInterval(actualizarMovimientos, 5000);

  // Inventario cada 15 segundos.
  setInterval(actualizarInventario, 15000);

  // Estadísticas cada 15 segundos.
  setInterval(actualizarEstadisticas, 15000);

});
