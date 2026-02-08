import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7a4qrXKMkMGfl9ZdGZiHwgMUkOeLXVI4",
  authDomain: "inventario-venta.firebaseapp.com",
  projectId: "inventario-venta",
  storageBucket: "inventario-venta.firebasestorage.app",
  messagingSenderId: "64962111316",
  appId: "1:64962111316:web:44601a493acf3577a84ac1",
  measurementId: "G-K089SSRL49"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productosRef = collection(db, "productos");

let todosLosProductos = [];
let categoriaActual = "TODOS";

onSnapshot(productosRef, (snapshot) => {
    todosLosProductos = [];
    snapshot.forEach(doc => todosLosProductos.push({ ...doc.data(), id: doc.id }));
    todosLosProductos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    actualizarMenuCategorias();
    filtrarYMostrar();
});

function actualizarMenuCategorias() {
    const menu = document.getElementById("menu-categorias");
    const categoriasUnicas = ["TODOS", ...new Set(todosLosProductos.map(p => p.categoria))];
    
    menu.innerHTML = categoriasUnicas.map(cat => `
        <button class="list-group-item list-group-item-action ${categoriaActual === cat ? 'active' : ''}" 
                onclick="filtrarPorCat('${cat}', this)">
            ${cat === 'TODOS' ? '🌐 Todos' : cat}
        </button>
    `).join('');
}

window.filtrarPorCat = (cat, element) => {
    categoriaActual = cat;
    document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    filtrarYMostrar();
};

function filtrarYMostrar() {
    const grid = document.getElementById("grid-productos");
    const buscador = document.getElementById("buscador").value.toUpperCase();
    
    let filtrados = todosLosProductos.filter(p => {
        const coincideCat = (categoriaActual === "TODOS" || p.categoria === categoriaActual);
        const coincideBusqueda = p.nombre.includes(buscador);
        return coincideCat && coincideBusqueda;
    });

    grid.innerHTML = filtrados.map(p => {
        const precio = new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO', maximumFractionDigits: 0 }).format(p.precio);
        return `
            <div class="col-sm-6 col-lg-4 col-xl-3">
                <div class="item-producto h-100 d-flex flex-column justify-content-between">
                    <div>
                        <div class="small text-white-50 mb-1">${p.categoria}</div>
                        <h6 class="fw-bold text-white mb-3 text-uppercase">${p.nombre}</h6>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="precio-badge">${precio}</span>
                        <div class="btn-group">
                            <button class="btn btn-sm text-warning" onclick="prepararEdicion('${p.id}','${p.nombre}',${p.precio},'${p.categoria}')">✏️</button>
                            <button class="btn btn-sm text-danger" onclick="borrarProducto('${p.id}')">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

// BUSCADOR EN TIEMPO REAL
document.getElementById("buscador").addEventListener("input", filtrarYMostrar);

// CRUD (Igual que los anteriores)
window.guardarProducto = async () => {
    const n = document.getElementById("nuevo-nombre"), p = document.getElementById("nuevo-precio"), c = document.getElementById("nueva-categoria");
    if(!n.value || !p.value) return;
    await addDoc(productosRef, { nombre: n.value.toUpperCase().trim(), precio: Number(p.value), categoria: c.value });
    n.value = ""; p.value = "";
    bootstrap.Collapse.getInstance(document.getElementById('panelAgregar')).hide();
};

window.borrarProducto = async (id) => { if(confirm("¿Borrar?")) await deleteDoc(doc(db, "productos", id)); };

window.prepararEdicion = (id, n, p, c) => {
    document.getElementById("id-editar").value = id;
    document.getElementById("nombre-editar").value = n;
    document.getElementById("precio-editar").value = p;
    document.getElementById("categoria-editar").value = c;
    new bootstrap.Modal(document.getElementById('modalEditar')).show();
};

window.guardarCambios = async () => {
    const id = document.getElementById("id-editar").value;
    await updateDoc(doc(db, "productos", id), {
        nombre: document.getElementById("nombre-editar").value.toUpperCase().trim(),
        precio: Number(document.getElementById("precio-editar").value),
        categoria: document.getElementById("categoria-editar").value
    });
    bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
};