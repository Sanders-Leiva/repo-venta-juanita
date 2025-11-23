// 1. Importamos las funciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. TU CONFIGURACIÓN (¡NO BORRES TUS LLAVES!)
const firebaseConfig = {
  apiKey: "AIzaSyD7a4qrXKMkMGfl9ZdGZiHwgMUkOeLXVI4",
  authDomain: "inventario-venta.firebaseapp.com",
  projectId: "inventario-venta",
  storageBucket: "inventario-venta.firebasestorage.app",
  messagingSenderId: "64962111316",
  appId: "1:64962111316:web:44601a493acf3577a84ac1",
  measurementId: "G-K089SSRL49"
};

// 3. Inicializar
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productosRef = collection(db, "productos");

const listaHTML = document.getElementById("lista-productos");
let todosLosProductos = [];

// --- LEER PRODUCTOS (Tiempo Real) ---
onSnapshot(productosRef, (snapshot) => {
    todosLosProductos = [];

    if (snapshot.empty) {
        listaHTML.innerHTML = `<div class="text-center p-4 text-muted"><h4>📭 Inventario vacío</h4><p>Agrega productos arriba.</p></div>`;
        return;
    }

    // Convertimos los datos
    snapshot.forEach((doc) => {
        const producto = doc.data();
        producto.id = doc.id; 
        todosLosProductos.push(producto);
    });

    // Ordenar alfabéticamente
    todosLosProductos.sort((a, b) => a.nombre.localeCompare(b.nombre));

    renderizarProductos(todosLosProductos);
});

// --- PINTAR EN PANTALLA ---
function renderizarProductos(lista) {
    listaHTML.innerHTML = ""; 

    // DICCIONARIO DE COLORES (Conecta los selects con el CSS)
    const categoryColors = {
        "VENTA": "cat-venta",
        "COCA COLA": "cat-coca",
        "BIG COLA": "cat-big",
        "LECHE": "cat-leche",
        "MEDICAMENTOS": "cat-med",
        "VITRINA IZQ": "cat-vitrina"
    };
    
    lista.forEach(prod => {
        const item = document.createElement("div");
        // Layout flexible
        item.className = "list-group-item d-flex justify-content-between align-items-center flex-wrap";
        
        // Formato Moneda C$ (Nicaragua)
        const precioFormateado = new Intl.NumberFormat('es-NI', { 
            style: 'currency', currency: 'NIO', maximumFractionDigits: 0 
        }).format(prod.precio);

        // Color de categoría
        const categoriaClass = categoryColors[prod.categoria] || 'bg-secondary';

        item.innerHTML = `
            <div class="me-auto py-2">
                <div class="d-flex align-items-center gap-2 mb-1">
                    <h5 class="mb-0 fw-bold text-white text-uppercase" style="letter-spacing: 0.5px;">${prod.nombre}</h5>
                </div>
                <span class="badge cat-badge ${categoriaClass}">${prod.categoria}</span>
            </div>
            
            <div class="d-flex align-items-center mt-3 mt-md-0">
                
                <span class="precio-texto me-4">${precioFormateado}</span>

                <div class="d-flex gap-2"> 
                    <button class="btn btn-outline-warning btn-action" title="Editar"
                        onclick="prepararEdicion('${prod.id}', '${prod.nombre}', '${prod.precio}', '${prod.categoria}')">
                        ✏️
                    </button>
                    <button class="btn btn-outline-danger btn-action" title="Borrar"
                        onclick="borrarProducto('${prod.id}')">
                        🗑️
                    </button>
                </div>

            </div>
        `;
        listaHTML.appendChild(item);
    });
}

// --- 1. GUARDAR NUEVO ---
window.guardarProducto = async () => {
    const nombreInput = document.getElementById("nuevo-nombre");
    const precioInput = document.getElementById("nuevo-precio");
    const categoriaInput = document.getElementById("nueva-categoria");
    
    if(nombreInput.value.trim() === "" || precioInput.value === "") {
        alert("⚠️ Por favor escribe un nombre y un precio");
        return;
    }

    try {
        await addDoc(productosRef, {
            nombre: nombreInput.value.toUpperCase().trim(),
            precio: Number(precioInput.value),
            categoria: categoriaInput.value,
            fecha: new Date()
        });

        // Limpiar campos
        nombreInput.value = "";
        precioInput.value = "";
        // No reseteamos la categoría por si quieres agregar varios de la misma seguido

    } catch (e) {
        console.error(e);
        alert("❌ Error al guardar");
    }
}

// --- 2. BORRAR ---
window.borrarProducto = async (id) => {
    if(confirm("¿Estás seguro de borrar este producto?")) {
        try {
            await deleteDoc(doc(db, "productos", id));
        } catch (e) {
            alert("❌ Error al borrar");
        }
    }
}

// --- 3. EDITAR ---
window.prepararEdicion = (id, nombre, precio, categoria) => {
    document.getElementById("id-editar").value = id;
    document.getElementById("nombre-editar").value = nombre;
    document.getElementById("precio-editar").value = precio;
    document.getElementById("categoria-editar").value = categoria;
    
    const modalEl = document.getElementById('modalEditar');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

window.guardarCambios = async () => {
    const id = document.getElementById("id-editar").value;
    const nombre = document.getElementById("nombre-editar").value;
    const precio = document.getElementById("precio-editar").value;
    const categoria = document.getElementById("categoria-editar").value;

    try {
        const ref = doc(db, "productos", id);
        
        await updateDoc(ref, {
            nombre: nombre.toUpperCase().trim(),
            precio: Number(precio),
            categoria: categoria
        });

        // Cerrar modal correctamente
        const modalEl = document.getElementById('modalEditar');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();

    } catch (e) {
        console.error(e);
        alert("❌ Error al editar");
    }
}

// --- BUSCADOR ---
const inputBuscador = document.getElementById("buscador");
inputBuscador.addEventListener("input", (e) => {
    const texto = e.target.value.toUpperCase();
    
    const filtrados = todosLosProductos.filter(prod => 
        prod.nombre.includes(texto) || prod.categoria.includes(texto)
    );
    
    renderizarProductos(filtrados);
});