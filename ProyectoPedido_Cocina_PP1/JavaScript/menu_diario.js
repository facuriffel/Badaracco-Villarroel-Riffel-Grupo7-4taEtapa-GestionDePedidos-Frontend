// oferta-admin.js

import { authenticatedFetch } from './api-helper.js'; // ⬅️ AGREGAR ESTO

document.addEventListener("DOMContentLoaded", () => {

    /**
     * Crea una nueva Oferta de Menú para un día específico con sus stocks.
     * @param {string} fecha - Formato YYYY-MM-DD.
     * @param {Array<{idPlato: number, stockDisponible: number}>} items - Lista de platos y su stock.
     */
    async function crearOfertaDiaria(fecha, items) {
        // ⬇️ CAMBIAR ENDPOINT RELATIVO
        const url = `/menu/admin`; 
        
        const ofertaData = {
            fecha: fecha,
            descripcion: "Menú diario (gestión web)", 
            publicado: true,
            items: items
        };

        try {
            // ⬇️ USAR authenticatedFetch EN VEZ DE fetch
            const response = await authenticatedFetch(url, {
                method: 'POST',
                body: JSON.stringify(ofertaData)
            });

            if (response.status === 201) {
                alert(`✅ Oferta de menú creada para el ${fecha}.`);
                return true;
            } 
            
            // ⬇️ AGREGAR MANEJO DE ERRORES DE AUTENTICACIÓN
            if (response.status === 403 || response.status === 401) {
                alert("ACCESO DENEGADO. Necesitas iniciar sesión como Administrador.");
                return null;
            }
            
            if (response.status === 500) {
                 const errorBody = await response.json();
                 alert(`Error al crear oferta: ${errorBody.message}`);
                 return null;
            }
            
            throw new Error(`Fallo la creación de la oferta: ${response.status}`);

        } catch (error) {
            console.error("Fallo de conexión:", error);
            alert("No se pudo conectar al servidor para crear la oferta.");
        }
    }

});