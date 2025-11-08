// login.js

const API_BASE_URL = 'http://localhost:8080/api';
const TOKEN_KEY = 'jwt_token';
const ROLE_KEY = 'user_role';

const PATH_EMPLEADO = '/ProyectoPedido_Cliente_PP1/html/principal_platos.html';
const PATH_ADMIN = '/ProyectoPedido_Cocina_PP1/html/principal_carga_platos.html';

function guardarSesion(token, rol) {
    // Guardamos en sessionStorage para que cada pestaña tenga su token independiente
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(ROLE_KEY, rol);
}

function redirigir(rol) {
    if (rol === 'ADMIN') {
        window.location.href = PATH_ADMIN;
    } else {
        window.location.href = PATH_EMPLEADO;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const mensaje = document.getElementById("mensaje");

    if (!form) return;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        mensaje.textContent = "";

        const correo = document.getElementById("username").value;
        const contrasena = document.getElementById("password").value;

        const credenciales = { correo, contrasena };

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credenciales)
            });

            const data = await response.json().catch(() => ({ message: 'Error de parseo o conexión' }));

            if (response.ok) {
                guardarSesion(data.token, data.rol);

                mensaje.textContent = `Login exitoso. Bienvenido, ${data.rol}!`;
                mensaje.style.color = "green";
                mensaje.classList.add("mensaje-general");

                setTimeout(() => redirigir(data.rol), 1000);

            } else if (response.status === 401) {
                mensaje.textContent = "Usuario o contraseña incorrectos";
                mensaje.style.color = "red";

            } else {
                mensaje.textContent = data.message || `Error desconocido al iniciar sesión. Código: ${response.status}`;
                mensaje.style.color = "red";
            }

        } catch (error) {
            console.error("Fallo de red:", error);
            mensaje.textContent = "Error de conexión con el servidor.";
            mensaje.style.color = "red";
        }

        if (mensaje.style.color === "red") {
            setTimeout(() => { mensaje.textContent = ""; }, 3000);
        }
    });
});
