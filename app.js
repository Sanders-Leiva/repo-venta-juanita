// 1. Importamos las funciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. TU CONFIGURACIÓN
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
        listaHTML.innerHTML = `<div class="list-group-item text-center p-4 text-muted">Todavía no hay productos. ¡Agrega el primero abajo! 👇</div>`;
        return;
    }

    // Convertimos los datos de Firebase a una lista normal
    snapshot.forEach((doc) => {
        const producto = doc.data();
        producto.id = doc.id; 
        todosLosProductos.push(producto);
    });

    // Ordenamos alfabéticamente por nombre
    todosLosProductos.sort((a, b) => a.nombre.localeCompare(b.nombre));

    renderizarProductos(todosLosProductos);
});

// --- PINTAR EN PANTALLA ---
function renderizarProductos(lista) {
    listaHTML.innerHTML = ""; // Limpiar pantalla
    
    lista.forEach(prod => {
        const item = document.createElement("div");
        item.className = "list-group-item d-flex justify-content-between align-items-center";
        
        // Formato bonito de moneda ($ 2.500)
        const precioFormateado = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(prod.precio);

        // HTML de cada fila (Nombre + Precio + Botones)
        item.innerHTML = `
            <div style="flex: 1; padding-right: 10px;">
                <h5 class="mb-0 fw-bold text-uppercase" style="font-size: 1rem;">${prod.nombre}</h5>
                <span class="badge bg-success rounded-pill mt-1" style="font-size: 0.9rem;">${precioFormateado}</span>
            </div>
            
            <div class="d-flex gap-2">
                <button class="btn btn-outline-warning btn-sm" 
                    onclick="prepararEdicion('${prod.id}', '${prod.nombre}', '${prod.precio}')">
                    ✏️
                </button>
                <button class="btn btn-outline-danger btn-sm" 
                    onclick="borrarProducto('${prod.id}')">
                    🗑️
                </button>
            </div>
        `;
        listaHTML.appendChild(item);
    });
}

// --- 1. CREAR (GUARDAR NUEVO) ---
window.guardarProducto = async () => {
    const nombreInput = document.getElementById("nuevo-nombre");
    const precioInput = document.getElementById("nuevo-precio");
    
    if(nombreInput.value.trim() === "" || precioInput.value === "") {
        alert("Por favor escribe un nombre y un precio");
        return;
    }

    try {
        await addDoc(productosRef, {
            nombre: nombreInput.value.toUpperCase().trim(), // Convertir a mayúsculas
            precio: Number(precioInput.value),
            fecha: new Date()
        });

        // Limpiar campos
        nombreInput.value = "";
        precioInput.value = "";
        
        // Colapsar el menú de agregar (Opcional, visualmente mejor)
        const panel = document.getElementById('adminPanel');
        if(panel.classList.contains('show')) {
            new bootstrap.Collapse(panel, { toggle: true });
        }

    } catch (e) {
        console.error(e);
        alert("Hubo un error al guardar");
    }
}

// --- 2. BORRAR ---
window.borrarProducto = async (id) => {
    // Confirmación simple del navegador
    if(confirm("¿Borrar este producto?")) {
        try {
            await deleteDoc(doc(db, "productos", id));
        } catch (e) {
            alert("Error al borrar");
        }
    }
}

// --- 3. EDITAR (Lógica del Modal) ---

// Paso A: Poner los datos en el modal y abrirlo
window.prepararEdicion = (id, nombre, precio) => {
    document.getElementById("id-editar").value = id;
    document.getElementById("nombre-editar").value = nombre;
    document.getElementById("precio-editar").value = precio;
    
    // Abrir el modal usando Bootstrap
    const modalEl = document.getElementById('modalEditar');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Paso B: Guardar lo que cambiaste en el modal
window.guardarCambios = async () => {
    const id = document.getElementById("id-editar").value;
    const nombre = document.getElementById("nombre-editar").value;
    const precio = document.getElementById("precio-editar").value;

    try {
        const ref = doc(db, "productos", id);
        
        await updateDoc(ref, {
            nombre: nombre.toUpperCase().trim(),
            precio: Number(precio)
        });

        // Cerrar modal
        // (Buscamos la instancia existente para cerrarla bien)
        const modalEl = document.getElementById('modalEditar');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();

    } catch (e) {
        console.error(e);
        alert("Error al editar");
    }
}

// --- BUSCADOR ---
const inputBuscador = document.getElementById("buscador");
inputBuscador.addEventListener("input", (e) => {
    const texto = e.target.value.toUpperCase(); // Buscar en mayúsculas también
    
    const filtrados = todosLosProductos.filter(prod => 
        prod.nombre.includes(texto)
    );
    
    renderizarProductos(filtrados);
});