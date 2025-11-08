// lista.js
import { authenticatedFetch } from '../../ProyectoPedido_Cocina_PP1/JavaScript/api-helper.js';

document.addEventListener("DOMContentLoaded", () => {

    const contenedor = document.getElementById("lista");
    const btnConfirmar = document.getElementById("btnConfirmarPedido");

    // Obtener rol actual de la sesión
    const ROL_USUARIO = 'USUARIO';

    // ------------------------------------------------------------------
    // ESTADO Y RENDERIZADO DEL BOTÓN
    // ------------------------------------------------------------------
    async function obtenerEstadoPedidoPrincipal() {
        try {
            const urlEstado = `/pedidos/estado`;
            const response = await authenticatedFetch(urlEstado, { method: 'GET' }, ROL_USUARIO);

            if (response.status === 404) return { estado: 'NULO', idPedido: null };
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

            const data = await response.json();
            return { estado: data.estado, idPedido: data.id };
        } catch (error) {
            console.error("Error al obtener estado del pedido:", error);
            return { estado: 'NULO', idPedido: null };
        }
    }

    async function renderizarBotonConfirmar(listaPedidos) {
        if (!btnConfirmar) return;

        const estadoData = await obtenerEstadoPedidoPrincipal();
        btnConfirmar.disabled = listaPedidos.length === 0;

        if (estadoData.estado === 'CONFIRMADO') {
            btnConfirmar.textContent = "Modificar Pedido";
            btnConfirmar.classList.remove('btn-confirmar');
            btnConfirmar.classList.add('btn-modificar');
            btnConfirmar.title = "Tu pedido está confirmado. Haz cambios y vuelve a presionar para actualizar.";
        } else {
            btnConfirmar.textContent = listaPedidos.length > 0 ? "Confirmar Pedido" : "Sin Pedidos";
            btnConfirmar.classList.remove('btn-modificar');
            btnConfirmar.classList.add('btn-confirmar');
            btnConfirmar.title = "Presiona para enviar tu pedido a la cocina.";
            btnConfirmar.disabled = listaPedidos.length === 0;
        }
    }

    // ------------------------------------------------------------------
    // FUNCIONES DE CARGA Y ELIMINACIÓN
    // ------------------------------------------------------------------
    async function obtenerYMostrarLista() {
        try {
            const response = await authenticatedFetch('/pedidos', { method: 'GET' }, ROL_USUARIO);

            if (response.status === 204) {
                mostrarLista([]);
                await renderizarBotonConfirmar([]);
                return;
            }

            if (response.status === 401 || response.status === 403) {
                contenedor.innerHTML = `<p class="alerta-error">ERROR DE AUTENTICACIÓN. Por favor, inicie sesión.</p>`;
                await renderizarBotonConfirmar([]);
                return;
            }

            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

            const pedidos = await response.json();
            mostrarLista(pedidos);
            await renderizarBotonConfirmar(pedidos);

        } catch (error) {
            console.error("Error al cargar la lista de pedidos:", error);
            contenedor.innerHTML = `<p class="alerta-error">Error al conectar con el servidor.</p>`;
        }
    }

    function mostrarLista(lista) {
        contenedor.innerHTML = "";

        if (!lista || lista.length === 0) {
            contenedor.innerHTML = `<p class="mensaje-general">No hay pedidos para mostrar.</p>`;
            return;
        }

        lista.forEach(plato => {
            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <img src="${plato.urlImagenPlato}" alt="${plato.nombrePlato}">
                <div class="card-content">
                    <h2>${plato.nombrePlato}</h2>
                    <p>${plato.categoriaPlato}</p>
                    <div class="info">
                        <span>Fecha de entrega: ${plato.fechaEntrega}</span>
                        <button class="btnRemover" data-id-pedido="${plato.idPedidoDia}">Eliminar</button>
                    </div>
                </div>
            `;
            contenedor.appendChild(card);
        });

        document.querySelectorAll(".btnRemover").forEach(btn => {
            btn.addEventListener("click", e => {
                const idPedidoDia = parseInt(e.target.getAttribute("data-id-pedido"));
                const card = e.target.closest(".card");
                eliminarPedidoAPI(idPedidoDia, card);
            });
        });
    }

    async function eliminarPedidoAPI(idPedidoDia, cardElement) {
        const url = `/pedidos/${idPedidoDia}`;

        try {
            const response = await authenticatedFetch(url, { method: 'DELETE' }, ROL_USUARIO);

            if (response.status === 204) {
                alert(`Pedido ${idPedidoDia} eliminado. Stock devuelto.`);
                cardElement.style.transition = "opacity 0.5s";
                cardElement.style.opacity = 0;
                setTimeout(() => { obtenerYMostrarLista(); }, 500);
            } else if (response.status === 403) {
                alert("⚠️ No tienes permiso para eliminar este pedido. Inicia sesión nuevamente.");
            } else if (response.status === 404) {
                alert("⚠️ Pedido no encontrado o ya eliminado.");
            } else {
                alert(`Ocurrió un error al eliminar el pedido. Código: ${response.status}`);
            }

        } catch (error) {
            console.error("Error de conexión al eliminar pedido:", error);
            alert("Ocurrió un error al conectar con el servidor.");
        }
    }

    async function confirmarPedidoAPI() {
        if (!btnConfirmar) return;
        const accion = btnConfirmar.textContent;
        if (accion === "Sin Pedidos") { alert("No puedes confirmar un pedido vacío."); return false; }

        try {
            const response = await authenticatedFetch('/pedidos/confirmar', { method: 'PUT' }, ROL_USUARIO);

            if (response.status === 200) {
                const mensaje = accion === "Confirmar Pedido"
                    ? "✅ ¡Tu pedido ha sido confirmado y enviado a la cocina!"
                    : "✅ Pedido modificado y actualizado para la cocina.";
                alert(mensaje);
                await obtenerYMostrarLista();
                return true;
            } else {
                throw new Error(`Fallo la operación con código: ${response.status}`);
            }
        } catch (error) {
            console.error("Error de red:", error);
        }
    }

    // ------------------------------------------------------------------
    // INICIO
    // ------------------------------------------------------------------
    obtenerYMostrarLista();

    if (btnConfirmar) {
        btnConfirmar.addEventListener("click", confirmarPedidoAPI);
    }

});
