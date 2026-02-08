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
    actualizarDropdown();
    filtrarYMostrar();
});

function actualizarDropdown() {
    const select = document.getElementById("filtro-categoria-select");
    const cats = [...new Set(todosLosProductos.map(p => p.categoria))].sort();
    let html = `<option value="TODOS" ${categoriaActual === 'TODOS' ? 'selected' : ''}>🌐 Todas</option>`;
    cats.forEach(c => html += `<option value="${c}" ${categoriaActual === c ? 'selected' : ''}>${c}</option>`);
    select.innerHTML = html;
}

window.cambiarCategoria = (val) => {
    categoriaActual = val;
    filtrarYMostrar();
};

function filtrarYMostrar() {
    const grid = document.getElementById("grid-productos");
    const buscador = document.getElementById("buscador").value.toUpperCase();
    const contador = document.getElementById("contador-productos");
    
    let filtrados = todosLosProductos.filter(p => {
        return (categoriaActual === "TODOS" || p.categoria === categoriaActual) && p.nombre.includes(buscador);
    });

    contador.innerText = `ITEMS: ${filtrados.length}`;

    grid.innerHTML = filtrados.map(p => {
        const price = new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO', maximumFractionDigits: 0 }).format(p.precio);
        return `
            <div class="col-6 col-md-4 col-xl-3">
                <div class="item-card d-flex flex-column justify-content-between">
                    <div>
                        <small class="text-white-50" style="font-size: 0.6rem;">${p.categoria}</small>
                        <h6 class="fw-bold text-white mb-2 text-uppercase mt-1" style="font-size: 0.85rem;">${p.nombre}</h6>
                    </div>
                    <div>
                        <div class="price-tag text-center mb-2">${price}</div>
                        <div class="d-flex justify-content-around border-top border-secondary pt-2">
                            <button class="btn btn-sm p-0 text-warning" onclick="prepararEdicion('${p.id}','${p.nombre}',${p.precio},'${p.categoria}')">✏️</button>
                            <button class="btn btn-sm p-0 text-danger" onclick="borrarProducto('${p.id}')">🗑️</button>
                        </div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

document.getElementById("buscador").addEventListener("input", filtrarYMostrar);

// CRUD
window.guardarProducto = async () => {
    const n = document.getElementById("nuevo-nombre"), p = document.getElementById("nuevo-precio"), c = document.getElementById("nueva-categoria");
    if(!n.value || !p.value) return;
    await addDoc(productosRef, { nombre: n.value.toUpperCase().trim(), precio: Number(p.value), categoria: c.value });
    n.value = ""; p.value = "";
    bootstrap.Collapse.getInstance(document.getElementById('panelAgregar')).hide();
};

window.borrarProducto = async (id) => { if(confirm("¿Eliminar?")) await deleteDoc(doc(db, "productos", id)); };

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