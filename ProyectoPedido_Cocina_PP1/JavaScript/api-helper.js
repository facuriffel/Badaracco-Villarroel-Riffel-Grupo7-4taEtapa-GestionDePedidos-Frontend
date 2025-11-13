// api-helper.js

const API_BASE_URL = 'https://badaracco-villarroel-riffel-grupo7-4taetapa-gest-production.up.railway.app';
const TOKEN_KEY = 'jwt_token';

/**
 * Fetch autenticado usando el token de la pestaña actual
 * @param {string} endpoint - Ruta relativa de la API
 * @param {object} options - Opciones fetch
 */
export async function authenticatedFetch(endpoint, options = {}) {
    // Leemos el token de sessionStorage en vez de localStorage
    const token = sessionStorage.getItem(TOKEN_KEY);

    console.log(' authenticatedFetch llamado:', {
        endpoint,
        method: options.method || 'GET',
        tieneToken: !!token
    });

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    return fetch(url, { ...options, headers });
}
