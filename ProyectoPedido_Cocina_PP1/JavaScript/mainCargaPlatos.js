// mainCargaPlatos.js (o menu-gestion.js)
// Requiere que el archivo './api-helper.js' esté en el mismo directorio.

import { authenticatedFetch } from './api-helper.js'; 

document.addEventListener("DOMContentLoaded", async () => {
    
    // --- 1. CONFIGURACIÓN Y SELECTORES GLOBALES ---
    const API_BASE_URL = 'http://localhost:8080/api';
    
    const botonDia = document.querySelectorAll(".btnDia");
    const contenedorPlatos = document.getElementById("contenedorPlatos"); 
    
    const formPlatoCatalogo = document.getElementById('form-plato-catalogo');
    const inputPlatoId = document.getElementById('input-plato-id'); 
    const formOfertaDia = document.getElementById('form-oferta-dia');
    const platosCatalogoList = document.getElementById('platos-catalogo-list');
    
    const catalogoGestionList = document.getElementById('listado-catalogo-existente'); 
    const btnGuardarPlato = document.getElementById('btn-guardar-plato');

    let catalogoPlatos = [];
    let ofertaPorDia = {};

    // ------------------------------------------------------------------
    // A. LÓGICA DINÁMICA DE FECHAS
    // ------------------------------------------------------------------
    function generarMapeoSemanaProxima() {
        const today = new Date();
        const dayOfWeek = today.getDay(); 
        const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; 

        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilNextMonday);

        const mapeo = {};
        const nombresDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

        for (let i = 0; i < 5; i++) {
            const currentDay = new Date(nextMonday);
            currentDay.setDate(nextMonday.getDate() + i);
            const fechaISO = currentDay.toISOString().split('T')[0]; 
            mapeo[nombresDias[i]] = fechaISO;
        }
        return mapeo;
    }
    const mapeoDias = generarMapeoSemanaProxima();

    // ------------------------------------------------------------------
    // B. FUNCIONES DE ACCIÓN CRUD (Deben estar al inicio para ser llamadas por eventos)
    // ------------------------------------------------------------------
    
    function limpiarFormularioCatalogo() {
        formPlatoCatalogo.reset();
        if (inputPlatoId) inputPlatoId.value = '';
        if (btnGuardarPlato) {
            btnGuardarPlato.textContent = "Guardar Plato en Catálogo";
            btnGuardarPlato.classList.remove('btn-warning'); 
        }
    }
    
    function limpiarFormularioOferta() {
        document.getElementById('input-fecha-oferta').value = '';
        const stockInputs = platosCatalogoList.querySelectorAll('input[type="number"]');
        stockInputs.forEach(input => {
            input.value = 0;
        });
    }

    function cargarPlatoEnFormulario(idPlato) {
        const plato = catalogoPlatos.find(p => p.id === idPlato);
        if (!plato) { alert("Error: Plato no encontrado."); return; }

        document.getElementById('input-plato-id').value = plato.id;
        document.getElementById('input-nombre').value = plato.nombre;
        document.getElementById('input-descripcion').value = plato.descripcion;
        document.getElementById('input-categoria').value = plato.categoria;
        document.getElementById('input-imagen-url').value = plato.imagen;

        if (btnGuardarPlato) {
            btnGuardarPlato.textContent = "Actualizar Plato (ID " + plato.id + ")";
            btnGuardarPlato.classList.add('btn-warning'); 
        }
        formPlatoCatalogo.scrollIntoView({ behavior: 'smooth' });
    }
    
    // --- Lógica de Eliminación de Catálogo (DELETE) ---
    // async function eliminarPlatoCatalogo(idPlato) {
    //     if (!confirm(`¿Estás seguro de que quieres eliminar el Plato ID ${idPlato} del catálogo base?`)) { return; }

    //     try {
    //         const response = await authenticatedFetch(`/admin/platos/${idPlato}`, { method: 'DELETE' });

    //         if (response.status === 204) {
    //             alert(`✅ Plato ID ${idPlato} eliminado del catálogo.`);
    //             await cargarCatalogo(); 
    //         } else if (response.status === 403 || response.status === 401) {
    //              alert("ACCESO DENEGADO. Necesitas iniciar sesión como Administrador.");
    //         } else {
    //             alert(`Fallo al eliminar el plato. Código: ${response.status}`);
    //         }
    //     } catch (error) {
    //         alert("Ocurrió un error de red al intentar eliminar el plato.");
    //     }
    // }

    async function eliminarPlatoCatalogo(idPlato) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el Plato ID ${idPlato} del catálogo base?`)) { 
        return; 
    }

    // ⬇️ AGREGAR ESTE DEBUG
    const token = sessionStorage.getItem('jwt_token');
    console.log('🔑 Token al eliminar:', token ? 'EXISTE ✅' : 'NO EXISTE ❌');
    console.log('🆔 ID del plato:', idPlato);

    try {
        const response = await authenticatedFetch(`/admin/platos/${idPlato}`, { 
            method: 'DELETE' 
        });

        // ⬇️ AGREGAR MÁS INFO DE DEBUG
        console.log('📡 Status de respuesta:', response.status);

        if (response.status === 204) {
            alert(`✅ Plato ID ${idPlato} eliminado del catálogo.`);
            await cargarCatalogo(); 
        } else if (response.status === 403 || response.status === 401) {
            alert("ACCESO DENEGADO. Necesitas iniciar sesión como Administrador.");
        } else {
            alert(`Fallo al eliminar el plato. Código: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error completo:', error);
        alert("Ocurrió un error de red al intentar eliminar el plato.");
    }
}

    // --- Lógica de Eliminación de Oferta Diaria (DELETE) ---
    async function eliminarOfertaDiariaItem(idMenuPlato, diaActivo) {
        if (!confirm("¿Estás seguro de que quieres eliminar este ítem de la oferta del día?")) { return; }

        try {
            const url = `/menu/admin/item/${idMenuPlato}`; 
            const response = await authenticatedFetch(url, { method: 'DELETE' });

            if (response.status === 204) {
                alert("✅ Ítem de oferta eliminado con éxito.");
                await cargarOfertaDiaria(diaActivo); 
            } else if (response.status === 403 || response.status === 401) {
                 alert("ACCESO DENEGADO. Necesitas iniciar sesión como Administrador.");
            } else {
                alert(`Error al eliminar. Código de respuesta: ${response.status}`);
            }
        } catch (error) {
            alert(`Ocurrió un error al intentar eliminar la oferta.`); 
        }
    }
    
    // --- Lógica de Obtención de Ítems (Utilidad) ---
    function obtenerItemsParaOferta() {
        const items = [];
        platosCatalogoList.querySelectorAll('.plato-item').forEach(itemDiv => {
            const idPlato = parseInt(itemDiv.getAttribute('data-plato-id'));
            const stockInput = itemDiv.querySelector('input[type="number"]');
            const stock = parseInt(stockInput.value);

            if (stock > 0 && idPlato) { 
                items.push({ idPlato: idPlato, stockDisponible: stock });
            }
        });
        return items;
    }


    // ------------------------------------------------------------------
    // D. FUNCIONES DE CARGA Y RENDERIZADO (Intermedias)
    // ------------------------------------------------------------------

    async function cargarCatalogo() {
        try {
            // RUTA PROTEGIDA: Obtener catálogo
            const respuesta = await authenticatedFetch('/admin/platos', { method: 'GET' }); 
            
            if (respuesta.status === 403 || respuesta.status === 401) {
                 // Si no hay token o no es ADMIN, muestra mensaje de acceso denegado
                 catalogoPlatos = [];
                 if(platosCatalogoList) platosCatalogoList.innerHTML = `<p style="color:red;">ACCESO DENEGADO. Inicie sesión como Administrador.</p>`;
                 if(catalogoGestionList) catalogoGestionList.innerHTML = `<p style="color:red;">ACCESO DENEGADO.</p>`;
                 return;
            } else if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            } else {
                catalogoPlatos = await respuesta.json().catch(() => []); 
            }
            
            if (platosCatalogoList) renderizarCatalogoParaOferta();
            if (catalogoGestionList) renderizarCatalogoParaGestion(catalogoGestionList);
        } catch (error) {
            console.error("Error cargando el catálogo:", error);
        }
    }
    
    async function cargarOfertaDiaria(dia) {
        // RUTA PÚBLICA: /menu
        const fecha = mapeoDias[dia];
        const url = `${API_BASE_URL}/menu?fecha=${fecha}`; 

        try {
            const respuesta = await fetch(url);
            if (respuesta.status === 204) {
                ofertaPorDia[dia] = [];
            } else if (!respuesta.ok) {
                 throw new Error(`Error HTTP: ${respuesta.status}`);
            } else {
                ofertaPorDia[dia] = await respuesta.json(); 
            }
            mostrarPlatos(dia);
        } catch (error) {
            console.error(`Error cargando la oferta para ${dia}:`, error);
            if (contenedorPlatos) { contenedorPlatos.innerHTML = `<p style="color:red;">Error de conexión al cargar la oferta.</p>`; }
        }
    }

    function renderizarCatalogoParaGestion(contenedorHtml) {
        // [CÓDIGO DE RENDERIZADO DE GESTIÓN CON LISTENERS]
        if (catalogoPlatos.length === 0) { contenedorHtml.innerHTML = `<p class="mensaje-general">No hay platos en el catálogo base.</p>`; return; }

        contenedorHtml.innerHTML = catalogoPlatos.map(plato => `
            <div class="plato-gestion-item" data-plato-id="${plato.id}">
                <span>${plato.nombre} (${plato.categoria})</span>
                <div class="acciones">
                    <button class="btnAdmin btn-editar-catalogo" data-id="${plato.id}">Editar</button> 
                    <button class="btnAdmin btn-eliminar-catalogo" data-id="${plato.id}">Eliminar</button>
                </div>
            </div>
        `).join('');

        contenedorHtml.querySelectorAll('.btn-editar-catalogo').forEach(btn => {
            btn.addEventListener('click', () => {
                const platoId = parseInt(btn.getAttribute('data-id'));
                cargarPlatoEnFormulario(platoId); 
            });
        });
        
        contenedorHtml.querySelectorAll('.btn-eliminar-catalogo').forEach(btn => {
            btn.addEventListener('click', () => {
                const platoId = parseInt(btn.getAttribute('data-id'));
                eliminarPlatoCatalogo(platoId); 
            });
        });
    }

    function renderizarCatalogoParaOferta() {
        // [CÓDIGO DE RENDERIZADO DE STOCK]
         if (catalogoPlatos.length === 0) { platosCatalogoList.innerHTML = `<p class="mensaje-general">No hay platos en el catálogo. ¡Crea uno!</p>`; return; }
        
        platosCatalogoList.innerHTML = catalogoPlatos.map(plato => `
            <div class="plato-item" data-plato-id="${plato.id}">
                <span>${plato.nombre} (${plato.categoria})</span>
                <div>
                    <label for="stock-${plato.id}">Stock:</label>
                    <input type="number" id="stock-${plato.id}" min="0" value="0">
                </div>
            </div>
        `).join('');
    }

    function mostrarPlatos(dia) {
        // [CÓDIGO DE MOSTRAR OFERTA EN TARJETAS]
        const platosEnOferta = ofertaPorDia[dia] || [];
        if (!contenedorPlatos) return;

        contenedorPlatos.innerHTML = ""; 

        if (platosEnOferta.length === 0) {
            contenedorPlatos.innerHTML = `<p class="mensaje-general">No hay oferta publicada para el día ${dia} (${mapeoDias[dia]}).</p>`;
            return;
        }
        
        platosEnOferta.forEach(plato => {
            const div = document.createElement("div");
            div.classList.add("card");
            div.innerHTML = `
                <img src="${plato.urlImagen}" alt="${plato.nombre}">
                <div class="card-content">
                  <h2>${plato.nombre}</h2>
                  <p>${plato.descripcion}</p>
                  <div class="info">
                    <span>Stock Disponible: ${plato.stockDisponible}</span>
                    <button class="btnAdmin btnEliminarOferta" data-id-menu-plato="${plato.idMenuPlato}">Eliminar</button>
                  </div>
                </div>
            `;
            contenedorPlatos.appendChild(div);
        });

        // Conexión de Eventos a Botones de Administración de Oferta
        contenedorPlatos.querySelectorAll('.btnEliminarOferta').forEach(btn => {
            btn.addEventListener('click', () => {
                const idMenuPlato = btn.getAttribute('data-id-menu-plato');
                eliminarOfertaDiariaItem(idMenuPlato, dia); // Llama a la función de Acción
            });
        });
    }

    // ------------------------------------------------------------------
    // F. MANEJO DE SUBMITS Y INICIALIZACIÓN
    // ------------------------------------------------------------------
    
    // --- 1. Subida/Edición de Catálogo (POST o PUT /api/admin/platos) ---
    if (formPlatoCatalogo) {
        formPlatoCatalogo.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const isEditing = inputPlatoId && inputPlatoId.value;
            const method = isEditing ? 'PUT' : 'POST';
            const endpoint = `/admin/platos${isEditing ? '/' + inputPlatoId.value : ''}`;
            
            const platoData = {
                nombre: document.getElementById('input-nombre').value,
                descripcion: document.getElementById('input-descripcion').value,
                categoria: document.getElementById('input-categoria').value,
                imagen: document.getElementById('input-imagen-url').value
            };
            
            try {
                const response = await authenticatedFetch(endpoint, { method: method, body: JSON.stringify(platoData) });

                if (response.ok) {
                    alert(`✅ Plato ${isEditing ? 'actualizado' : 'creado'} con éxito.`);
                    limpiarFormularioCatalogo();
                    await cargarCatalogo(); 
                } else if (response.status === 403 || response.status === 401) {
                     alert("ACCESO DENEGADO. Necesitas iniciar sesión como Administrador.");
                } else {
                    throw new Error(`Fallo con código: ${response.status}`);
                }
            } catch (error) {
                alert(`Ocurrió un error al intentar ${isEditing ? 'actualizar' : 'crear'} el plato.`);
            }
        });
    }
    
    // --- 2. Publicación de Oferta (POST /api/menu/admin) ---
    if (formOfertaDia) {
        formOfertaDia.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fechaSeleccionada = document.getElementById('input-fecha-oferta').value;
            const itemsParaPublicar = obtenerItemsParaOferta();

            if (!fechaSeleccionada) { alert('Selecciona una fecha.'); return; }
            if (itemsParaPublicar.length === 0) { alert('Agrega al menos un plato con stock > 0.'); return; }
            
            const ofertaData = { fecha: fechaSeleccionada, descripcion: "Menú publicado desde el panel de administración.", publicado: true, items: itemsParaPublicar };

            try {
                const response = await authenticatedFetch('/menu/admin', { method: 'POST', body: JSON.stringify(ofertaData) });

                if (response.status === 201) {
                    alert(`✅ Oferta publicada para el ${fechaSeleccionada}.`);
                    formOfertaDia.reset();
                    
                    const diaActivo = document.querySelector(".btnDia.active").textContent;
                    if (diaActivo && mapeoDias[diaActivo] === fechaSeleccionada) {
                        await cargarOfertaDiaria(diaActivo); 
                    } else {
                         limpiarFormularioOferta();
                    }
                    
                } else if (response.status === 403 || response.status === 401) {
                     alert("ACCESO DENEGADO. Necesitas iniciar sesión como Administrador.");
                } else if (response.status === 500) {
                     const errorBody = await response.json();
                     alert(`Error al publicar oferta: ${errorBody.message}. (¿Ya existe un menú para esa fecha?)`);
                } else {
                    throw new Error(`Fallo con código: ${response.status}`);
                }
            } catch (error) {
                alert("Ocurrió un error al intentar publicar la oferta.");
            }
        });
    }
    
    // --- 3. Eventos de Días (Carga de la Oferta) ---
    botonDia.forEach(btn => {
        btn.addEventListener("click", () => {
            botonDia.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            cargarOfertaDiaria(btn.textContent); 
        });
    });

    // --- 4. INICIALIZACIÓN FINAL ---
    await cargarCatalogo(); 
    
    if (botonDia.length > 0) {
        const primerDia = botonDia[0].textContent;
        botonDia[0].classList.add("active");
        await cargarOfertaDiaria(primerDia); 
    }
});