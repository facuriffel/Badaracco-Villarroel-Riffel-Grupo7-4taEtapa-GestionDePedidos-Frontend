// register.js

const API_BASE_URL = 'https://badaracco-villarroel-riffel-grupo7-4taetapa-gest-production.up.railway.app';
const PATH_LOGIN = 'index.html'; // Redirigir al login

const formRegistro = document.getElementById('form-registro');
const mensajeRegistro = document.getElementById('mensaje-registro'); // Usaremos el <p> con el link

if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Recolección de datos (Asegúrate de que los IDs coinciden con tu HTML de registro)
        const userData = {
            nombre: document.getElementById('input-nombre').value,
            apellido: document.getElementById('input-apellido').value,
            correo: document.getElementById('input-correo').value,
            contrasena: document.getElementById('input-contrasena').value,
            telefono: document.getElementById('input-telefono').value,
            direccion: document.getElementById('input-direccion').value,
            //CAMPO CLAVE: Si el campo no existe en el HTML, obtendrá null/undefined, lo cual es manejado por el backend como NO ADMIN
            codigoSecreto: document.getElementById('input-codigo-secreto')?.value || null 
        };

        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (response.status === 201) {
                const rol = data.esUsuarioRestaurante ? 'ADMINISTRADOR' : 'EMPLEADO';
                
                // Mostrar éxito y redirigir
                alert(`✅ Registro exitoso! Rol asignado: ${rol}. Serás redirigido al login.`);
                window.location.href = PATH_LOGIN; 

            } else {
                // Manejar errores de validación o correo duplicado (lanzados por el backend)
                mensajeRegistro.textContent = data.message || "Error: El correo ya está en uso o datos inválidos.";
                mensajeRegistro.style.color = "red";
                setTimeout(() => { mensajeRegistro.textContent = ""; }, 4000);
            }
        } catch (error) {
            console.error("Fallo de red:", error);
            mensajeRegistro.textContent = "Error de conexión con el servidor.";
            mensajeRegistro.style.color = "red";
        }
    });
}