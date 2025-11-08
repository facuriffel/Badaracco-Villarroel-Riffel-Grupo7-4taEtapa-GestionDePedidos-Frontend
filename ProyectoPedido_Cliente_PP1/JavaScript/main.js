// main.js

import { authenticatedFetch } from '../../ProyectoPedido_Cocina_PP1/JavaScript/api-helper.js';

document.addEventListener("DOMContentLoaded", async () => {

    // SELECTORES
    const botonDia = document.querySelectorAll(".btnDia");
    const contenedor = document.getElementById("contenedorPlatos");

    let platosPorDia = {};

    // ------------------------------------------------------------------
    // GENERAR MAPEO DE LA SEMANA SIGUIENTE
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
    // CARGAR PLATOS
    // ------------------------------------------------------------------
    async function cargarPlatos(dia) {
        const fecha = mapeoDias[dia];
        const url = `/menu?fecha=${fecha}`;

        if (!contenedor) return;

        try {
            const respuesta = await authenticatedFetch(url, { method: 'GET' });

            if (respuesta.status === 204) {
                platosPorDia[dia] = [];
            } else if (respuesta.status === 401 || respuesta.status === 403) {
                contenedor.innerHTML = `<p class="alerta-error">Inicia sesión para ver los menús.</p>`;
                return;
            } else if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            } else {
                platosPorDia[dia] = await respuesta.json();
            }

            mostrarPlatos(dia);

        } catch (error) {
            console.error(`Error cargando los platos para ${dia}:`, error);
            contenedor.innerHTML = `<p style="color:red;">Error de conexión con el servidor.</p>`;
        }
    }

    function mostrarPlatos(dia) {
        const platos = platosPorDia[dia] || [];

        if (platos.length === 0) {
            contenedor.innerHTML = `<p class="mensaje-general">No hay menú disponible para ${dia}.</p>`;
            return;
        }

        contenedor.innerHTML = platos.map(plato => `
            <div class="card" data-id-menu-plato="${plato.idMenuPlato}" data-fecha="${plato.fechaMenu}">
                <img src="${plato.urlImagen}" alt="${plato.nombre}">
                <div class="card-content">
                    <h2>${plato.nombre}</h2>
                    <p>${plato.descripcion}</p>
                    <div class="info">
                        <span>Stock: ${plato.stockDisponible} </span> 
                        <button class="btnAgregar" ${plato.stockDisponible <= 0 ? 'disabled' : ''} data-id="${plato.idMenuPlato}">+</button>
                    </div>
                </div>
            </div>
        `).join("");

        contenedor.querySelectorAll(".btnAgregar").forEach(btn => {
            btn.addEventListener("click", () => {
                const platoCard = btn.closest(".card");
                const idMenuPlato = parseInt(btn.getAttribute("data-id"));
                const fechaEntrega = platoCard.getAttribute("data-fecha");
                const nombre = platoCard.querySelector("h2").textContent;

                agregarPlatoAPI(idMenuPlato, fechaEntrega, nombre);
            });
        });
    }

    // ------------------------------------------------------------------
    // AGREGAR PLATO
    // ------------------------------------------------------------------
    async function agregarPlatoAPI(idMenuPlato, fechaEntrega, nombre) {
        const url = `/pedidos`;
        const payload = { idMenuPlato, fechaEntrega };

        try {
            const response = await authenticatedFetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 201) {
                alert(`✅ Plato "${nombre}" agregado correctamente al pedido.`);
                await obtenerYMostrarLista();
                return true;

            } else if (response.status === 409) {
                const errorData = await response.json();
                alert(errorData.message || "⚠️ No se puede seleccionar más de un plato para el mismo día.");
                return false;

            } else if (response.status === 403) {
                const text = await response.text();
                if (text.toLowerCase().includes("ya hay un plato") || text.toLowerCase().includes("conflict")) {
                    alert(" No se puede seleccionar más de un plato para el mismo día.");
                } else {
                    alert(" No tienes permiso para agregar este plato. Inicia sesión nuevamente.");
                }
                return false;

            } else {
                const text = await response.text();
                alert(`Ocurrió un error al agregar el plato: ${text}`);
                return false;
            }

        } catch (error) {
            console.error("Error de conexión al agregar plato:", error);
            alert("Ocurrió un error al conectar con el servidor.");
            return false;
        }
    }

    // ------------------------------------------------------------------
    // BOTONES DE DÍA
    // ------------------------------------------------------------------
    if (botonDia.length > 0) {
        botonDia.forEach(btn => {
            btn.addEventListener("click", () => {
                botonDia.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                cargarPlatos(btn.textContent);
            });
        });

        // Cargar automáticamente el primer día
        const primerDia = botonDia[0].textContent;
        cargarPlatos(primerDia).then(() => {
            if (botonDia[0]) botonDia[0].classList.add("active");
        }).catch(console.error);
    } else {
        console.warn("No se encontraron botones de día (.btnDia) en el DOM.");
    }

    // ------------------------------------------------------------------
    // FUNCIONES AUXILIARES PARA ACTUALIZAR LISTA
    // ------------------------------------------------------------------
    async function obtenerYMostrarLista() {
        // Llamada a la lista de pedidos para mantener actualizada la interfaz
        // Aquí podés invocar tu lista.js o recargar la vista según tu proyecto
    }

});
