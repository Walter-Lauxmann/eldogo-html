// models.js

/**
 * URL base de la API.
 * Nota: Debe apuntar al archivo 'api.php' y usar el parámetro 'route'
 */
const API_BASE_URL = './api/api.php?route=';

/**
 * Clase para manejar todas las interacciones con la API REST de Veterinaria.
 * También maneja la sesión del usuario en el navegador (localStorage).
 */
export class VeterinariaAPI {

    /**
     * Helper para realizar llamadas fetch a la API.
     * @param {string} route La ruta específica del endpoint (ej: 'auth/login').
     * @param {string} method El método HTTP (GET, POST, PUT, DELETE).
     * @param {Object} [data=null] Datos a enviar en el cuerpo de la solicitud (para POST/PUT/DELETE).
     * @returns {Promise<Object>} La respuesta JSON de la API.
     */
    static async _call(route, method = 'GET', data = null) {
        const url = `${API_BASE_URL}${route}`;
        const options = {
            method: method,
            headers: {
                // Es crucial para que PHP pueda leer el JSON enviado
                'Content-Type': 'application/json',
            },
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // Manejar errores HTTP como 404, 500
                const errorText = await response.text();
                throw new Error(`Error HTTP ${response.status}: ${errorText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error en la llamada a la API:', error);
            // Devolver un formato de error consistente
            return { success: false, message: error.message };
        }
    }

    // --- Métodos de Sesión y Autenticación ---

    /**
     * Guarda la información del usuario en localStorage.
     * @param {Object} user Objeto de usuario retornado por la API.
     */
    static saveSession(user) {
        localStorage.setItem('veterinaria_user', JSON.stringify(user));
    }

    /**
     * Obtiene la información del usuario de localStorage.
     * @returns {Object|null} El objeto de usuario o null si no hay sesión.
     */
    static getSession() {
        const userJson = localStorage.getItem('veterinaria_user');
        return userJson ? JSON.parse(userJson) : null;
    }

    /**
     * Cierra la sesión eliminando el usuario de localStorage.
     */
    static closeSession() {
        localStorage.removeItem('veterinaria_user');
        // Se llama al endpoint de logout (aunque solo es confirmación en PHP)
        VeterinariaAPI._call('auth/logout', 'POST'); 
    }

    /**
     * Llama al endpoint de registro.
     * @param {Object} data Datos del cliente para registrar.
     * @returns {Promise<Object>}
     */
    static async register(data) {
        return await VeterinariaAPI._call('auth/register', 'POST', data);
    }

    /**
     * Llama al endpoint de login.
     * @param {Object} data Email y password.
     * @returns {Promise<Object>}
     */
    static async login(data) {
        const result = await VeterinariaAPI._call('auth/login', 'POST', data);
        if (result.success && result.user) {
            VeterinariaAPI.saveSession(result.user);
        }
        return result;
    }

    // --- Métodos de Mascotas (CRUD) ---

    /**
     * Llama al endpoint para agregar una mascota.
     * @param {Object} data Datos de la mascota.
     * @returns {Promise<Object>}
     */
    static async addPet(data) {
        return await VeterinariaAPI._call('pets/add', 'POST', data);
    }

    /**
     * Llama al endpoint para listar las mascotas de un cliente.
     * @param {number} clientId ID del cliente.
     * @returns {Promise<Object>}
     */
    static async listPets(clientId) {
        // En este caso, el ID del cliente se pasa como query parameter para el GET
        return await VeterinariaAPI._call(`pets/list&client_id=${clientId}`, 'GET');
    }
    
    /**
     * Llama al endpoint para actualizar una mascota.
     * @param {Object} data Datos de la mascota, incluyendo el 'id'.
     * @returns {Promise<Object>}
     */
    static async updatePet(data) {
        return await VeterinariaAPI._call('pets/update', 'PUT', data);
    }
    
    /**
     * Llama al endpoint para eliminar una mascota.
     * @param {number} petId ID de la mascota a eliminar.
     * @returns {Promise<Object>}
     */
    static async deletePet(petId) {
        return await VeterinariaAPI._call('pets/delete', 'DELETE', { id: petId });
    }
}
