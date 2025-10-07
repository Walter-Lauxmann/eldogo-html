// controllers.js
import { VeterinariaAPI } from '../models/models.js';

// --- Elementos del DOM ---
const appContainer = document.getElementById('app-container');
const views = {
    login: document.getElementById('view-login'),
    register: document.getElementById('view-register'),
    dashboard: document.getElementById('view-client-dashboard'), // Dashboard del cliente
    adminDashboard: document.getElementById('view-admin-dashboard'), // Dashboard principal del admin
    adminClients: document.getElementById('view-admin-clients'), // CRUD de clientes
    adminPets: document.getElementById('view-admin-pets') // CRUD de mascotas (Admin)
};

const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const formAddPet = document.getElementById('form-add-pet');
const navLogout = document.getElementById('nav-logout');

const welcomeClientMessage = document.getElementById('welcome-client-message');
const welcomeAdminMessage = document.getElementById('welcome-admin-message');

const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');

const linkToRegister = document.getElementById('link-to-register');
const linkToLogin = document.getElementById('link-to-login');

// Elementos de la vista Cliente
const petListContainer = document.getElementById('pets-list-container');
const petAddMessage = document.getElementById('pet-add-message');

// Elementos de la vista Administrador
const clientsListContainer = document.getElementById('clients-list-container');
const adminClientMessage = document.getElementById('admin-client-message'); // Mensajes de CRUD de clientes
const allPetsListContainer = document.getElementById('all-pets-list-container'); // NUEVO
const adminPetMessage = document.getElementById('admin-pet-message'); // NUEVO

// Botones de navegación de Admin
const navToClientsBtn = document.getElementById('nav-to-clients');
const navToAdminPetsBtn = document.getElementById('nav-to-admin-pets');
const backToAdminClientsBtn = document.getElementById('back-to-admin-dashboard-from-clients');
const backToAdminPetsBtn = document.getElementById('back-to-admin-dashboard-from-pets');


// Variable para guardar listas en memoria
let currentPets = [];
let currentClients = [];

// --- Funciones de Utilidad y UI (Modales) ---

/** Crea y adjunta el modal de edición de Mascota al cuerpo del documento */
function createModalOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'edit-modal-overlay';
    overlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 z-50 hidden flex items-center justify-center';
    overlay.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md m-4">
            <h3 class="text-2xl font-bold text-indigo-700 mb-4">Editar Mascota</h3>
            <form id="form-edit-pet" class="space-y-4">
                <input type="hidden" id="edit-pet-id" name="id">
                <p id="owner-info" class="text-sm text-gray-500"></p>
                <input type="text" name="nombre" placeholder="Nombre de la Mascota" required 
                       class="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                <input type="text" name="especie" placeholder="Especie" required 
                       class="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                <input type="text" name="raza" placeholder="Raza" required 
                       class="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                <input type="text" name="foto" placeholder="URL o Nombre de Archivo de Foto"
                       class="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                <textarea name="historia_clinica" placeholder="Historia Clínica" rows="3"
                    class="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                
                <div id="edit-message" class="text-center mt-3 text-sm font-medium"></div>

                <div class="flex justify-end space-x-3 mt-4">
                    <button type="button" id="close-modal" class="bg-gray-300 text-gray-800 font-semibold p-2 rounded-lg hover:bg-gray-400 transition duration-300">
                        Cancelar
                    </button>
                    <button type="submit" class="bg-green-600 text-white font-bold p-2 rounded-lg hover:bg-green-700 transition duration-300">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Listener para cerrar el modal
    overlay.querySelector('#close-modal').addEventListener('click', () => {
        overlay.classList.add('hidden');
    });
    
    return overlay;
}

/** Crea y adjunta el modal de edición de Cliente al cuerpo del documento */
function createClientModalOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'edit-client-modal-overlay';
    overlay.className = 'fixed inset-0 bg-red-900 bg-opacity-75 z-50 hidden flex items-center justify-center'; 
    overlay.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg m-4">
            <h3 class="text-2xl font-bold text-red-700 mb-4">Editar Cliente (Admin)</h3>
            <form id="form-edit-client" class="max-w-lg mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="hidden" id="edit-client-id" name="id">
                <input type="text" name="nombre" placeholder="Nombre" required 
                       class="p-3 border rounded-lg focus:ring-red-500 focus:border-red-500">
                <input type="text" name="apellido" placeholder="Apellido" required 
                       class="p-3 border rounded-lg focus:ring-red-500 focus:border-red-500">
                <input type="text" name="documento" placeholder="DNI/Documento" required 
                       class="p-3 border rounded-lg focus:ring-red-500 focus:border-red-500">
                <input type="text" name="telefono" placeholder="Teléfono" required 
                       class="p-3 border rounded-lg focus:ring-red-500 focus:border-red-500">
                <input type="email" name="email" placeholder="Correo Electrónico" required 
                       class="p-3 border rounded-lg focus:ring-red-500 focus:border-red-500 md:col-span-2">
                <input type="text" name="rol" placeholder="Rol (client/admin)" required 
                       class="p-3 border rounded-lg focus:ring-red-500 focus:border-red-500">
                <input type="password" name="password" placeholder="Nueva Contraseña (dejar vacío para no cambiar)" 
                       class="p-3 border rounded-lg focus:ring-red-500 focus:border-red-500">

                <div id="client-edit-message" class="text-center mt-3 text-sm font-medium md:col-span-2"></div>

                <div class="flex justify-end space-x-3 mt-4 md:col-span-2">
                    <button type="button" id="close-client-modal" class="bg-gray-300 text-gray-800 font-semibold p-2 rounded-lg hover:bg-gray-400 transition duration-300">
                        Cancelar
                    </button>
                    <button type="submit" class="bg-red-600 text-white font-bold p-2 rounded-lg hover:bg-red-700 transition duration-300">
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Listener para cerrar el modal
    overlay.querySelector('#close-client-modal').addEventListener('click', () => {
        overlay.classList.add('hidden');
    });
    
    return overlay;
}

// Inicialización de Modales (Mascotas)
const modalOverlay = createModalOverlay();
const formEditPet = modalOverlay.querySelector('#form-edit-pet');
const editPetId = modalOverlay.querySelector('#edit-pet-id');
const editMessage = modalOverlay.querySelector('#edit-message');
const ownerInfo = modalOverlay.querySelector('#owner-info'); // Info del dueño

// Inicialización de Modales (Clientes Admin)
const clientModalOverlay = createClientModalOverlay();
const formEditClient = clientModalOverlay.querySelector('#form-edit-client');
const editClientId = clientModalOverlay.querySelector('#edit-client-id');
const clientEditMessage = clientModalOverlay.querySelector('#client-edit-message');


/**
 * Muestra solo la vista especificada y oculta las demás.
 * @param {string} viewName Nombre de la vista ('login', 'register', 'dashboard', 'adminDashboard', 'adminClients', 'adminPets').
 */
function showView(viewName) {
    Object.keys(views).forEach(key => {
        if (key === viewName) {
            views[key].classList.remove('hidden');
        } else {
            views[key].classList.add('hidden');
        }
    });

    // Controlar visibilidad del botón de Logout
    if (viewName === 'dashboard' || viewName.startsWith('admin')) {
        navLogout.classList.remove('hidden');
    } else {
        navLogout.classList.add('hidden');
    }
}

/**
 * Muestra un mensaje temporal en un elemento, desapareciendo después de 3 segundos.
 * @param {HTMLElement} element El elemento DOM donde mostrar el mensaje.
 * @param {string} message El texto del mensaje.
 * @param {string} type 'success' (verde) o 'error' (rojo).
 */
function displayMessage(element, message, type) {
    element.textContent = message;
    element.className = 'text-center mt-3 font-medium ' + (type === 'success' ? 'text-green-600' : 'text-red-500');
    setTimeout(() => {
        element.textContent = '';
        element.className = 'text-center mt-3 font-medium';
    }, 3000);
}

// --- Lógica de CRUD de Mascotas (Reutilizable) ---

/**
 * Abre el modal de edición de Mascota y precarga los datos.
 */
function openEditModal(petId) {
    const pet = currentPets.find(p => p.id == petId);
    if (!pet) {
        displayMessage(petAddMessage, 'Mascota no encontrada.', 'error');
        return;
    }

    // Precargar datos en el formulario del modal
    editPetId.value = pet.id;
    formEditPet.querySelector('input[name="nombre"]').value = pet.nombre;
    formEditPet.querySelector('input[name="especie"]').value = pet.especie;
    formEditPet.querySelector('input[name="raza"]').value = pet.raza;
    formEditPet.querySelector('input[name="foto"]').value = pet.foto;
    formEditPet.querySelector('textarea[name="historia_clinica"]').value = pet.historia_clinica;
    
    // Si estamos en la vista de administrador, mostramos la info del dueño
    const user = VeterinariaAPI.getSession();
    if (user && user.role === 'admin' && pet.cliente_nombre) {
        ownerInfo.textContent = `Dueño: ${pet.cliente_nombre} (ID: ${pet.clientes_id})`;
    } else {
        ownerInfo.textContent = '';
    }

    // Limpiar mensaje previo
    editMessage.textContent = '';

    // Mostrar modal
    modalOverlay.classList.remove('hidden');
}


/**
 * Renderiza la lista de mascotas para el cliente.
 */
function renderPets(pets) {
    currentPets = pets; // Guardamos la lista actual
    petListContainer.innerHTML = '';
    
    if (!pets || pets.length === 0) {
        petListContainer.innerHTML = '<p class="text-gray-500 text-center py-8">No tienes mascotas registradas. ¡Agrega una!</p>';
        return;
    }

    pets.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'bg-white border border-indigo-200 p-4 rounded-xl shadow-md flex justify-between items-center space-x-4';
        
        // Icono o Imagen (usamos un icono simple si no hay foto)
        const petImage = pet.foto && pet.foto !== 'default_pet.png' 
            ? `<img src="${pet.foto}" onerror="this.onerror=null; this.src='https://placehold.co/48x48/6366f1/ffffff?text=🐶';" alt="${pet.nombre}" class="w-12 h-12 object-cover rounded-full">`
            : `<div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl">🐶</div>`;

        petCard.innerHTML = `
            <div class="flex items-center space-x-4">
                ${petImage}
                <div>
                    <h4 class="text-lg font-bold text-gray-800">${pet.nombre} (${pet.especie})</h4>
                    <p class="text-sm text-gray-600">Raza: ${pet.raza}</p>
                    <p class="text-xs text-gray-500 mt-1">ID: ${pet.id}</p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button data-id="${pet.id}" class="edit-btn bg-yellow-500 text-white text-sm px-3 py-1 rounded-full hover:bg-yellow-600 transition duration-300">
                    Editar
                </button>
                <button data-id="${pet.id}" data-name="${pet.nombre}" class="delete-btn bg-red-500 text-white text-sm px-3 py-1 rounded-full hover:bg-red-600 transition duration-300">
                    Eliminar
                </button>
            </div>
        `;
        petListContainer.appendChild(petCard);
    });
    
    attachPetActionListeners();
}

/**
 * Renderiza la lista de todas las mascotas para el administrador. (NUEVO)
 */
function renderAdminPets(pets) {
    currentPets = pets; // Guardamos la lista actual
    allPetsListContainer.innerHTML = '';
    
    if (!pets || pets.length === 0) {
        allPetsListContainer.innerHTML = '<p class="text-gray-500 text-center py-8">No hay mascotas registradas en la clínica.</p>';
        return;
    }

    pets.forEach(pet => {
        const petCard = document.createElement('div');
        // El color cambia ligeramente para indicar que es una vista de gestión general (Admin)
        petCard.className = 'bg-white border border-gray-300 p-4 rounded-xl shadow-md flex justify-between items-center space-x-4';
        
        const petImage = pet.foto && pet.foto !== 'default_pet.png' 
            ? `<img src="${pet.foto}" onerror="this.onerror=null; this.src='https://placehold.co/48x48/374151/ffffff?text=🐶';" alt="${pet.nombre}" class="w-12 h-12 object-cover rounded-full">`
            : `<div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-2xl">🐶</div>`;

        petCard.innerHTML = `
            <div class="flex items-center space-x-4 flex-grow">
                ${petImage}
                <div>
                    <h4 class="text-lg font-bold text-gray-800">${pet.nombre} (${pet.especie})</h4>
                    <p class="text-sm text-gray-600">Raza: ${pet.raza}</p>
                    <p class="text-xs text-gray-500 mt-1">Dueño: ${pet.cliente_nombre || 'N/A'} (ID: ${pet.clientes_id})</p>
                </div>
            </div>
            <div class="flex space-x-2 flex-shrink-0">
                <button data-id="${pet.id}" class="edit-btn bg-yellow-500 text-white text-sm px-3 py-1 rounded-full hover:bg-yellow-600 transition duration-300">
                    Editar
                </button>
                <button data-id="${pet.id}" data-name="${pet.nombre}" class="delete-btn bg-red-500 text-white text-sm px-3 py-1 rounded-full hover:bg-red-600 transition duration-300">
                    Eliminar
                </button>
            </div>
        `;
        allPetsListContainer.appendChild(petCard);
    });
    
    attachPetActionListeners(); // Attach listeners for admin buttons
}

/**
 * Agrega listeners de edición y eliminación a los botones de mascotas.
 */
function attachPetActionListeners() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        // Aseguramos que solo se añada una vez por botón
        if (!button.dataset.listenerAttached) {
            button.addEventListener('click', (e) => {
                openEditModal(e.currentTarget.dataset.id);
            });
            button.dataset.listenerAttached = true;
        }
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        if (!button.dataset.listenerAttached) {
            button.addEventListener('click', (e) => {
                handleDeletePet(e.currentTarget.dataset.id, e.currentTarget.dataset.name);
            });
            button.dataset.listenerAttached = true;
        }
    });
}


/**
 * Carga y muestra la lista de mascotas para el usuario actual (Solo Clientes).
 */
async function loadClientPets() {
    petListContainer.innerHTML = '<p class="text-center text-indigo-600 py-8">Cargando...</p>';
    const user = VeterinariaAPI.getSession();
    if (!user) {
        return;
    }

    const result = await VeterinariaAPI.listPets(user.id); // Llama a listPets con ID de cliente
    if (result.success) {
        renderPets(result.pets);
    } else {
        petListContainer.innerHTML = `<p class="text-red-500 text-center py-8">Error al cargar mascotas: ${result.message}</p>`;
    }
}

/**
 * Carga y muestra la lista de TODAS las mascotas (Solo Admin). (NUEVO)
 */
async function loadAllPets() {
    allPetsListContainer.innerHTML = '<p class="text-center text-indigo-600 py-8">Cargando todas las mascotas de la clínica...</p>';

    // Llama al endpoint que no requiere cliente_id y trae info de cliente_nombre (asumido en la API)
    const result = await VeterinariaAPI.listAllPets(); 
    
    if (result.success) {
        renderAdminPets(result.pets);
    } else {
        allPetsListContainer.innerHTML = `<p class="text-red-500 text-center py-8">Error al cargar mascotas: ${result.message}</p>`;
    }
}

// --- Lógica del Dashboard Admin ---

/**
 * Renderiza la lista de clientes en el contenedor (solo Admin).
 */
function renderClientList(clients) {
    // ... (El código de renderClientList sigue siendo el mismo)
    currentClients = clients; // Guardamos la lista actual
    clientsListContainer.innerHTML = '';
    
    if (!clients || clients.length === 0) {
        clientsListContainer.innerHTML = '<p class="text-gray-500 text-center py-8">No hay clientes registrados.</p>';
        return;
    }

    clients.forEach(client => {
        const clientCard = document.createElement('div');
        clientCard.className = 'bg-white border border-red-300 p-4 rounded-xl shadow-md flex justify-between items-center space-x-4';
        
        clientCard.innerHTML = `
            <div class="flex items-center space-x-4">
                <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 text-2xl">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div>
                    <h4 class="text-lg font-bold text-gray-800">${client.nombre} ${client.apellido}</h4>
                    <p class="text-sm text-gray-600">Email: ${client.email} | Rol: <span class="font-semibold text-red-600">${client.rol}</span></p>
                    <p class="text-xs text-gray-500 mt-1">ID: ${client.id} | DNI: ${client.documento}</p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button data-id="${client.id}" class="edit-client-btn bg-yellow-500 text-white text-sm px-3 py-1 rounded-full hover:bg-yellow-600 transition duration-300">
                    Editar
                </button>
                <button data-id="${client.id}" data-name="${client.nombre}" class="delete-client-btn bg-red-500 text-white text-sm px-3 py-1 rounded-full hover:bg-red-600 transition duration-300">
                    Eliminar
                </button>
            </div>
        `;
        clientsListContainer.appendChild(clientCard);
    });
    
    // Añadir listeners a los nuevos botones
    document.querySelectorAll('.edit-client-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            openClientEditModal(e.currentTarget.dataset.id);
        });
    });
    document.querySelectorAll('.delete-client-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            handleDeleteClient(e.currentTarget.dataset.id, e.currentTarget.dataset.name);
        });
    });
}

/**
 * Carga y muestra la lista de clientes (solo Admin).
 */
async function loadClients() {
    clientsListContainer.innerHTML = '<p class="text-center text-red-600 py-8">Cargando clientes...</p>';

    const result = await VeterinariaAPI.listClients();
    if (result.success) {
        renderClientList(result.clients);
    } else {
        clientsListContainer.innerHTML = `<p class="text-red-500 text-center py-8">Error al cargar clientes: ${result.message}</p>`;
    }
}

/**
 * Muestra el dashboard adecuado según el rol del usuario.
 */
function renderDashboard() {
    const user = VeterinariaAPI.getSession();
    if (!user) return; 

    if (user.role === 'admin') {
        welcomeAdminMessage.textContent = `Panel de Administración, ${user.nombre}`;
        showView('adminDashboard'); // Mostrar el menú del administrador
    } else {
        welcomeClientMessage.textContent = `Bienvenido(a) ${user.nombre}.`;
        showView('dashboard'); // Mostrar la gestión de mascotas del cliente
        loadClientPets(); // Carga las mascotas del cliente
    }
}


// --- Manejadores de Eventos de Autenticación y Mascota (CRUD) ---

/**
 * Maneja el envío del formulario de Login.
 */
async function handleLogin(event) {
    event.preventDefault();
    loginMessage.textContent = 'Iniciando sesión...';

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const result = await VeterinariaAPI.login({ email, password });
    
    if (result.success) {
        displayMessage(loginMessage, 'Inicio de sesión exitoso. Redirigiendo...', 'success');
        initializeApp(); // Redirige al dashboard
    } else {
        displayMessage(loginMessage, result.message, 'error');
    }
}

/**
 * Maneja el envío del formulario de Registro.
 */
async function handleRegister(event) {
    event.preventDefault();
    registerMessage.textContent = 'Registrando usuario...';

    const formData = new FormData(formRegister);
    const data = Object.fromEntries(formData.entries());

    const result = await VeterinariaAPI.register(data);

    if (result.success) {
        displayMessage(registerMessage, '✅ Registro exitoso. Ahora puedes iniciar sesión.', 'success');
        formRegister.reset();
        setTimeout(() => showView('login'), 2000);
    } else {
        displayMessage(registerMessage, result.message, 'error');
    }
}

/**
 * Maneja el envío del formulario de Agregar Mascota.
 */
async function handleAddPet(event) {
    event.preventDefault();
    petAddMessage.textContent = 'Registrando mascota...';
    
    const user = VeterinariaAPI.getSession();
    if (!user || user.role === 'admin') { 
        displayMessage(petAddMessage, 'Error: Permiso denegado.', 'error');
        return;
    }

    const formData = new FormData(formAddPet);
    const data = Object.fromEntries(formData.entries());
    
    // Agregar el ID del cliente al objeto de datos
    data.clientes_id = user.id;

    const result = await VeterinariaAPI.addPet(data);

    if (result.success) {
        displayMessage(petAddMessage, 'Mascota agregada correctamente.', 'success');
        formAddPet.reset();
        loadClientPets(); // Recargar la lista de mascotas del cliente
    } else {
        displayMessage(petAddMessage, result.message, 'error');
    }
}

/**
 * Maneja el envío del formulario de Edición de Mascota.
 */
async function handleEditPet(event) {
    event.preventDefault();
    editMessage.textContent = 'Guardando cambios...';

    const formData = new FormData(formEditPet);
    const data = Object.fromEntries(formData.entries());

    const result = await VeterinariaAPI.updatePet(data);

    if (result.success) {
        displayMessage(editMessage, 'Cambios guardados correctamente.', 'success');
        
        // Determinar qué lista recargar basado en la vista actual
        const user = VeterinariaAPI.getSession();
        if (user.role === 'admin') {
            loadAllPets(); // Si es admin, recargar la lista general
            displayMessage(adminPetMessage, 'Mascota actualizada (Admin).', 'success');
        } else {
            loadClientPets(); // Si es cliente, recargar su lista
            displayMessage(petAddMessage, 'Mascota actualizada (Cliente).', 'success');
        }

        setTimeout(() => modalOverlay.classList.add('hidden'), 1000);
    } else {
        displayMessage(editMessage, result.message, 'error');
    }
}

/**
 * Maneja la eliminación de una mascota.
 */
async function handleDeletePet(petId, petName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${petName} (ID: ${petId})? Esta acción es irreversible.`)) {
        return;
    }
    
    // Usar el mensaje correcto basado en el rol/vista
    const user = VeterinariaAPI.getSession();
    const msgElement = user.role === 'admin' ? adminPetMessage : petAddMessage;
    
    displayMessage(msgElement, `Eliminando a ${petName}...`, 'error');

    const result = await VeterinariaAPI.deletePet(petId);

    if (result.success) {
        displayMessage(msgElement, `${petName} eliminado correctamente.`, 'success');
        // Determinar qué lista recargar basado en el rol
        if (user.role === 'admin') {
            loadAllPets();
        } else {
            loadClientPets();
        }
    } else {
        displayMessage(msgElement, `Error al eliminar a ${petName}: ${result.message}`, 'error');
    }
}

// --- Manejadores de Eventos de Cliente (CRUD de Administrador) ---

/**
 * Abre el modal de edición de Cliente y precarga los datos.
 */
function openClientEditModal(clientId) {
    const client = currentClients.find(c => c.id == clientId);
    if (!client) {
        displayMessage(adminClientMessage, 'Cliente no encontrado.', 'error');
        return;
    }

    // Precargar datos en el formulario del modal
    editClientId.value = client.id;
    formEditClient.querySelector('input[name="nombre"]').value = client.nombre;
    formEditClient.querySelector('input[name="apellido"]').value = client.apellido;
    formEditClient.querySelector('input[name="documento"]').value = client.documento;
    formEditClient.querySelector('input[name="telefono"]').value = client.telefono;
    formEditClient.querySelector('input[name="email"]').value = client.email;
    formEditClient.querySelector('input[name="rol"]').value = client.rol;
    formEditClient.querySelector('input[name="password"]').value = ''; // La contraseña nunca se precarga

    // Limpiar mensaje previo
    clientEditMessage.textContent = '';

    // Mostrar modal
    clientModalOverlay.classList.remove('hidden');
}


/**
 * Maneja el envío del formulario de Edición de Cliente.
 */
async function handleEditClient(event) {
    event.preventDefault();
    adminClientMessage.textContent = 'Guardando cambios...';

    const formData = new FormData(formEditClient);
    const data = Object.fromEntries(formData.entries());

    const result = await VeterinariaAPI.updateClient(data);

    if (result.success) {
        displayMessage(adminClientMessage, 'Cambios guardados correctamente.', 'success');
        loadClients(); // Recargar la lista de clientes
        setTimeout(() => clientModalOverlay.classList.add('hidden'), 1000);
    } else {
        displayMessage(adminClientMessage, result.message, 'error');
    }
}

/**
 * Maneja la eliminación de un cliente.
 */
async function handleDeleteClient(clientId, clientName) {
    if (!confirm(`[ADMIN] ¿Estás seguro de que quieres eliminar al cliente ${clientName} (ID: ${clientId})? Esto eliminará sus datos.`)) {
        return;
    }
    
    adminClientMessage.textContent = `Eliminando al cliente ${clientName}...`;

    const result = await VeterinariaAPI.deleteClient(clientId);

    if (result.success) {
        displayMessage(adminClientMessage, `Cliente ${clientName} eliminado correctamente.`, 'success');
        loadClients(); // Recargar la lista
    } else {
        displayMessage(adminClientMessage, `Error al eliminar al cliente ${clientName}: ${result.message}`, 'error');
    }
}

/**
 * Maneja el cierre de sesión.
 */
function handleLogout() {
    VeterinariaAPI.closeSession();
    initializeApp(); // Vuelve a la pantalla de login
}


// --- Inicialización de la Aplicación ---

/**
 * Inicializa la aplicación, revisa la sesión y configura la vista inicial.
 */
function initializeApp() {
    const user = VeterinariaAPI.getSession();

    if (user) {
        // Usuario logueado
        renderDashboard(); 
    } else {
        // No hay sesión
        showView('login');
    }
}

// --- Configuración de Listeners (Se ejecuta al cargar el módulo) ---

// Autenticación
formLogin.addEventListener('submit', handleLogin);
formRegister.addEventListener('submit', handleRegister);
navLogout.addEventListener('click', handleLogout);

// Navegación (Login/Register)
linkToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showView('register');
});
linkToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showView('login');
});

// Dashboard (Mascotas CRUD - Cliente/Admin)
formAddPet.addEventListener('submit', handleAddPet);
formEditPet.addEventListener('submit', handleEditPet); 

// Dashboard (Clientes CRUD - Admin)
formEditClient.addEventListener('submit', handleEditClient); 

// Navegación de Administrador (Listeners actualizados)
navToClientsBtn.addEventListener('click', () => {
    showView('adminClients');
    loadClients(); // Cargar datos al entrar a la vista de clientes
});
navToAdminPetsBtn.addEventListener('click', () => {
    showView('adminPets');
    loadAllPets(); // Cargar TODAS las mascotas al entrar a la vista de admin
});
backToAdminClientsBtn.addEventListener('click', () => {
    showView('adminDashboard');
});
backToAdminPetsBtn.addEventListener('click', () => {
    showView('adminDashboard');
});


// Iniciar la aplicación al cargar el módulo
initializeApp();
