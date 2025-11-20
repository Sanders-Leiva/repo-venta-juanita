// 1. Importamos Firebase y Firestore (Base de datos)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. TU CONFIGURACIÓN (La que me pasaste)
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
const productosRef = collection(db, "productos"); // Referencia a la colección

const listaHTML = document.getElementById("lista-productos");
let todosLosProductos = []; // Guardaremos aquí los productos para poder filtrarlos en el buscador

// --- LEER PRODUCTOS (Tiempo Real) ---
onSnapshot(productosRef, (snapshot) => {
    listaHTML.innerHTML = ""; // Limpiar visualmente
    todosLosProductos = [];   // Limpiar memoria

    if (snapshot.empty) {
        listaHTML.innerHTML = `<div class="text-center p-3">No hay productos aún. ¡Agrega uno!</div>`;
        return;
    }

    snapshot.forEach((doc) => {
        const producto = doc.data();
        producto.id = doc.id; // Guardamos el ID para poder editar/borrar luego
        todosLosProductos.push(producto);
    });

    renderizarProductos(todosLosProductos);
});

// --- FUNCIÓN PARA PINTAR EN PANTALLA ---
function renderizarProductos(lista) {
    listaHTML.innerHTML = "";
    lista.forEach(prod => {
        const item = document.createElement("div");
        item.className = "list-group-item d-flex justify-content-between align-items-center";
        
        // Formatear precio con separador de miles (ej: 2.500)
        const precioFormateado = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(prod.precio);

        item.innerHTML = `
            <div>
                <h5 class="mb-0 fw-bold">${prod.nombre}</h5>
                <small class="text-muted">Precio normal</small>
            </div>
            <span class="badge bg-primary rounded-pill fs-5">${precioFormateado}</span>
        `;
        listaHTML.appendChild(item);
    });
}

// --- GUARDAR PRODUCTO ---
// Usamos window.guardarProducto para que el HTML pueda "ver" esta función
window.guardarProducto = async () => {
    const nombreInput = document.getElementById("nuevo-nombre");
    const precioInput = document.getElementById("nuevo-precio");
    const btnGuardar = document.querySelector("button[onclick='guardarProducto()']");

    if(nombreInput.value.trim() === "" || precioInput.value === "") {
        alert("Falta nombre o precio");
        return;
    }

    try {
        btnGuardar.innerText = "Guardando...";
        btnGuardar.disabled = true;

        await addDoc(productosRef, {
            nombre: nombreInput.value.toUpperCase(), // Guardar en mayúsculas se ve mejor
            precio: Number(precioInput.value),
            fecha: new Date()
        });

        // Limpiar
        nombreInput.value = "";
        precioInput.value = "";
        alert("✅ Producto agregado");
        
    } catch (error) {
        console.error(error);
        alert("Error al guardar");
    } finally {
        btnGuardar.innerText = "Guardar";
        btnGuardar.disabled = false;
    }
}

// --- BUSCADOR ---
const inputBuscador = document.getElementById("buscador");
inputBuscador.addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase();
    
    // Filtramos la lista que tenemos en memoria
    const filtrados = todosLosProductos.filter(prod => 
        prod.nombre.toLowerCase().includes(texto)
    );
    
    renderizarProductos(filtrados);
});