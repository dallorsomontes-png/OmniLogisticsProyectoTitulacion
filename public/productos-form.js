
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const token = sessionStorage.getItem("omni_token");
  let usuario = {};

  try {
    usuario = JSON.parse(
      sessionStorage.getItem("omni_usuario") || "{}"
    );
  } catch {
    return;
  }

  const esAdmin = usuario.rol === "Administrador";
  const panel = document.getElementById("gestion-productos");
  const form = document.getElementById("productoForm");
  const mensaje = document.getElementById("productoMensaje");
  const guardar = document.getElementById("guardarProducto");
  const cancelar = document.getElementById("cancelarProducto");

  if (!esAdmin || !token || !panel || !form) return;

  panel.hidden = false;

  const campo = (id) => document.getElementById(id);

  function notificar(texto, error = false) {
    mensaje.textContent = texto;
    mensaje.style.color = error ? "#fb7185" : "#34d399";
  }

  function limpiar() {
    form.reset();
    campo("productoId").value = "";
    campo("productoStockInicial").disabled = false;
    campo("stockInicialGrupo").hidden = false;
    campo("productoSku").readOnly = false;
    guardar.textContent = "Guardar producto";
    notificar("");
  }

  function entero(valor) {
    const texto = String(valor).trim();

    if (!/^\d+$/.test(texto)) return null;

    const n = Number(texto);

    return Number.isSafeInteger(n) && n >= 0
      ? n
      : null;
  }

  async function obtenerError(respuesta) {
    try {
      const datos = await respuesta.json();

      if (typeof datos.mensaje === "string") {
        return datos.mensaje;
      }

      if (typeof datos.error === "string") {
        return datos.error;
      }
    } catch {
      // Utilizar el código HTTP si no hay JSON.
    }

    return `Error HTTP ${respuesta.status}`;
  }

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const id = campo("productoId").value;
    const minimo = entero(
      campo("productoStockMinimo").value
    );
    const inicial = entero(
      campo("productoStockInicial").value
    );

    if (minimo === null || (!id && inicial === null)) {
      notificar(
        "El stock debe ser un número entero no negativo.",
        true
      );
      return;
    }

    const datos = {
      codigo_sku: campo("productoSku").value.trim(),
      nombre: campo("productoNombre").value.trim(),
      categoria: campo("productoCategoria").value.trim(),
      marca: campo("productoMarca").value.trim(),
      ubicacion_bodega: campo("productoUbicacion").value.trim(),
      stock_minimo: minimo
    };

    if (!id) {
      datos.stock_actual = inicial;
    }

    guardar.disabled = true;
    notificar("Guardando producto...");

    try {
      const url = id
        ? `/api/productos/${encodeURIComponent(id)}`
        : "/api/productos";

      const respuesta = await fetch(url, {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(datos)
      });

      if (!respuesta.ok) {
        throw new Error(
          await obtenerError(respuesta)
        );
      }

      limpiar();

      notificar(
        id
          ? "Producto actualizado correctamente."
          : "Producto registrado correctamente."
      );

      window.dispatchEvent(
        new CustomEvent("omni:productos-actualizados")
      );

    } catch (error) {
      notificar(
        error.message || "Error al guardar producto.",
        true
      );
    } finally {
      guardar.disabled = false;
    }
  });

  cancelar?.addEventListener("click", limpiar);

  // Recibe el producto seleccionado desde la tabla.
  window.addEventListener(
    "omni:editar-producto",
    (evento) => {
      const p = evento.detail;

      if (!p || !p._id) return;

      campo("productoId").value = p._id;
      campo("productoSku").value = p.codigo_sku || "";
      campo("productoNombre").value = p.nombre || "";
      campo("productoCategoria").value = p.categoria || "";
      campo("productoMarca").value = p.marca || "";
      campo("productoUbicacion").value =
        p.ubicacion_bodega || "";
      campo("productoStockMinimo").value =
        p.stock_minimo ?? 5;

      campo("productoSku").readOnly = true;
      campo("productoStockInicial").disabled = true;
      campo("stockInicialGrupo").hidden = true;

      guardar.textContent = "Actualizar producto";
      notificar("");

      panel.scrollIntoView({
        behavior: "smooth"
      });
    }
  );
});
