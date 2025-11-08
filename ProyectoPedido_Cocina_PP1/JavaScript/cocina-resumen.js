// cocina-resumen.js

import { authenticatedFetch } from './api-helper.js'; 

document.addEventListener("DOMContentLoaded", () => {
    
    // --- SELECTORES ---
    const contenedorResumen = document.getElementById("contenedor-resumen-produccion"); 
    // Los selectores de fecha y botón ya no se usan para el filtro, pero los mantenemos para el evento inicial
    const inputFecha = document.getElementById("input-fecha-resumen"); 
    const btnBuscar = document.getElementById("btn-buscar-resumen"); 
    
    // NOTA: API_BASE_URL no se usa si authenticatedFetch antepone /api/
    
    // --- UTILIDAD DE FECHAS ---
    function obtenerNombreDia(fechaISO) {
        // La fechaISO debe ser YYYY-MM-DD
        const d = new Date(fechaISO + 'T00:00:00'); 
        const opciones = { weekday: 'long' };
        return d.toLocaleDateString('es-ES', opciones).toUpperCase();
    }
    
    // --- LÓGICA DE CONEXIÓN Y CARGA ---

    async function cargarReporteSemanal() {
        // Llama al endpoint de reporte semanal completo
        const url = `/pedidos/admin/reporte-semanal`; 
        
        try {
            //2. USAR authenticatedFetch para incluir el Token JWT
            const response = await authenticatedFetch(url, { method: 'GET' });

            if (response.status === 204) {
                contenedorResumen.innerHTML = `<p class="mensaje-general">No hay pedidos confirmados para la próxima semana.</p>`;
                return;
            }
            
            //3. MANEJO DE ERRORES DE SEGURIDAD (401/403)
            if (response.status === 403 || response.status === 401) {
                contenedorResumen.innerHTML = `<p class="alerta-error">ACCESO DENEGADO. Por favor, inicie sesión como Administrador.</p>`;
                return;
            }

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const reporte = await response.json(); // Lista de ProduccionDiaDTO
            mostrarReporteConsolidado(reporte);

        } catch (error) {
            console.error("Error al obtener reporte semanal:", error);
            contenedorResumen.innerHTML = `<p class="alerta-error">Error de conexión con el backend.</p>`;
        }
    }

    // --- RENDERIZACIÓN DE RESULTADOS CON AGRUPACIÓN Y FORMATO CARD ---

    function mostrarReporteConsolidado(reporte) {
        
        // 1. Agrupar los ítems por fecha
        const reporteAgrupado = reporte.reduce((acc, item) => {
            const fecha = item.fechaEntrega; 
            if (!acc[fecha]) {
                acc[fecha] = [];
            }
            acc[fecha].push(item);
            return acc;
        }, {});
        
        const fechasOrdenadas = Object.keys(reporteAgrupado).sort();

        let html = '';

        if (fechasOrdenadas.length === 0) {
              contenedorResumen.innerHTML = `<p class="mensaje-general">No hay pedidos confirmados para la próxima semana.</p>`;
              return;
        }

        // 2. Mapeo final por Día y Renderizado de Tarjetas
        fechasOrdenadas.forEach(fecha => {
            const nombreDia = obtenerNombreDia(fecha);
            const itemsDelDia = reporteAgrupado[fecha];
            
            // Subtítulo del Día
            html += `<h3 class="diaSeparador">${nombreDia} (${fecha})</h3>`;
            
            itemsDelDia.forEach(item => {
                //  ESTRUCTURA CARD FINAL (Usando los atributos del DTO)
                html += `
                    <div class="card reporte-card">
                        <img src="${item.urlImagenPlato || ''}" alt="${item.nombrePlato}">
                        <div class="card-content">
                            <h2>${item.nombrePlato}</h2>
                            <p>Categoría: ${item.categoriaPlato || 'N/A'}</p>
                            <div class="info">
                                <span>Total a Preparar:</span>
                                <div class="cantidad-produccion">
                                    <strong>${item.cantidadTotal}</strong> UNIDADES
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
        });
        
        contenedorResumen.innerHTML = html;
    }
    
    // --- EVENTOS DE INTERFAZ ---
    
    // El botón "Buscar" ahora solo sirve para recargar el reporte semanal
    if (btnBuscar && inputFecha) {
        btnBuscar.addEventListener("click", () => {
            cargarReporteSemanal(); 
            alert('Cargando reporte de la próxima semana.');
        });
    }

    // INICIALIZACIÓN: Cargar el reporte semanal completo al iniciar la página
    cargarReporteSemanal();
});