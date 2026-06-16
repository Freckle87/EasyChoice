// api.js - Работа с бэкендом EasyChoice (PostgreSQL)
const API_URL = 'http://localhost:3001/api';

// Текущий пользователь и токен
let currentUser = null;
let authToken = localStorage.getItem('easychoice_token');

// Вспомогательные функции
function saveToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem('easychoice_token', token);
    } else {
        localStorage.removeItem('easychoice_token');
    }
}

function getHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (authToken) {
        headers['Authorization'] = 'Bearer ' + authToken;
    }
    return headers;
}

// ТОВАРЫ
async function loadProductsFromAPI() {
    try {
        const response = await fetch(API_URL + '/products');
        if (!response.ok) throw new Error('Ошибка загрузки товаров');
        const data = await response.json();
        console.log('Загружено товаров из PostgreSQL:', data.length);
        return data;
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        return [];
    }
}

async function getProductByIdAPI(id) {
    try {
        const response = await fetch(API_URL + '/products/' + id);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки товара:', error);
        return null;
    }
}

async function searchProductsAPI(query) {
    try {
        const response = await fetch(API_URL + '/search?q=' + encodeURIComponent(query));
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Ошибка поиска:', error);
        return [];
    }
}

// АВТОРИЗАЦИЯ
async function registerUserAPI(email, password, name) {
    try {
        const response = await fetch(API_URL + '/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password, name: name })
        });
        const data = await response.json();
        if (response.ok && data.token) {
            saveToken(data.token);
            currentUser = data.user;
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error };
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        return { success: false, error: 'Ошибка соединения' };
    }
}

async function loginUserAPI(email, password) {
    try {
        const response = await fetch(API_URL + '/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });
        const data = await response.json();
        if (response.ok && data.token) {
            saveToken(data.token);
            currentUser = data.user;
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error };
    } catch (error) {
        console.error('Ошибка входа:', error);
        return { success: false, error: 'Ошибка соединения' };
    }
}
function getCurrentUser() {
    return currentUser;
}

function getToken() {
    return localStorage.getItem('easychoice_token');
}
function logoutUserAPI() {
    saveToken(null);
    currentUser = null;
}

function isAdminAPI() {
    return currentUser && currentUser.role === 'admin';
}

// ИЗБРАННОЕ
async function loadWishlistAPI() {
    if (!authToken) return [];
    try {
        const response = await fetch(API_URL + '/wishlist', {
            headers: getHeaders()
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.map(function(p) { return p.id; });
    } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
        return [];
    }
}

async function addToWishlistAPI(productId) {
    if (!authToken) return false;
    try {
        const response = await fetch(API_URL + '/wishlist', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ productId: productId })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка добавления в избранное:', error);
        return false;
    }
}

async function removeFromWishlistAPI(productId) {
    if (!authToken) return false;
    try {
        const response = await fetch(API_URL + '/wishlist/' + productId, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка удаления из избранного:', error);
        return false;
    }
}

// СРАВНЕНИЕ
async function loadCompareAPI() {
    if (!authToken) return [];
    try {
        const response = await fetch(API_URL + '/compare', {
            headers: getHeaders()
        });
        if (!response.ok) return [];
        const data = await response.json();
        return data.map(function(p) { return p.id; });
    } catch (error) {
        console.error('Ошибка загрузки сравнения:', error);
        return [];
    }
}

async function addToCompareAPI(productId) {
    if (!authToken) return { success: false };
    try {
        const response = await fetch(API_URL + '/compare', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ productId: productId })
        });
        const data = await response.json();
        if (!response.ok) {
            return { success: false, error: data.error };
        }
        return { success: true };
    } catch (error) {
        console.error('Ошибка добавления в сравнение:', error);
        return { success: false, error: 'Ошибка соединения' };
    }
}

async function removeFromCompareAPI(productId) {
    if (!authToken) return false;
    try {
        const response = await fetch(API_URL + '/compare/' + productId, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка удаления из сравнения:', error);
        return false;
    }
}

async function clearCompareAPI() {
    if (!authToken) return false;
    try {
        const response = await fetch(API_URL + '/compare', {
            method: 'DELETE',
            headers: getHeaders()
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка очистки сравнения:', error);
        return false;
    }
}

// КОРЗИНА
async function loadCartAPI() {
    if (!authToken) return [];
    try {
        const response = await fetch(API_URL + '/cart', {
            headers: getHeaders()
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        return [];
    }
}

async function addToCartAPI(productId, quantity) {
    if (quantity === undefined) quantity = 1;
    if (!authToken) return false;
    try {
        const response = await fetch(API_URL + '/cart', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ productId: productId, quantity: quantity })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка добавления в корзину:', error);
        return false;
    }
}

async function updateCartQuantityAPI(productId, quantity) {
    if (!authToken) return false;
    try {
        const response = await fetch(API_URL + '/cart/' + productId, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ quantity: quantity })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка обновления корзины:', error);
        return false;
    }
}

async function removeFromCartAPI(productId) {
    if (!authToken) return false;
    try {
        const response = await fetch(API_URL + '/cart/' + productId, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка удаления из корзины:', error);
        return false;
    }
}

async function clearCartAPI() {
    if (!authToken) return false;
    try {
        const response = await fetch(API_URL + '/cart', {
            method: 'DELETE',
            headers: getHeaders()
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка очистки корзины:', error);
        return false;
    }
}

// ЗАКАЗЫ
async function createOrderAPI(orderData) {
    if (!authToken) return { success: false, error: 'Не авторизован' };
    try {
        const response = await fetch(API_URL + '/orders', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(orderData)
        });
        const data = await response.json();
        return { success: response.ok, orderId: data.orderId, error: data.error };
    } catch (error) {
        console.error('Ошибка создания заказа:', error);
        return { success: false, error: 'Ошибка соединения' };
    }
}

async function loadOrdersAPI() {
    if (!authToken) return [];
    try {
        const response = await fetch(API_URL + '/orders', {
            headers: getHeaders()
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        return [];
    }
}

// АДМИН
async function addProductAPI(productData) {
    if (!authToken || !isAdminAPI()) return { success: false, error: 'Нет прав' };
    try {
        const response = await fetch(API_URL + '/products', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(productData)
        });
        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error };
        }
        const data = await response.json();
        return { success: true, product: data };
    } catch (error) {
        return { success: false, error: 'Ошибка соединения' };
    }
}

async function updateProductAPI(id, productData) {
    if (!authToken || !isAdminAPI()) return { success: false, error: 'Нет прав' };
    try {
        const response = await fetch(API_URL + '/products/' + id, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(productData)
        });
        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error };
        }
        const data = await response.json();
        return { success: true, product: data };
    } catch (error) {
        return { success: false, error: 'Ошибка соединения' };
    }
}

async function deleteProductAPI(id) {
    if (!authToken || !isAdminAPI()) return { success: false, error: 'Нет прав' };
    try {
        const response = await fetch(API_URL + '/products/' + id, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Ошибка соединения' };
    }
}

async function loadAllOrdersAPI() {
    if (!authToken || !isAdminAPI()) return [];
    try {
        const response = await fetch(API_URL + '/admin/orders', {
            headers: getHeaders()
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки заказов:', error);
        return [];
    }
}

async function updateOrderStatusAPI(orderId, status) {
    if (!authToken || !isAdminAPI()) return false;
    try {
        const response = await fetch(API_URL + '/admin/orders/' + orderId + '/status', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status: status })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
        return false;
    }
}

// ОТЗЫВЫ
async function loadReviewsAPI(productId) {
    try {
        const response = await fetch(API_URL + '/products/' + productId + '/reviews');
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        return [];
    }
}

async function addReviewAPI(productId, rating, comment) {
    if (!authToken) return false;
    try {
        const response = await fetch(API_URL + '/products/' + productId + '/reviews', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ rating: rating, comment: comment })
        });
        return response.ok;
    } catch (error) {
        console.error('Ошибка добавления отзыва:', error);
        return false;
    }
}

// ЭКСПОРТ ГЛОБАЛЬНЫХ ФУНКЦИЙ
window.api = {
    loadProducts: loadProductsFromAPI,
    getProductById: getProductByIdAPI,
    searchProducts: searchProductsAPI,
    register: registerUserAPI,
    login: loginUserAPI,
    logout: logoutUserAPI,
    isAdmin: isAdminAPI,
    getCurrentUser: function() { return currentUser; },
    getToken: function() { return authToken; },
    loadWishlist: loadWishlistAPI,
    addToWishlist: addToWishlistAPI,
    removeFromWishlist: removeFromWishlistAPI,
    loadCompare: loadCompareAPI,
    addToCompare: addToCompareAPI,
    removeFromCompare: removeFromCompareAPI,
    clearCompare: clearCompareAPI,
    loadCart: loadCartAPI,
    addToCart: addToCartAPI,
    updateCartQuantity: updateCartQuantityAPI,
    removeFromCart: removeFromCartAPI,
    clearCart: clearCartAPI,
    createOrder: createOrderAPI,
    loadOrders: loadOrdersAPI,
    addProduct: addProductAPI,
    updateProduct: updateProductAPI,
    deleteProduct: deleteProductAPI,
    loadAllOrders: loadAllOrdersAPI,
    updateOrderStatus: updateOrderStatusAPI,
    loadReviews: loadReviewsAPI,
    addReview: addReviewAPI
};
window.api.getCurrentUser = getCurrentUser;
window.api.getToken = getToken;
console.log('API модуль загружен, бэкенд: ' + API_URL);