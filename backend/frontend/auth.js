// auth.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

let currentAuthUser = null;

function updateAuthButton() {
    const authBtn = document.getElementById('auth-btn-header');
    if (!authBtn) return;
    
    const token = localStorage.getItem('easychoice_token');
    
    // Получаем имя из разных источников
    let userName = null;
    
    if (currentAuthUser && currentAuthUser.name) {
        userName = currentAuthUser.name;
    } else {
        const savedUser = localStorage.getItem('easychoice_user');
        if (savedUser) {
            try {
                const user = JSON.parse(savedUser);
                userName = user.name;
            } catch(e) {}
        }
    }
    
    if (token && userName) {
        authBtn.innerHTML = '<i class="fas fa-user-circle"></i> ' + userName.substring(0, 18);
        authBtn.onclick = function(e) {
            e.preventDefault();
            openProfilePage();
        };
    } else if (token && currentAuthUser && currentAuthUser.email) {
        const name = currentAuthUser.name || currentAuthUser.email.split('@')[0];
        authBtn.innerHTML = '<i class="fas fa-user-circle"></i> ' + name.substring(0, 18);
        authBtn.onclick = function(e) {
            e.preventDefault();
            openProfilePage();
        };
    } else {
        authBtn.innerHTML = '<i class="fas fa-user"></i> Войти';
        authBtn.onclick = function(e) {
            e.preventDefault();
            const modal = document.getElementById('auth-modal');
            if (modal) modal.style.display = 'block';
            // Обновляем мобильную кнопку профиля
if (typeof updateMobileAuthButton === 'function') {
    updateMobileAuthButton();
}
        };
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;
    
    if (!email || !password) {
        alert('Заполните все поля');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            localStorage.setItem('easychoice_token', data.token);
            
            // Сохраняем пользователя в localStorage
            localStorage.setItem('easychoice_user', JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                name: data.user.name || email.split('@')[0],
                role: data.user.role
            }));
            
            currentAuthUser = data.user;
            
            updateAuthButton();
            document.getElementById('auth-modal').style.display = 'none';
            alert('Добро пожаловать, ' + (data.user.name || data.user.email) + '!');
            
            location.reload();
        } else {
            alert(data.error || 'Ошибка входа');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
    }
}

async function handleRegister() {
    const name = document.getElementById('register-name')?.value;
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;
    const confirm = document.getElementById('register-confirm-password')?.value;
    
    if (!name || !email || !password) {
        alert('Заполните все поля');
        return;
    }
    if (password !== confirm) {
        alert('Пароли не совпадают');
        return;
    }
    if (password.length < 6) {
        alert('Пароль должен быть минимум 6 символов');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password, name: name })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            localStorage.setItem('easychoice_token', data.token);
            
            // Сохраняем пользователя в localStorage
            localStorage.setItem('easychoice_user', JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                name: data.user.name || name,
                role: data.user.role
            }));
            
            currentAuthUser = data.user;
            currentAuthUser.name = data.user.name || name;
            
            updateAuthButton();
            document.getElementById('auth-modal').style.display = 'none';
            alert('Регистрация успешна!');
            location.reload();
        } else {
            alert(data.error || 'Ошибка регистрации');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
    }
}

function handleLogout() {
    localStorage.removeItem('easychoice_token');
    currentAuthUser = null;
    
    if (window.clearLocalData) {
        window.clearLocalData();
    }
    
    updateAuthButton();
    
    // Закрываем модальные окна если открыты
    const authModal = document.getElementById('auth-modal');
    const profileModal = document.getElementById('profile-modal');
    if (authModal) authModal.style.display = 'none';
    if (profileModal) profileModal.style.display = 'none';
    
    alert('Вы вышли из аккаунта');
    location.reload();
}

async function openProfileModal() {
    if (!currentAuthUser) return;
    
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    
    // Заполняем информацию о пользователе
    const profileInfo = document.getElementById('profile-info');
    if (profileInfo) {
        profileInfo.innerHTML = '<p><strong>Имя:</strong> ' + (currentAuthUser.name || 'Не указано') + '</p>' +
            '<p><strong>Email:</strong> ' + currentAuthUser.email + '</p>' +
            '<p><strong>Роль:</strong> ' + (currentAuthUser.role === 'admin' ? 'Администратор' : 'Пользователь') + '</p>';
    }
    
    // Загружаем заказы
    const ordersContainer = document.getElementById('orders-history');
    if (ordersContainer) {
        ordersContainer.innerHTML = '<p>Загрузка заказов...</p>';
        
        try {
            const response = await fetch('http://localhost:3001/api/orders', {
                headers: { 'Authorization': 'Bearer ' + localStorage.getItem('easychoice_token') }
            });
            
            if (response.ok) {
                const orders = await response.json();
                if (orders.length === 0) {
                    ordersContainer.innerHTML = '<p>У вас пока нет заказов</p>';
                } else {
                    ordersContainer.innerHTML = orders.map(function(order) {
                        return '<div class="order-card">' +
                            '<div class="order-header">' +
                                '<span class="order-number">Заказ #' + (order.order_number || order.id) + '</span>' +
                                '<span class="order-date">' + new Date(order.created_at).toLocaleDateString() + '</span>' +
                            '</div>' +
                            '<div class="order-total">Итого: ' + (order.total_price || 0) + ' руб.</div>' +
                            '<div class="order-status status-' + order.status + '">' + (order.status || 'pending') + '</div>' +
                        '</div>';
                    }).join('');
                }
            } else {
                ordersContainer.innerHTML = '<p>Не удалось загрузить заказы</p>';
            }
        } catch(e) {
            ordersContainer.innerHTML = '<p>Ошибка загрузки заказов</p>';
        }
    }
    
    modal.style.display = 'block';
}

async function restoreSession() {
    const token = localStorage.getItem('easychoice_token');
    if (!token) {
        updateAuthButton();
        return;
    }
    
    // Сначала пробуем взять пользователя из localStorage (самое свежее)
    const savedUser = localStorage.getItem('easychoice_user');
    if (savedUser) {
        try {
            currentAuthUser = JSON.parse(savedUser);
            console.log('Пользователь из localStorage:', currentAuthUser.name);
        } catch(e) {}
    }
    
    // Обновляем данные с сервера (но не перезаписываем имя, если оно есть в localStorage)
    try {
        const response = await fetch('http://localhost:3001/api/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
            const userFromServer = await response.json();
            
            // Если в localStorage нет имени, берём с сервера
            if (!currentAuthUser || !currentAuthUser.name) {
                currentAuthUser = userFromServer;
                localStorage.setItem('easychoice_user', JSON.stringify({
                    id: userFromServer.id,
                    email: userFromServer.email,
                    name: userFromServer.name,
                    role: userFromServer.role
                }));
            } else {
                // Если имя есть в localStorage, используем его, но обновляем остальное
                currentAuthUser = {
                    ...userFromServer,
                    name: currentAuthUser.name
                };
            }
            
            console.log('Имя после restoreSession:', currentAuthUser.name);
            
            if (window.syncAllWithServer) {
                await window.syncAllWithServer();
            }
        } else {
            localStorage.removeItem('easychoice_token');
            localStorage.removeItem('easychoice_user');
            currentAuthUser = null;
        }
    } catch (error) {
        console.error('Ошибка восстановления сессии:', error);
    }
    
    updateAuthButton();
    
    if (typeof toggleAdminPanel === 'function') {
        toggleAdminPanel();
    }
}

// ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth инициализация');
    restoreSession();
    
    // Кнопка входа в модальном окне
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.onclick = handleLogin;
    }
    
    // Кнопка регистрации
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.onclick = handleRegister;
    }
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = handleLogout;
    }
    // Обработчики для страницы профиля
const profileForm = document.getElementById('profile-settings-form');
if (profileForm) {
    profileForm.onsubmit = saveProfileSettings;
}

const passwordForm = document.getElementById('profile-password-form');
if (passwordForm) {
    passwordForm.onsubmit = changePassword;
}

initProfileTabs();
    // Переключение вкладок
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(function(tab) {
        tab.onclick = function() {
            const tabId = this.getAttribute('data-tab');
            authTabs.forEach(function(t) { t.classList.remove('active'); });
            this.classList.add('active');
            
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            
            if (tabId === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            }
        };
    });
    
    // Закрытие модальных окон
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(function(btn) {
        btn.onclick = function() {
            document.getElementById('auth-modal').style.display = 'none';
            document.getElementById('profile-modal').style.display = 'none';
        };
    });
    
    // Закрытие при клике вне окна
    window.onclick = function(e) {
        const authModal = document.getElementById('auth-modal');
        const profileModal = document.getElementById('profile-modal');
        if (e.target === authModal) authModal.style.display = 'none';
        if (e.target === profileModal) profileModal.style.display = 'none';
    };
});
// ========== СТРАНИЦА ЛИЧНОГО КАБИНЕТА ==========

// Переключение вкладок профиля
function initProfileTabs() {
    const navBtns = document.querySelectorAll('.profile-nav-btn');
    const tabs = document.querySelectorAll('.profile-tab');
    
    navBtns.forEach(function(btn) {
        btn.onclick = function() {
            const tabId = this.getAttribute('data-tab');
            
            navBtns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            
            tabs.forEach(function(tab) { tab.classList.remove('active'); });
            document.getElementById('profile-tab-' + tabId).classList.add('active');
            
            if (tabId === 'orders') {
                loadProfileOrders();
            }
        };
    });
    
    // Кнопка выхода
    const logoutBtn = document.getElementById('profile-logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = function() {
            if (confirm('Вы уверены, что хотите выйти?')) {
                handleLogout();
            }
        };
    }
    
    // ========== ОБРАБОТЧИК ТЕЛЕФОНА В НАСТРОЙКАХ ПРОФИЛЯ ==========
    const profilePhoneInput = document.getElementById('profile-phone');
    if (profilePhoneInput) {
        profilePhoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            // Ограничиваем 11 цифрами
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            
            // Если первая цифра не 7, заменяем на 7
            if (value.length > 0 && value[0] !== '7' && value[0] !== '8') {
                value = '7' + value.slice(1);
            }
            
            // Форматирование
            if (value.length === 0) {
                e.target.value = '';
            } else if (value.length <= 1) {
                e.target.value = '+7';
            } else if (value.length <= 4) {
                e.target.value = '+7 (' + value.slice(1);
            } else if (value.length <= 7) {
                e.target.value = '+7 (' + value.slice(1, 4) + ') ' + value.slice(4);
            } else if (value.length <= 9) {
                e.target.value = '+7 (' + value.slice(1, 4) + ') ' + value.slice(4, 7) + '-' + value.slice(7);
            } else {
                e.target.value = '+7 (' + value.slice(1, 4) + ') ' + value.slice(4, 7) + '-' + value.slice(7, 9) + '-' + value.slice(9, 11);
            }
        });
    }
}
// Загрузка заказов для профиля
async function loadProfileOrders() {
    const container = document.getElementById('profile-orders-list');
    if (!container) return;
    
    container.innerHTML = '<p>Загрузка заказов...</p>';
    
    try {
        const response = await fetch('http://localhost:3001/api/orders', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('easychoice_token') }
        });
        
        if (response.ok) {
            const orders = await response.json();
            
            if (orders.length === 0) {
                container.innerHTML = '<p>У вас пока нет заказов</p>';
                return;
            }
            
            container.innerHTML = orders.map(function(order) {
                const itemsHtml = order.items ? order.items.map(function(item) {
                    return '<div class="profile-order-item">' + item.product_name + ' x ' + item.quantity + ' — ' + (item.price * item.quantity).toLocaleString() + ' руб.</div>';
                }).join('') : 'Нет товаров';
                
                return '<div class="profile-order-card">' +
                    '<div class="profile-order-header">' +
                        '<span class="profile-order-number">Заказ #' + (order.order_number || order.id) + '</span>' +
                        '<span class="profile-order-date">' + new Date(order.created_at).toLocaleDateString() + '</span>' +
                    '</div>' +
                    '<div class="profile-order-items">' + itemsHtml + '</div>' +
                    '<div class="profile-order-total">Итого: ' + (order.total_price || 0).toLocaleString() + ' руб.</div>' +
                    '<div class="profile-order-status status-' + order.status + '">' + getOrderStatusText(order.status) + '</div>' +
                '</div>';
            }).join('');
        } else {
            container.innerHTML = '<p>Не удалось загрузить заказы</p>';
        }
    } catch (error) {
        container.innerHTML = '<p>Ошибка загрузки заказов</p>';
    }
}

// Загрузка избранного для профиля
async function loadProfileWishlist() {
    const container = document.getElementById('profile-wishlist-list');
    if (!container) return;
    
    container.innerHTML = '<p>Загрузка...</p>';
    
    try {
        const wishlistIds = JSON.parse(localStorage.getItem('easychoice_wishlist') || '[]');
        const allProducts = window.products || [];
        const wishlistProducts = [];
        
        for (const id of wishlistIds) {
            const product = allProducts.find(function(p) { return p.id == id; });
            if (product) wishlistProducts.push(product);
        }
        
        if (wishlistProducts.length === 0) {
            container.innerHTML = '<p>В избранном нет товаров</p>';
            return;
        }
        
        const formatPriceFn = typeof formatPrice === 'function' ? formatPrice : function(price) { return price.toLocaleString('ru-RU') + ' руб.'; };
        
        container.innerHTML = wishlistProducts.map(function(product) {
            return '<div class="profile-wishlist-item">' +
                '<img src="' + product.image + '" alt="' + product.name + '" onerror="this.src=\'https://via.placeholder.com/150x150?text=No+Image\'">' +
                '<h4>' + product.name + '</h4>' +
                '<div class="price">' + formatPriceFn(product.price) + '</div>' +
                '<button class="btn remove-from-wishlist-btn" data-id="' + product.id + '">Удалить</button>' +
            '</div>';
        }).join('');
        
        container.querySelectorAll('.remove-from-wishlist-btn').forEach(function(btn) {
            btn.onclick = function() {
                const id = parseInt(btn.dataset.id);
                toggleWishlist(id);
                loadProfileWishlist();
            };
        });
    } catch (error) {
        container.innerHTML = '<p>Ошибка загрузки избранного</p>';
    }
}

// Загрузка сравнения для профиля
async function loadProfileCompare() {
    const container = document.getElementById('profile-compare-list');
    if (!container) return;
    
    container.innerHTML = '<p>Загрузка...</p>';
    
    try {
        const compareIds = JSON.parse(localStorage.getItem('easychoice_compare') || '[]');
        const allProducts = window.products || [];
        const compareProducts = [];
        
        for (const id of compareIds) {
            const product = allProducts.find(function(p) { return p.id == id; });
            if (product) compareProducts.push(product);
        }
        
        if (compareProducts.length === 0) {
            container.innerHTML = '<p>Нет товаров для сравнения</p>';
            return;
        }
        
        const formatPriceFn = typeof formatPrice === 'function' ? formatPrice : function(price) { return price.toLocaleString('ru-RU') + ' руб.'; };
        
        container.innerHTML = compareProducts.map(function(product) {
            return '<div class="profile-compare-item">' +
                '<img src="' + product.image + '" alt="' + product.name + '" onerror="this.src=\'https://via.placeholder.com/150x150?text=No+Image\'">' +
                '<h4>' + product.name + '</h4>' +
                '<div class="price">' + formatPriceFn(product.price) + '</div>' +
                '<button class="btn remove-from-compare-btn" data-id="' + product.id + '">Удалить</button>' +
                '<button class="btn btn-outline add-to-cart-compare-btn" data-id="' + product.id + '" style="margin-top:5px;">В корзину</button>' +
            '</div>';
        }).join('');
        
        container.querySelectorAll('.remove-from-compare-btn').forEach(function(btn) {
            btn.onclick = function() {
                const id = parseInt(btn.dataset.id);
                removeFromCompare(id);
                loadProfileCompare();
                updateCompareCount();
            };
        });
        
        container.querySelectorAll('.add-to-cart-compare-btn').forEach(function(btn) {
            btn.onclick = function() {
                const id = parseInt(btn.dataset.id);
                if (typeof addToCart === 'function') {
                    addToCart(id);
                }
            };
        });
    } catch (error) {
        container.innerHTML = '<p>Ошибка загрузки сравнения</p>';
    }
}

// Загрузка данных пользователя в форму настроек
async function loadProfileSettings() {
    const token = localStorage.getItem('easychoice_token');
    if (!token) return;
    
    try {
        const response = await fetch('http://localhost:3001/api/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
            const user = await response.json();
            
            // Обновляем currentAuthUser
            currentAuthUser = user;
            
            // Обновляем localStorage
            localStorage.setItem('easychoice_user', JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }));
            
            // Обновляем отображение на странице профиля
            const userNameSpan = document.getElementById('profile-user-name');
            if (userNameSpan) {
                userNameSpan.textContent = user.name || user.email.split('@')[0];
            }
            
            const userEmailSpan = document.getElementById('profile-user-email');
            if (userEmailSpan) {
                userEmailSpan.textContent = user.email;
            }
            
            const profileNameInput = document.getElementById('profile-name');
            if (profileNameInput) {
                profileNameInput.value = user.name || '';
            }
            
            const profileEmailInput = document.getElementById('profile-email');
            if (profileEmailInput) {
                profileEmailInput.value = user.email;
            }
            
            // Обновляем кнопку в шапке
            updateAuthButton();
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
    }
    
    // Загружаем дополнительные данные из localStorage
    const savedData = localStorage.getItem('easychoice_user_data');
    if (savedData) {
        try {
            const userData = JSON.parse(savedData);
            const phoneInput = document.getElementById('profile-phone');
            const cityInput = document.getElementById('profile-city');
            const addressInput = document.getElementById('profile-address');
            
            if (phoneInput && userData.phone) phoneInput.value = userData.phone;
            if (cityInput && userData.city) cityInput.value = userData.city;
            if (addressInput && userData.address) addressInput.value = userData.address;
        } catch(e) {}
    }
}
// Сохранение настроек профиля
async function saveProfileSettings(event) {
    event.preventDefault();
    
    const name = document.getElementById('profile-name').value;
    let phone = document.getElementById('profile-phone').value;
    const city = document.getElementById('profile-city').value;
    const address = document.getElementById('profile-address').value;
    
    if (!name) {
        alert('Введите ваше имя');
        return;
    }
    
    if (phone) {
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length !== 11 || !phoneDigits.startsWith('7')) {
            alert('Введите корректный номер телефона в формате +7 (xxx) xxx-xx-xx');
            return;
        }
    }
    
    // Сохраняем дополнительные данные в localStorage
    const userData = {
        name: name,
        phone: phone,
        city: city,
        address: address,
        email: document.getElementById('profile-email').value
    };
    localStorage.setItem('easychoice_user_data', JSON.stringify(userData));
    
    // Отправляем имя на сервер
    const token = localStorage.getItem('easychoice_token');
    if (token) {
        try {
            const response = await fetch('http://localhost:3001/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ name: name })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Обновляем данные пользователя
                if (result.user) {
                    currentAuthUser = result.user;
                    localStorage.setItem('easychoice_user', JSON.stringify(result.user));
                }
                
                // Обновляем отображение на странице
                document.getElementById('profile-user-name').textContent = name;
                document.getElementById('profile-name').value = name;
                
                // Обновляем кнопку в шапке
                updateAuthButton();
                
                alert('Настройки сохранены!');
            } else {
                alert(result.error || 'Ошибка сохранения');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка соединения с сервером');
        }
    } else {
        alert('Настройки сохранены локально');
    }
}
// Смена пароля
async function changePassword(event) {
    event.preventDefault();
    
    const currentPassword = document.getElementById('profile-current-password').value;
    const newPassword = document.getElementById('profile-new-password').value;
    const confirmPassword = document.getElementById('profile-confirm-password').value;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Заполните все поля');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('Новый пароль и подтверждение не совпадают');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('Пароль должен быть минимум 6 символов');
        return;
    }
    
    const token = localStorage.getItem('easychoice_token');
    if (!token) {
        alert('Вы не авторизованы');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:3001/api/user/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                currentPassword: currentPassword,
                newPassword: newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Пароль успешно изменён!');
            document.getElementById('profile-current-password').value = '';
            document.getElementById('profile-new-password').value = '';
            document.getElementById('profile-confirm-password').value = '';
        } else {
            alert(data.error || 'Ошибка смены пароля');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
    }
}

// Открытие страницы личного кабинета
function openProfilePage() {
    showPage('profile-page');
    loadProfileSettings();  // ЭТА СТРОЧКА ДОЛЖНА БЫТЬ
    loadProfileOrders();
    
    document.querySelectorAll('.nav-link').forEach(function(link) {
        link.classList.remove('active');
    });
}

// Вспомогательная функция для статуса
function getOrderStatusText(status) {
    const statuses = {
        'pending': 'В обработке',
        'processing': 'Готовится',
        'shipped': 'Отправлен',
        'delivered': 'Доставлен',
        'cancelled': 'Отменен'
    };
    return statuses[status] || status;
}
