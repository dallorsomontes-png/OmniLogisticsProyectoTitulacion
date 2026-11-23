
"use strict";

const formulario = document.getElementById("loginForm");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("loginButton");

// Si ya existe una sesión, abrir el dashboard
const tokenExistente = sessionStorage.getItem("omni_token");

if (tokenExistente) {
  window.location.replace("/dashboard.html");
}

// Iniciar sesión
formulario.addEventListener("submit", async (event) => {

  event.preventDefault();

  const username = document
    .getElementById("username")
    .value.trim();

  const password = document
    .getElementById("password")
    .value;

  if (!username || !password) {
    mensaje.style.color = "#dc2626";
    mensaje.textContent =
      "Debe ingresar su usuario y contraseña.";
    return;
  }

  boton.disabled = true;
  boton.textContent = "Verificando...";

  mensaje.style.color = "#64748b";
  mensaje.textContent = "Comprobando credenciales...";

  try {

    const respuesta = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        datos.mensaje || "Error al iniciar sesión."
      );
    }

    if (
      !datos.token ||
      !datos.usuario ||
      !datos.usuario.rol
    ) {
      throw new Error(
        "La respuesta del servidor está incompleta."
      );
    }

    // Guardar sesión
    sessionStorage.setItem("omni_token", datos.token);

    sessionStorage.setItem(
      "omni_usuario",
      JSON.stringify(datos.usuario)
    );

    // Confirmación
    mensaje.style.color = "#15803d";
    mensaje.textContent =
      "Bienvenido, " + datos.usuario.username;

    boton.textContent = "Ingresando...";

    // Abrir dashboard automáticamente
    window.location.replace("/dashboard.html");

  } catch (error) {

    sessionStorage.removeItem("omni_token");
    sessionStorage.removeItem("omni_usuario");

    mensaje.style.color = "#dc2626";
    mensaje.textContent = error.message;

    boton.disabled = false;
    boton.textContent = "Iniciar sesión";

  }

});


























