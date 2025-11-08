// infoPersonal.js

import { authenticatedFetch } from './api-helper.js'; 

document.addEventListener("DOMContentLoaded", () => {
    
    // --- SELECTORES DE FORMULARIO ---
    const formPerfil = document.getElementById('form-perfil');
    
    const inputNombre = document.getElementById('input-nombre');
    const inputApellido = document.getElementById('input-apellido');
    const inputDireccion = document.getElementById('input-direccion');
    const inputTelefono = document.getElementById('input-telefono');
    const inputEmail = document.getElementById('input-email');
    
    // --- CARGA DE DATOS (GET) ---

    async function cargarDatosPerfil() {
        // RUTA PROTEGIDA: GET /api/perfil/me
        try {
            const response = await authenticatedFetch('/perfil/me', { method: 'GET' });

            if (response.status === 404) {
                alert("Usuario no encontrado.");
                return;
            }
            if (response.status === 403 || response.status === 401) {
                alert("ACCESO DENEGADO. Necesitas iniciar sesión.");
                return;
            }
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const perfil = await response.json(); // Recibe el UsuarioPerfilDTO
            
            // Inyectar datos
            inputNombre.value = perfil.nombre || '';
            inputApellido.value = perfil.apellido || '';
            inputDireccion.value = perfil.direccion || ''; 
            inputTelefono.value = perfil.telefono || '';
            inputEmail.value = perfil.correo || '';
            
            console.log(`Perfil cargado con éxito. Rol: ${perfil.esUsuarioRestaurante ? 'Admin' : 'Empleado'}`);

        } catch (error) {
            console.error("Error al cargar el perfil:", error);
            document.getElementById('admin-main-container').innerHTML = "<p style='color:red;'>Error de conexión o token inválido.</p>";
        }
    }

    // --- GUARDAR CAMBIOS (PUT) ---

    if (formPerfil) {
        formPerfil.addEventListener('submit', async (e) => {
            e.preventDefault(); 

            const datosActualizados = {
                nombre: inputNombre.value,
                apellido: inputApellido.value,
                direccion: inputDireccion.value,
                telefono: inputTelefono.value,
                correo: inputEmail.value,
            };

            // RUTA PROTEGIDA: PUT /api/perfil/me
            try {
                const response = await authenticatedFetch('/perfil/me', {
                    method: 'PUT',
                    body: JSON.stringify(datosActualizados)
                });

                if (response.ok) {
                    alert("✅ ¡Perfil actualizado con éxito!");
                    // Opcional: Recargar los datos después de guardar
                    // cargarDatosPerfil(); 
                } else if (response.status === 403 || response.status === 401) {
                    alert("ACCESO DENEGADO. Token inválido.");
                } else {
                    alert(`Error al guardar cambios: ${response.status}`);
                }
            } catch (error) {
                console.error("Error al guardar:", error);
                alert("Ocurrió un error de red al intentar actualizar el perfil.");
            }
        });
    }

    // --- INICIO DE CARGA ---
    cargarDatosPerfil();
});