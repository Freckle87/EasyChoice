// admin.js - Админ панель для PostgreSQL

// Список email админов (для дополнительной проверки)
const ADMIN_EMAILS = ["admin@easychoice.ru"];

// Проверка, является ли пользователь администратором
function isAdmin() {
    const token = localStorage.getItem('easychoice_token');
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.role === 'admin';
    } catch(e) {
        return false;
    }
}

// Показать/скрыть админ панель
function toggleAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.style.display = isAdmin() ? 'block' : 'none';
    }
}

// Переключение меню админки
function toggleAdminMenu() {
    const menu = document.getElementById('admin-menu');
    if (menu) {
        menu.classList.toggle('show');
    }
}

// Закрыть все модальные окна админки
function closeAllAdminModals() {
    const modals = ['admin-product-modal', 'admin-orders-modal', 'admin-products-modal'];
    modals.forEach(function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'none';
    });
}

// ========== ДОБАВЛЕНИЕ/РЕДАКТИРОВАНИЕ ТОВАРА ==========
window.addProductManually = async function(productData, editId = null) {
    console.log("Сохранение товара...", productData);
    
    const token = localStorage.getItem('easychoice_token');
    if (!token) {
        showNotif("Сначала войдите в аккаунт!", 'error');
        return null;
    }
    
    if (!isAdmin()) {
        showNotif("Нет прав администратора!", 'error');
        return null;
    }
    
    try {
        // ВАЖНО: НЕ передаём id! Пусть БД сама генерирует
        const product = {
            name: productData.name,
            brand: productData.brand,
            category: productData.category,
            price: parseInt(productData.price),
            image: productData.image,
            specs: productData.specs || 'Характеристики не указаны',
            energyClass: productData.energyClass || 'A+',
            year: parseInt(productData.year) || 2024,
            popularity: parseInt(productData.popularity) || 50
        };
        
        let url = 'http://localhost:3001/api/products';
        let method = 'POST';
        
        if (editId) {
            url = `http://localhost:3001/api/products/${editId}`;
            method = 'PUT';
        }
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(product)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotif(`Товар "${product.name}" ${editId ? 'обновлен' : 'добавлен'}!`, 'success');
            if (typeof refreshAllPages === 'function') refreshAllPages();
            closeAllAdminModals();
            return result;
        } else {
            showNotif(result.error || 'Ошибка сервера', 'error');
            return null;
        }
    } catch (error) {
        console.error("Ошибка:", error);
        showNotif("Ошибка: " + error.message, 'error');
        return null;
    }
};

// ========== РЕДАКТИРОВАНИЕ ТОВАРА ==========
async function editProduct(productId) {
    try {
        const product = products.find(function(p) { return p.id == productId; });
        if (!product) {
            showNotif('Товар не найден', 'error');
            return;
        }
        
        document.getElementById('admin-product-title').textContent = 'Редактировать товар';
        document.getElementById('admin-product-name').value = product.name || '';
        document.getElementById('admin-product-brand').value = product.brand || '';
        document.getElementById('admin-product-category').value = product.category || '';
        document.getElementById('admin-product-price').value = product.price || '';
        document.getElementById('admin-product-image').value = product.image || '';
        document.getElementById('admin-product-specs').value = product.specs || '';
        document.getElementById('admin-product-energy').value = product.energyClass || 'A+';
        document.getElementById('admin-product-popularity').value = product.popularity || 50;
        document.getElementById('admin-product-year').value = product.year || 2024;
        
        const form = document.getElementById('admin-product-form');
        form.setAttribute('data-edit-id', productId);
        
        const productsModal = document.getElementById('admin-products-modal');
        if (productsModal) productsModal.style.display = 'none';
        
        const editModal = document.getElementById('admin-product-modal');
        if (editModal) editModal.style.display = 'block';
        
    } catch (error) {
        console.error("Ошибка загрузки товара:", error);
        showNotif('Ошибка загрузки товара', 'error');
    }
}

// ========== УДАЛЕНИЕ ТОВАРА ==========
async function deleteProduct(productId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    try {
        const token = localStorage.getItem('easychoice_token');
        const response = await fetch('http://localhost:3001/api/products/' + productId, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (response.ok) {
            const index = products.findIndex(function(p) { return p.id == productId; });
            if (index !== -1) products.splice(index, 1);
            
            showNotif('Товар удален', 'success');
            
            const productsModal = document.getElementById('admin-products-modal');
            if (productsModal && productsModal.style.display === 'block') {
                await showProductsManagement();
            }
            
            if (typeof refreshAllPages === 'function') {
                refreshAllPages();
            }
        } else {
            const error = await response.json();
            showNotif(error.error || 'Ошибка удаления товара', 'error');
        }
    } catch (error) {
        console.error("Ошибка удаления:", error);
        showNotif('Ошибка удаления товара', 'error');
    }
}

// ========== ПОКАЗАТЬ СПИСОК ТОВАРОВ ==========
async function showProductsManagement() {
    const adminMenu = document.getElementById('admin-menu');
    if (adminMenu) adminMenu.classList.remove('show');
    
    const modal = document.getElementById('admin-products-modal');
    const container = document.getElementById('admin-products-list');
    
    if (!modal || !container) return;
    
    container.innerHTML = '<p>Загрузка...</p>';
    modal.style.display = 'block';
    
    try {
        const allProducts = products.length > 0 ? products : await window.api.loadProducts();
        
        if (allProducts.length === 0) {
            container.innerHTML = '<p>Нет товаров</p>';
            return;
        }
        
        container.innerHTML = allProducts.map(function(product) {
            return '<div class="admin-product-item" data-id="' + product.id + '">' +
                '<div class="admin-product-info">' +
                    '<div class="admin-product-name">' + product.name + '</div>' +
                    '<div class="admin-product-price">' + (product.price ? product.price.toLocaleString() : '0') + ' руб. | ' + (product.brand || '') + ' | ' + (product.category || '') + '</div>' +
                '</div>' +
                '<div class="admin-product-actions">' +
                    '<button class="admin-edit-btn" data-id="' + product.id + '">Редактировать</button>' +
                    '<button class="admin-delete-btn" data-id="' + product.id + '">Удалить</button>' +
                '</div>' +
            '</div>';
        }).join('');
        
        document.querySelectorAll('.admin-edit-btn').forEach(function(btn) {
            btn.addEventListener('click', function() { editProduct(btn.dataset.id); });
        });
        
        document.querySelectorAll('.admin-delete-btn').forEach(function(btn) {
            btn.addEventListener('click', function() { deleteProduct(btn.dataset.id); });
        });
        
    } catch (error) {
        console.error("Ошибка загрузки:", error);
        container.innerHTML = '<p>Ошибка загрузки товаров</p>';
    }
}

// ========== ПОКАЗАТЬ СПИСОК ЗАКАЗОВ ==========
async function showOrdersManagement() {
    const adminMenu = document.getElementById('admin-menu');
    if (adminMenu) adminMenu.classList.remove('show');
    
    const modal = document.getElementById('admin-orders-modal');
    const container = document.getElementById('admin-orders-list');
    
    if (!modal || !container) return;
    
    container.innerHTML = '<p>Загрузка...</p>';
    modal.style.display = 'block';
    
    try {
        const token = localStorage.getItem('easychoice_token');
        const response = await fetch('http://localhost:3001/api/admin/orders', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const orders = await response.json();
        
        if (orders.length === 0) {
            container.innerHTML = '<p>Нет заказов</p>';
            return;
        }
        
        container.innerHTML = orders.map(function(order) {
            return '<div class="admin-order-item">' +
                '<div class="admin-order-info">' +
                    '<div><strong>Заказ #' + (order.order_number || order.id) + '</strong></div>' +
                    '<div>Клиент: ' + (order.customer_name || order.user_email || 'Не указан') + '</div>' +
                    '<div>Сумма: ' + (order.total_price || 0).toLocaleString() + ' руб.</div>' +
                    '<div>Дата: ' + new Date(order.created_at).toLocaleDateString() + '</div>' +
                '</div>' +
                '<div class="admin-order-actions">' +
                    '<select class="status-select" data-id="' + order.id + '">' +
                        '<option value="pending" ' + (order.status === 'pending' ? 'selected' : '') + '>В обработке</option>' +
                        '<option value="processing" ' + (order.status === 'processing' ? 'selected' : '') + '>Готовится</option>' +
                        '<option value="shipped" ' + (order.status === 'shipped' ? 'selected' : '') + '>Отправлен</option>' +
                        '<option value="delivered" ' + (order.status === 'delivered' ? 'selected' : '') + '>Доставлен</option>' +
                        '<option value="cancelled" ' + (order.status === 'cancelled' ? 'selected' : '') + '>Отменен</option>' +
                    '</select>' +
                '</div>' +
            '</div>';
        }).join('');
        
        document.querySelectorAll('.status-select').forEach(function(select) {
            select.addEventListener('change', async function() {
                const token = localStorage.getItem('easychoice_token');
                await fetch('http://localhost:3001/api/admin/orders/' + select.dataset.id + '/status', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ status: select.value })
                });
                showNotif('Статус заказа обновлен', 'success');
            });
        });
        
    } catch (error) {
        console.error("Ошибка загрузки заказов:", error);
        container.innerHTML = '<p>Ошибка загрузки заказов</p>';
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function initAdminPanel() {
    console.log('Admin panel initializing...');
    
    toggleAdminPanel();
    
    const fab = document.getElementById('admin-fab');
    if (fab) {
        fab.addEventListener('click', toggleAdminMenu);
    }
    
    document.addEventListener('click', function(event) {
        const adminMenu = document.getElementById('admin-menu');
        const fabBtn = document.getElementById('admin-fab');
        
        if (adminMenu && adminMenu.classList.contains('show')) {
            if (!adminMenu.contains(event.target) && !fabBtn.contains(event.target)) {
                adminMenu.classList.remove('show');
            }
        }
    });
    
    const addProductBtn = document.getElementById('admin-add-product');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            const adminMenu = document.getElementById('admin-menu');
            if (adminMenu) adminMenu.classList.remove('show');
            
            document.getElementById('admin-product-form').reset();
            document.getElementById('admin-product-form').removeAttribute('data-edit-id');
            document.getElementById('admin-product-title').textContent = 'Добавить товар';
            document.getElementById('admin-product-modal').style.display = 'block';
        });
    }
    
    const editProductsBtn = document.getElementById('admin-edit-products');
    if (editProductsBtn) {
        editProductsBtn.addEventListener('click', function() {
            showProductsManagement();
        });
    }
    
    const ordersBtn = document.getElementById('admin-orders');
    if (ordersBtn) {
        ordersBtn.addEventListener('click', function() {
            showOrdersManagement();
        });
    }
}

function showNotif(message, type) {
    const notification = document.getElementById('notification');
    if (notification) {
        const msgSpan = document.getElementById('notification-message');
        if (msgSpan) msgSpan.textContent = message;
        notification.className = 'notification';
        if (type === 'error') notification.classList.add('error');
        notification.classList.add('show');
        setTimeout(function() {
            notification.classList.remove('show');
        }, 3000);
    } else {
        alert(message);
    }
}

// Закрытие модальных окон
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('admin-modal-close') || 
        event.target.classList.contains('admin-orders-close') || 
        event.target.classList.contains('admin-products-close')) {
        closeAllAdminModals();
    }
    
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});

document.querySelectorAll('.admin-modal-close').forEach(function(btn) {
    btn.addEventListener('click', function() { closeAllAdminModals(); });
});

// Форма добавления/редактирования товара
const productForm = document.getElementById('admin-product-form');
if (productForm) {
    productForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('admin-product-name')?.value,
            brand: document.getElementById('admin-product-brand')?.value,
            category: document.getElementById('admin-product-category')?.value,
            price: parseInt(document.getElementById('admin-product-price')?.value),
            image: document.getElementById('admin-product-image')?.value,
            specs: document.getElementById('admin-product-specs')?.value,
            energyClass: document.getElementById('admin-product-energy')?.value,
            popularity: parseInt(document.getElementById('admin-product-popularity')?.value),
            year: parseInt(document.getElementById('admin-product-year')?.value)
        };
        
        if (!productData.name || !productData.brand || !productData.category || !productData.price) {
            showNotif('Заполните все обязательные поля!', 'error');
            return;
        }
        
        const editId = e.target.getAttribute('data-edit-id');
        await window.addProductManually(productData, editId);
    });
}

// Запуск
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPanel);
} else {
    initAdminPanel();
}

window.toggleAdminPanel = toggleAdminPanel;
// ========== ДИНАМИЧЕСКИЕ ПОЛЯ ДЛЯ ХАРАКТЕРИСТИК ==========

// Шаблоны полей для каждой категории
const categorySpecsTemplates = {
    refrigerators: [
        { name: 'размораживание', label: 'Размораживание', type: 'select', options: ['No Frost', 'Total No Frost', 'Капельная', 'Ручное'] },
        { name: 'полезный_объем', label: 'Общий полезный объем (л)', type: 'number' },
        { name: 'объем_холодильной', label: 'Объем холодильной камеры (л)', type: 'number' },
        { name: 'объем_морозильной', label: 'Объем морозильной камеры (л)', type: 'number' },
        { name: 'инверторный_компрессор', label: 'Инверторный компрессор', type: 'select', options: ['Да', 'Нет'] },
        { name: 'уровень_шума', label: 'Уровень шума (дБ)', type: 'number' },
        { name: 'габариты', label: 'Габариты (ШхГхВ см)', type: 'text', placeholder: '60x70x185' },
        { name: 'энергокласс', label: 'Энергокласс', type: 'select', options: ['A+++', 'A++', 'A+', 'A', 'B'] }
    ],
    washing_machines: [
        { name: 'загрузка', label: 'Загрузка белья (кг)', type: 'number' },
        { name: 'отжим', label: 'Отжим (об/мин)', type: 'select', options: ['800', '1000', '1200', '1400', '1600'] },
        { name: 'количество_программ', label: 'Количество программ', type: 'number' },
        { name: 'габариты', label: 'Габариты (ШхГхВ см)', type: 'text', placeholder: '60x45x85' },
        { name: 'инверторный_двигатель', label: 'Инверторный двигатель', type: 'select', options: ['Да', 'Нет'] },
        { name: 'прямой_привод', label: 'Прямой привод', type: 'select', options: ['Да', 'Нет'] },
        { name: 'энергокласс', label: 'Энергокласс', type: 'select', options: ['A+++', 'A++', 'A+', 'A'] }
    ],
    vacuum_cleaners: [
        { name: 'мощность', label: 'Мощность (Вт)', type: 'number' },
        { name: 'мощность_всасывания', label: 'Мощность всасывания (Вт)', type: 'number' },
        { name: 'емкость_пылесборника', label: 'Емкость пылесборника (л)', type: 'number', step: '0.1' },
        { name: 'тип_уборки', label: 'Тип уборки', type: 'select', options: ['Сухая', 'Влажная', 'Сухая/Влажная'] },
        { name: 'фильтрация', label: 'Тип фильтрации', type: 'text', placeholder: 'HEPA, Циклонная' }
    ],
    microwaves: [
        { name: 'мощность_микроволн', label: 'Мощность микроволн (Вт)', type: 'number' },
        { name: 'внутренний_объем', label: 'Внутренний объем (л)', type: 'number' },
        { name: 'внутреннее_покрытие', label: 'Внутреннее покрытие', type: 'select', options: ['Эмаль', 'Керамика', 'Биокерамика', 'Нержавеющая сталь'] },
        { name: 'вид_управления', label: 'Тип управления', type: 'select', options: ['Механическое', 'Электронное', 'Сенсорное'] },
        { name: 'гриль', label: 'Гриль', type: 'select', options: ['Да', 'Нет'] }
    ],
    coffee_machines: [
        { name: 'мощность', label: 'Мощность (Вт)', type: 'number' },
        { name: 'давление', label: 'Давление (бар)', type: 'number' },
        { name: 'объем_бака', label: 'Объем бака для воды (л)', type: 'number', step: '0.1' },
        { name: 'используемый_кофе', label: 'Используемый кофе', type: 'select', options: ['Зерновой', 'Молотый', 'Капсульный'] },
        { name: 'капучинатор', label: 'Капучинатор', type: 'select', options: ['Автоматический', 'Ручной', 'Нет'] }
    ],
    multicookers: [
        { name: 'мощность', label: 'Мощность (Вт)', type: 'number' },
        { name: 'объем_чаши', label: 'Объем чаши (л)', type: 'number' },
        { name: 'покрытие', label: 'Покрытие чаши', type: 'select', options: ['Тефлон', 'Керамика', 'Мрамор'] },
        { name: 'режимы', label: 'Количество режимов', type: 'number' },
        { name: 'скороварка', label: 'Скороварка', type: 'select', options: ['Да', 'Нет'] }
    ]
};

function renderDynamicSpecs(category) {
    const container = document.getElementById('dynamic-specs-container');
    if (!container) return;
    
    if (!category || !categorySpecsTemplates[category]) {
        container.innerHTML = '';
        return;
    }
    
    const specs = categorySpecsTemplates[category];
    let html = '<div class="specs-section"><h3>Характеристики</h3>';
    
    for (const spec of specs) {
        if (spec.type === 'select') {
            let optionsHtml = '<option value="">Выберите значение</option>';
            for (const opt of spec.options) {
                optionsHtml += `<option value="${opt}">${opt}</option>`;
            }
            html += `<div class="form-group"><label>${spec.label}</label><select id="admin-spec-${spec.name}" class="form-input">${optionsHtml}</select></div>`;
        } else if (spec.type === 'number') {
            html += `<div class="form-group"><label>${spec.label}</label><input type="number" id="admin-spec-${spec.name}" class="form-input" step="${spec.step || 1}"></div>`;
        } else {
            html += `<div class="form-group"><label>${spec.label}</label><input type="text" id="admin-spec-${spec.name}" class="form-input" placeholder="${spec.placeholder || ''}"></div>`;
        }
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Заполнение динамических полей при редактировании
function fillDynamicSpecs(product) {
    if (!product.category) return;
    
    const specs = categorySpecsTemplates[product.category];
    if (!specs) return;
    
    for (const spec of specs) {
        const field = document.getElementById(`admin-spec-${spec.name}`);
        if (field && product[spec.name]) {
            field.value = product[spec.name];
        }
    }
}

// Сбор данных из динамических полей
function collectDynamicSpecs(category) {
    const specs = categorySpecsTemplates[category];
    if (!specs) return {};
    
    const data = {};
    for (const spec of specs) {
        const field = document.getElementById(`admin-spec-${spec.name}`);
        if (field && field.value) {
            data[spec.name] = spec.type === 'number' ? parseFloat(field.value) : field.value;
        }
    }
    return data;
}

// Обновление краткого описания (specs) из заполненных полей
function buildSpecsString(category, dynamicData) {
    const specsTemplates = {
        refrigerators: (d) => `Общий полезный объем: ${d.полезный_объем || '?'} л | Объем холодильной камеры: ${d.объем_холодильной || '?'} л | Объем морозильной камеры: ${d.объем_морозильной || '?'} л | Размораживание: ${d.размораживание || '?'} | Инверторный компрессор: ${d.инверторный_компрессор || '?'} | Уровень шума: ${d.уровень_шума || '?'} дБ | Габариты: ${d.габариты || '?'} см | Класс энергопотребления: ${d.энергокласс || '?'}`,
        washing_machines: (d) => `Загрузка: ${d.загрузка || '?'} кг | Отжим: ${d.отжим || '?'} об/мин | Количество программ: ${d.количество_программ || '?'} | Габариты: ${d.габариты || '?'} см | Инверторный двигатель: ${d.инверторный_двигатель || '?'} | Прямой привод: ${d.прямой_привод || '?'} | Класс энергопотребления: ${d.энергокласс || '?'}`,
        vacuum_cleaners: (d) => `Мощность: ${d.мощность || '?'} Вт | Мощность всасывания: ${d.мощность_всасывания || '?'} Вт | Емкость пылесборника: ${d.емкость_пылесборника || '?'} л | Тип уборки: ${d.тип_уборки || '?'} | Фильтрация: ${d.фильтрация || '?'}`,
        microwaves: (d) => `Мощность микроволн: ${d.мощность_микроволн || '?'} Вт | Внутренний объем: ${d.внутренний_объем || '?'} л | Внутреннее покрытие: ${d.внутреннее_покрытие || '?'} | Управление: ${d.вид_управления || '?'} | Гриль: ${d.гриль || 'Нет'}`,
        coffee_machines: (d) => `Мощность: ${d.мощность || '?'} Вт | Давление: ${d.давление || '?'} бар | Объем бака для воды: ${d.объем_бака || '?'} л | Используемый кофе: ${d.используемый_кофе || '?'} | Капучинатор: ${d.капучинатор || '?'}`,
        multicookers: (d) => `Мощность: ${d.мощность || '?'} Вт | Объем чаши: ${d.объем_чаши || '?'} л | Покрытие чаши: ${d.покрытие || '?'} | Режимов: ${d.режимы || '?'} | Скороварка: ${d.скороварка || 'Нет'}`
    };
    
    const builder = specsTemplates[category];
    return builder ? builder(dynamicData) : '';
}

// Обновляем обработчик изменения категории
const categorySelect = document.getElementById('admin-product-category');
if (categorySelect) {
    categorySelect.addEventListener('change', function() {
        renderDynamicSpecs(this.value);
    });
}

// Переопределяем функцию addProductManually для работы с новыми полями
const originalAddProductManually = window.addProductManually;
window.addProductManually = async function(productData, editId = null) {
    const category = productData.category;
    const dynamicData = collectDynamicSpecs(category);
    const specsString = buildSpecsString(category, dynamicData);
    
    const fullProductData = {
        ...productData,
        specs: specsString || productData.specs,
        ...dynamicData
    };
    
    return originalAddProductManually(fullProductData, editId);
};

// Обновляем функцию editProduct для заполнения динамических полей
const originalEditProduct = editProduct;
window.editProduct = async function(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) {
        showNotif('Товар не найден', 'error');
        return;
    }
    
    // Заполняем общие поля
    document.getElementById('admin-product-title').textContent = 'Редактировать товар';
    document.getElementById('admin-product-name').value = product.name || '';
    document.getElementById('admin-product-brand').value = product.brand || '';
    document.getElementById('admin-product-category').value = product.category || '';
    document.getElementById('admin-product-price').value = product.price || '';
    document.getElementById('admin-product-image').value = product.image || '';
    document.getElementById('admin-product-year').value = product.year || 2024;
    document.getElementById('admin-product-popularity').value = product.popularity || 50;
    
    // Рендерим динамические поля для категории
    renderDynamicSpecs(product.category);
    
    // Заполняем динамические поля
    setTimeout(() => {
        fillDynamicSpecs(product);
    }, 50);
    
    // Сохраняем ID товара в data-атрибуте формы
    const form = document.getElementById('admin-product-form');
    form.setAttribute('data-edit-id', productId);
    
    // Закрываем окно управления товарами и открываем окно редактирования
    const productsModal = document.getElementById('admin-products-modal');
    if (productsModal) productsModal.style.display = 'none';
    
    const editModal = document.getElementById('admin-product-modal');
    if (editModal) editModal.style.display = 'block';
};