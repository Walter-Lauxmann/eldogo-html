// controllers.js
import { VeterinariaAPI } from '../models/models.js';

// --- Elementos del DOM ---
const appContainer = document.getElementById('app-container');
const views = {
    login: document.getElementById('view-login'),
    register: document.getElementById('view-register'),
    dashboard: document.getElementById('view-dashboard')
};

const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const formAddPet = document.getElementById('form-add-pet');
const navLogout = document.getElementById('nav-logout');
const petListContainer = document.getElementById('pets-list-container');
const welcomeMessage = document.getElementById('welcome-message');
const loginMessage = document.getElementById('login-message');
const registerMessage = document.getElementById('register-message');
const petAddMessage = document.getElementById('pet-add-message');
const linkToRegister = document.getElementById('link-to-register');
const linkToLogin = document.getElementById('link-to-login');

// Modal y sus elementos
const modalOverlay = createModalOverlay();
const formEditPet = modalOverlay.querySelector('#form-edit-pet');
const editPetId = modalOverlay.querySelector('#edit-pet-id');
const editMessage = modalOverlay.querySelector('#edit-message');

// Variable para guardar el listado de mascotas en memoria
let currentPets = [];

// --- Funciones de Utilidad y UI ---

/** Crea y adjunta el modal de edición al cuerpo del documento */
function createModalOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'edit-modal-overlay';
    overlay.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 z-50 hidden flex items-center justify-center';
    overlay.innerHTML = `
        <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md m-4">
            <h3 class="text-2xl font-bold text-indigo-700 mb-4">Editar Mascota</h3>
            <form id="form-edit-pet" class="space-y-4">
                <input type="hidden" id="edit-pet-id" name="id">
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

/**
 * Muestra solo la vista especificada y oculta las demás.
 * @param {string} viewName Nombre de la vista ('login', 'register', 'dashboard').
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
    if (viewName === 'dashboard') {
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

// --- Lógica del Dashboard y Mascota ---

/**
 * Abre el modal de edición y precarga los datos de la mascota.
 * @param {number} petId ID de la mascota a editar.
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
    
    // Limpiar mensaje previo
    editMessage.textContent = '';

    // Mostrar modal
    modalOverlay.classList.remove('hidden');
}


/**
 * Renderiza la lista de mascotas en el contenedor.
 * @param {Array<Object>} pets Array de objetos mascota.
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
    
    // Añadir listeners a los nuevos botones
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            openEditModal(e.currentTarget.dataset.id);
        });
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            handleDeletePet(e.currentTarget.dataset.id, e.currentTarget.dataset.name);
        });
    });
}

/**
 * Carga y muestra la lista de mascotas para el usuario actual.
 */
async function loadPets() {
    petListContainer.innerHTML = '<p class="text-center text-indigo-600 py-8">Cargando...</p>';
    const user = VeterinariaAPI.getSession();
    if (!user) {
        return;
    }

    const result = await VeterinariaAPI.listPets(user.id);
    if (result.success) {
        renderPets(result.pets);
    } else {
        petListContainer.innerHTML = `<p class="text-red-500 text-center py-8">Error al cargar mascotas: ${result.message}</p>`;
    }
}


// --- Manejadores de Eventos ---

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
    if (!user) {
        displayMessage(petAddMessage, 'Error: No hay sesión activa.', 'error');
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
        loadPets(); // Recargar la lista de mascotas
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
    // Convertir FormData a un objeto plano
    const data = Object.fromEntries(formData.entries());

    // El ID ya está incluido en 'data' gracias al campo hidden
    const result = await VeterinariaAPI.updatePet(data);

    if (result.success) {
        displayMessage(editMessage, 'Cambios guardados correctamente.', 'success');
        loadPets(); // Recargar la lista
        setTimeout(() => modalOverlay.classList.add('hidden'), 1000);
    } else {
        displayMessage(editMessage, result.message, 'error');
    }
}

/**
 * Maneja la eliminación de una mascota.
 */
async function handleDeletePet(petId, petName) {
    // Usamos una confirmación simple (reemplazar con un modal custom si es necesario)
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${petName} (ID: ${petId})? Esta acción es irreversible.`)) {
        return;
    }
    
    displayMessage(petAddMessage, `Eliminando a ${petName}...`, 'error');

    const result = await VeterinariaAPI.deletePet(petId);

    if (result.success) {
        displayMessage(petAddMessage, `${petName} eliminado correctamente.`, 'success');
        loadPets(); // Recargar la lista
    } else {
        displayMessage(petAddMessage, `Error al eliminar a ${petName}: ${result.message}`, 'error');
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
        welcomeMessage.textContent = `Bienvenido(a), ${user.nombre}.`;
        showView('dashboard');
        loadPets();
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

// Navegación
linkToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showView('register');
});
linkToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showView('login');
});

// Dashboard (Agregar y Editar)
formAddPet.addEventListener('submit', handleAddPet);
formEditPet.addEventListener('submit', handleEditPet); // Listener para el formulario dentro del modal

// Iniciar la aplicación al cargar el módulo
initializeApp();
