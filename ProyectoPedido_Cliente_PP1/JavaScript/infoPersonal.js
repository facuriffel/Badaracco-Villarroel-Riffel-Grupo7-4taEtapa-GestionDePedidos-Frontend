// infoPersonal.js

import { authenticatedFetch } from '../../ProyectoPedido_Cocina_PP1/JavaScript/api-helper.js'; 

document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. SELECTORES DEL DOM (Ajustados con IDs) ---
    const formPerfil = document.getElementById('form-perfil'); // Asumimos que añades id="form-perfil" al <form>
    
    // Asumimos que los inputs han sido modificados con estos IDs en el HTML
    const inputNombre = document.getElementById('input-nombre');
    const inputApellido = document.getElementById('input-apellido');
    const inputDireccion = document.getElementById('input-direccion');
    const inputTelefono = document.getElementById('input-telefono');
    const inputEmail = document.getElementById('input-email');
    
    // --- 2. FUNCIONES ASÍNCRONAS DE CONEXIÓN ---

    async function cargarDatosPerfil() {
        //  RUTA PROTEGIDA: GET /api/perfil/me (El Backend obtiene el ID del token)
        try {
            const response = await authenticatedFetch('/perfil/me', { method: 'GET' });

            if (response.status === 403 || response.status === 401) {
                // El token no existe o es inválido.
                if (formPerfil) { formPerfil.innerHTML = "<p style='color:red;'>ACCESO DENEGADO. Por favor, inicie sesión.</p>"; }
                return;
            }
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const perfil = await response.json(); // Recibe el UsuarioPerfilDTO
            
            //  INYECCIÓN DE DATOS EN EL FORMULARIO
            
            if (inputNombre) inputNombre.value = perfil.nombre || '';
            if (inputApellido) inputApellido.value = perfil.apellido || '';
            if (inputDireccion) inputDireccion.value = perfil.direccion || ''; // Mapeo de Dirección
            if (inputTelefono) inputTelefono.value = perfil.telefono || '';
            if (inputEmail) inputEmail.value = perfil.correo || '';
            
        } catch (error) {
            console.error("Error al cargar el perfil:", error);
            if (formPerfil) {
                formPerfil.innerHTML = "<p style='color:red;'>Error de conexión con el servidor.</p>";
            }
        }
    }

    async function guardarDatosPerfil(datosActualizados) {
        //  RUTA PROTEGIDA: PUT /api/perfil/me
        try {
            const response = await authenticatedFetch('/perfil/me', {
                method: 'PUT',
                body: JSON.stringify(datosActualizados)
            });

            if (response.ok) {
                alert("✅ ¡Perfil actualizado con éxito!");
            } else if (response.status === 403 || response.status === 401) {
                alert("ACCESO DENEGADO. Token inválido.");
            } else {
                alert(`Error al guardar cambios: ${response.status}`);
            }
        } catch (error) {
            console.error("Error de red al guardar:", error);
            alert("Ocurrió un error de red al intentar actualizar el perfil.");
        }
    }

    // --- 3. CONEXIÓN DEL EVENTO SUBMIT ---

    if (document.getElementById('form-perfil')) { 
        document.getElementById('form-perfil').addEventListener('submit', async (e) => {
            e.preventDefault(); 

            // Recolección de datos basada en los IDs
            const datosActualizados = {
                nombre: inputNombre.value,
                apellido: inputApellido.value,
                direccion: inputDireccion.value, 
                telefono: inputTelefono.value,
                correo: inputEmail.value,
            };
            
            // Llama a la función de guardado
            await guardarDatosPerfil(datosActualizados);
        });
    }

    // --- 4. INICIO DE CARGA ---
    cargarDatosPerfil();
});