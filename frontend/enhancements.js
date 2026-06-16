// enhancements.js - Полный рабочий файл

// Глобальные переменные
let wishlist = JSON.parse(localStorage.getItem('easychoice_wishlist')) || [];
let compareList = JSON.parse(localStorage.getItem('easychoice_compare')) || [];

window.wishlist = wishlist;
window.compareList = compareList;

function getAllProducts() {
    if (window.products && Array.isArray(window.products) && window.products.length > 0) {
        return window.products;
    }
    return [];
}

function updateWishlistCount() {
    const wishlistCount = document.getElementById('wishlist-count');
    if (wishlistCount) {
        const current = JSON.parse(localStorage.getItem('easychoice_wishlist') || '[]');
        wishlistCount.textContent = '(' + current.length + ')';
    }
}

function updateCompareCount() {
    const compareCount = document.getElementById('compare-count');
    if (compareCount) {
        const current = JSON.parse(localStorage.getItem('easychoice_compare') || '[]');
        compareCount.textContent = '(' + current.length + ')';
    }
}

function getCategoryName(categoryId) {
    const categories = {
        'refrigerators': 'Холодильники',
        'washing_machines': 'Стиральные машины',
        'vacuum_cleaners': 'Пылесосы',
        'microwaves': 'Микроволновки',
        'coffee_machines': 'Кофемашины',
        'multicookers': 'Мультиварки'
    };
    return categories[categoryId] || categoryId || 'Другое';
}

// ========== ИЗБРАННОЕ ==========
function toggleWishlist(productId) {
    const index = wishlist.indexOf(productId);
    if (index === -1) {
        if (wishlist.length >= 20) {
            if (typeof showNotification === 'function') {
                showNotification('Можно добавить не более 20 товаров', 'warning');
            }
            return false;
        }
        wishlist.push(productId);
        if (typeof showNotification === 'function') {
            showNotification('Добавлено в избранное', 'success');
        }
        if (window.api && window.api.getToken()) {
            window.api.addToWishlist(productId);
        }
    } else {
        wishlist.splice(index, 1);
        if (typeof showNotification === 'function') {
            showNotification('Удалено из избранного', 'info');
        }
        if (window.api && window.api.getToken()) {
            window.api.removeFromWishlist(productId);
        }
    }
    localStorage.setItem('easychoice_wishlist', JSON.stringify(wishlist));
    updateWishlistCount();
    
    if (window.api && window.api.getToken()) {
        saveWishlistToServer();
    }
    
    return true;
}

// ========== СРАВНЕНИЕ ==========
function addToCompare(productId) {
    // Проверяем, есть ли уже товар в сравнении
    if (compareList.includes(productId)) {
        if (typeof showNotification === 'function') {
            showNotification('Товар уже в сравнении', 'info');
        }
        return false;
    }
    
    // Проверяем лимит (максимум 8 товаров)
    if (compareList.length >= 8) {
        if (typeof showNotification === 'function') {
            showNotification('Можно добавить не более 8 товаров', 'warning');
        }
        return false;
    }
    
    compareList.push(productId);
    localStorage.setItem('easychoice_compare', JSON.stringify(compareList));
    updateCompareCount();
    
    if (typeof showNotification === 'function') {
        showNotification('Товар добавлен к сравнению', 'success');
    }
    
    // Сохраняем на сервер только если авторизован
    if (window.api && window.api.getToken()) {
        saveCompareToServer();
    }
    
    return true;
}

function removeFromCompare(productId) {
    compareList = compareList.filter(function(id) { return id != productId; });
    localStorage.setItem('easychoice_compare', JSON.stringify(compareList));
    updateCompareCount();
    if (typeof showNotification === 'function') {
        showNotification('Удалено из сравнения', 'info');
    }
    
    if (window.api && window.api.getToken()) {
        saveCompareToServer();
    }
}

function clearCompare() {
    compareList = [];
    localStorage.setItem('easychoice_compare', JSON.stringify(compareList));
    window.compareList = compareList;
    updateCompareCount();
    
    if (typeof showNotification === 'function') {
        showNotification('Сравнение очищено', 'info');
    }
    
    if (window.api && window.api.getToken()) {
        saveCompareToServer();
    }
    
    const comparePage = document.getElementById('compare-page');
    if (comparePage && comparePage.classList.contains('active')) {
        showComparePage();
    }
}

// ========== КНОПКИ НА СТРАНИЦЕ ТОВАРА ==========
function addButtonsToProductPage() {
    const productPage = document.getElementById('product');
    if (!productPage || !productPage.classList.contains('active')) return;
    if (document.querySelector('.product-compare-wishlist')) return;
    
    const addToCartBtn = document.getElementById('product-add-to-cart');
    if (!addToCartBtn) return;
    
    const productId = parseInt(addToCartBtn.dataset.id);
    const productInfo = document.querySelector('.product-header .product-info');
    if (!productInfo) return;
    
    const cartBtn = productInfo.querySelector('.add-to-cart-btn');
    if (!cartBtn) return;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'product-compare-wishlist';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '15px';
    buttonContainer.style.marginTop = '20px';
    buttonContainer.style.flexWrap = 'wrap';
    
    // Кнопка "В избранное"
    const wishlistBtn = document.createElement('button');
    wishlistBtn.className = 'btn-wishlist-product';
    wishlistBtn.style.flex = '1';
    wishlistBtn.style.padding = '14px 20px';
    wishlistBtn.style.borderRadius = '50px';
    wishlistBtn.style.fontSize = '16px';
    wishlistBtn.style.fontWeight = '600';
    wishlistBtn.style.cursor = 'pointer';
    wishlistBtn.style.border = '2px solid #ff4757';
    wishlistBtn.style.backgroundColor = '#fff';
    wishlistBtn.style.color = '#ff4757';
    wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> В избранное';
    
    if (wishlist.includes(productId)) {
        wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> В избранном';
        wishlistBtn.style.backgroundColor = '#ff4757';
        wishlistBtn.style.color = 'white';
    }
    
    wishlistBtn.onclick = function() {
        toggleWishlist(productId);
        if (wishlist.includes(productId)) {
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> В избранном';
            wishlistBtn.style.backgroundColor = '#ff4757';
            wishlistBtn.style.color = 'white';
        } else {
            wishlistBtn.innerHTML = '<i class="fas fa-heart"></i> В избранное';
            wishlistBtn.style.backgroundColor = '#fff';
            wishlistBtn.style.color = '#ff4757';
        }
    };
    
    // Кнопка "Сравнить"
    const compareBtn = document.createElement('button');
    compareBtn.className = 'btn-compare-product';
    compareBtn.style.flex = '1';
    compareBtn.style.padding = '14px 20px';
    compareBtn.style.borderRadius = '50px';
    compareBtn.style.fontSize = '16px';
    compareBtn.style.fontWeight = '600';
    compareBtn.style.cursor = 'pointer';
    compareBtn.style.border = '2px solid #5b8c7e';
    compareBtn.style.backgroundColor = '#fff';
    compareBtn.style.color = '#5b8c7e';
    compareBtn.innerHTML = '<i class="fas fa-chart-line"></i> Сравнить';
    
    if (compareList.includes(productId)) {
        compareBtn.innerHTML = '<i class="fas fa-check"></i> В сравнении';
        compareBtn.style.backgroundColor = '#5b8c7e';
        compareBtn.style.color = 'white';
    }
    
    compareBtn.onclick = function() {
        // Проверяем лимит (максимум 8 товаров)
        if (!compareList.includes(productId) && compareList.length >= 8) {
            if (typeof showNotification === 'function') {
                showNotification('Можно добавить не более 8 товаров', 'error');
            }
            // Меняем цвет кнопки на красный на мгновение
            compareBtn.style.backgroundColor = '#ffebee';
            compareBtn.style.borderColor = '#c62828';
            compareBtn.style.color = '#c62828';
            setTimeout(function() {
                compareBtn.style.backgroundColor = '#fff';
                compareBtn.style.borderColor = '#5b8c7e';
                compareBtn.style.color = '#5b8c7e';
            }, 500);
            return;
        }
        
        if (compareList.includes(productId)) {
            removeFromCompare(productId);
            compareBtn.innerHTML = '<i class="fas fa-chart-line"></i> Сравнить';
            compareBtn.style.backgroundColor = '#fff';
            compareBtn.style.color = '#5b8c7e';
        } else {
            addToCompare(productId);
            compareBtn.innerHTML = '<i class="fas fa-check"></i> В сравнении';
            compareBtn.style.backgroundColor = '#5b8c7e';
            compareBtn.style.color = 'white';
        }
    };
    
    buttonContainer.appendChild(wishlistBtn);
    buttonContainer.appendChild(compareBtn);
    cartBtn.insertAdjacentElement('afterend', buttonContainer);
    
    console.log('Кнопки добавлены на страницу товара');
}

// ========== МЕНЮ ==========
function addMenuLinks() {
    const navUl = document.querySelector('nav ul');
    if (!navUl) return;
    
    const authBtn = navUl.querySelector('#auth-btn-header')?.parentElement;
    
    if (!document.querySelector('#wishlist-nav')) {
        const wishlistLi = document.createElement('li');
        wishlistLi.innerHTML = '<a href="#" id="wishlist-nav" style="cursor:pointer;"><i class="fas fa-heart"></i> Избранное <span id="wishlist-count">(' + wishlist.length + ')</span></a>';
        wishlistLi.querySelector('#wishlist-nav').onclick = function(e) {
            e.preventDefault();
            showWishlistPage();
        };
        if (authBtn) {
            navUl.insertBefore(wishlistLi, authBtn);
        } else {
            navUl.appendChild(wishlistLi);
        }
    }
    
    if (!document.querySelector('#compare-nav')) {
        const compareLi = document.createElement('li');
        compareLi.innerHTML = '<a href="#" id="compare-nav" style="cursor:pointer;"><i class="fas fa-chart-line"></i> Сравнение <span id="compare-count">(' + compareList.length + ')</span></a>';
        compareLi.querySelector('#compare-nav').onclick = function(e) {
            e.preventDefault();
            showComparePage();
        };
        if (authBtn) {
            navUl.insertBefore(compareLi, authBtn);
        } else {
            navUl.appendChild(compareLi);
        }
    }
}

// ========== СТРАНИЦА ИЗБРАННОГО ==========
function createWishlistSection() {
    if (document.getElementById('wishlist-page')) return;
    const main = document.querySelector('main');
    const wishlistSection = document.createElement('section');
    wishlistSection.id = 'wishlist-page';
    wishlistSection.className = 'page';
    wishlistSection.innerHTML = '<div class="wishlist-container" style="max-width: 1200px; margin: 0 auto; padding: 20px;"><h1 class="section-title"><i class="fas fa-heart"></i> Избранное</h1><div id="wishlist-products-container" class="products-grid"></div></div>';
    main.appendChild(wishlistSection);
}

function showWishlistPage() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    createWishlistSection();
    
    document.querySelectorAll('.page').forEach(function(page) {
        page.classList.remove('active');
    });
    document.getElementById('wishlist-page').classList.add('active');
    
    const container = document.getElementById('wishlist-products-container');
    if (!container) return;
    
    async function loadAndRender() {
        let allProducts = window.products;
        
        if (!allProducts || allProducts.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:50px;"><i class="fas fa-spinner fa-spin" style="font-size:48px;"></i><p>Загрузка товаров...</p></div>';
            if (window.api && window.api.loadProducts) {
                allProducts = await window.api.loadProducts();
                if (allProducts && allProducts.length > 0) {
                    window.products = allProducts;
                }
            }
        }
        
        if (!allProducts || allProducts.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:50px;"><p>Не удалось загрузить товары.</p><button onclick="location.reload()">Обновить</button></div>';
            return;
        }
        
        if (wishlist.length === 0) {
            container.innerHTML = '<div class="empty-wishlist" style="text-align:center; padding:60px 20px;"><i class="fas fa-heart" style="font-size:80px;"></i><h3>Избранное пусто</h3><button class="btn-go-to-catalog" onclick="showPage(\'catalog\')">Перейти в каталог</button></div>';
            return;
        }
        
        const wishlistProducts = [];
        for (let i = 0; i < wishlist.length; i++) {
            const product = allProducts.find(function(p) { return p.id == wishlist[i]; });
            if (product) wishlistProducts.push(product);
        }
        
        const formatPriceFn = typeof formatPrice === 'function' ? formatPrice : function(price) { return price.toLocaleString('ru-RU') + ' руб.'; };
        
        container.innerHTML = wishlistProducts.map(function(product) {
            return '<div class="product-card">' +
                '<img src="' + product.image + '" alt="' + product.name + '" onerror="this.src=\'https://via.placeholder.com/300x300?text=No+Image\'">' +
                '<div class="product-info">' +
                    '<div class="product-name">' + product.name + '</div>' +
                    '<div class="product-price">' + formatPriceFn(product.price) + '</div>' +
                    '<button class="btn add-to-cart-wishlist" data-id="' + product.id + '">В корзину</button>' +
                    '<button class="btn btn-outline remove-from-wishlist" data-id="' + product.id + '">Удалить</button>' +
                '</div>' +
            '</div>';
        }).join('');
        
        container.querySelectorAll('.add-to-cart-wishlist').forEach(function(btn) {
            btn.onclick = function() { if (typeof addToCart === 'function') addToCart(parseInt(btn.dataset.id)); };
        });
        
        container.querySelectorAll('.remove-from-wishlist').forEach(function(btn) {
            btn.onclick = function() {
                const id = parseInt(btn.dataset.id);
                toggleWishlist(id);
                showWishlistPage();
            };
        });
    }
    
    loadAndRender();
}

// ========== СТРАНИЦА СРАВНЕНИЯ ==========
function createCompareSection() {
    if (document.getElementById('compare-page')) return;
    const main = document.querySelector('main');
    const compareSection = document.createElement('section');
    compareSection.id = 'compare-page';
    compareSection.className = 'page';
    compareSection.innerHTML = '<div class="compare-container" style="max-width: 1200px; margin: 0 auto; padding: 20px;"><h1 class="section-title"><i class="fas fa-chart-line"></i> Сравнение товаров</h1><div id="compare-products-container"></div></div>';
    main.appendChild(compareSection);
}

function showComparePage() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    createCompareSection();
    
    document.querySelectorAll('.page').forEach(function(page) {
        page.classList.remove('active');
    });
    document.getElementById('compare-page').classList.add('active');
    
    const container = document.getElementById('compare-products-container');
    if (!container) return;
    
    async function loadAndRender() {
        let allProducts = window.products;
        
        if (!allProducts || allProducts.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:50px;"><i class="fas fa-spinner fa-spin" style="font-size:48px;"></i><p>Загрузка товаров...</p></div>';
            if (window.api && window.api.loadProducts) {
                allProducts = await window.api.loadProducts();
                if (allProducts && allProducts.length > 0) {
                    window.products = allProducts;
                }
            }
        }
        
        if (!allProducts || allProducts.length === 0) {
            container.innerHTML = '<div class="empty-compare" style="text-align:center; padding:60px 20px;"><i class="fas fa-chart-line" style="font-size:80px;"></i><h3>Нет товаров для сравнения</h3><button class="btn-go-to-catalog" onclick="showPage(\'catalog\')">Перейти в каталог</button></div>';
            return;
        }
        
        if (compareList.length === 0) {
            container.innerHTML = '<div class="empty-compare" style="text-align:center; padding:60px 20px;"><i class="fas fa-chart-line" style="font-size:80px;"></i><h3>Нет товаров для сравнения</h3><button class="btn-go-to-catalog" onclick="showPage(\'catalog\')">Перейти в каталог</button></div>';
            return;
        }
        
        // Получаем все товары из сравнения
        let compareProducts = [];
        for (let i = 0; i < compareList.length; i++) {
            const product = allProducts.find(function(p) { return p.id == compareList[i]; });
            if (product) compareProducts.push(product);
        }
        
        if (compareProducts.length === 0) {
            container.innerHTML = '<div class="empty-compare" style="text-align:center; padding:60px 20px;"><i class="fas fa-chart-line" style="font-size:80px;"></i><h3>Нет товаров для сравнения</h3><button class="btn-go-to-catalog" onclick="showPage(\'catalog\')">Перейти в каталог</button></div>';
            return;
        }
        
        // Группируем по категориям
        const productsByCategory = {};
        for (let i = 0; i < compareProducts.length; i++) {
            const product = compareProducts[i];
            const catName = getCategoryName(product.category);
            if (!productsByCategory[catName]) {
                productsByCategory[catName] = [];
            }
            productsByCategory[catName].push(product);
        }
        
        const categoryNames = Object.keys(productsByCategory);
        let currentCategory = categoryNames[0];
        
        const savedCategory = localStorage.getItem('easychoice_compare_category');
        if (savedCategory && productsByCategory[savedCategory]) {
            currentCategory = savedCategory;
        }
        
        const displayProducts = productsByCategory[currentCategory] || compareProducts;
        
        const formatPriceFn = typeof formatPrice === 'function' ? formatPrice : function(price) { return price.toLocaleString('ru-RU') + ' руб.'; };
        
        let html = '';
        
        // Блок с категориями и кнопкой очистки в одной строке
        html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; flex-wrap: wrap; gap: 15px;">';
        
        if (categoryNames.length > 1) {
            html += '<div style="display: flex; gap: 10px; flex-wrap: wrap;">';
            for (let i = 0; i < categoryNames.length; i++) {
                const cat = categoryNames[i];
                const isActive = (currentCategory === cat);
                html += '<button class="category-switch-btn" data-category="' + cat + '" style="padding: 8px 20px; border-radius: 30px; border: 2px solid var(--deep-space-blue); background: ' + (isActive ? 'var(--deep-space-blue)' : 'white') + '; color: ' + (isActive ? 'white' : 'var(--deep-space-blue)') + '; cursor: pointer; font-weight: 500; font-size: 14px;">' + cat + ' (' + productsByCategory[cat].length + ')</button>';
            }
            html += '</div>';
        } else {
            html += '<div style="background: var(--eggshell); padding: 8px 20px; border-radius: 30px; font-size: 14px;"><i class="fas fa-tag"></i> ' + currentCategory + ' (' + displayProducts.length + ')</div>';
        }
        
        html += '<button class="btn-clear-compare" style="padding: 8px 20px; background: var(--danger-color); color: white; border: none; border-radius: 30px; cursor: pointer; font-size: 13px; font-weight: 500;"><i class="fas fa-trash-alt"></i> Очистить всё</button>';
        html += '</div>';
        
        // Таблица сравнения
        html += '<div class="compare-table" style="overflow-x: auto; background: white; border-radius: 15px; padding: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">';
        
        // Шапка с товарами
        html += '<div style="display: grid; grid-template-columns: 200px repeat(' + displayProducts.length + ', 1fr); border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">';
        html += '<div style="padding: 15px; font-weight: 700; background: #f5f5f5; border-radius: 10px;">Характеристики</div>';
        for (let i = 0; i < displayProducts.length; i++) {
            html += '<div style="padding: 15px; text-align: center;">' +
                '<img src="' + displayProducts[i].image + '" style="max-width: 100px; max-height: 100px; object-fit: contain;" onerror="this.src=\'https://via.placeholder.com/100x100?text=No+Image\'">' +
                '<h4 style="margin: 10px 0 5px; font-size: 14px;">' + displayProducts[i].name + '</h4>' +
                '<button class="btn-remove-from-compare" data-id="' + displayProducts[i].id + '" style="background: none; border: none; color: var(--danger-color); cursor: pointer; font-size: 12px;"><i class="fas fa-trash"></i> Удалить</button>' +
            '</div>';
        }
        html += '</div>';
        
        // Функция добавления строки
        function addRow(label, getValue) {
            let row = '<div style="display: grid; grid-template-columns: 200px repeat(' + displayProducts.length + ', 1fr); border-bottom: 1px solid #eee;">';
            row += '<div style="padding: 12px; font-weight: 600; background: #fafafa;">' + label + '</div>';
            for (let i = 0; i < displayProducts.length; i++) {
                row += '<div style="padding: 12px; text-align: center;">' + getValue(displayProducts[i]) + '</div>';
            }
            row += '</div>';
            return row;
        }
        
        html += addRow('Категория', function(p) { return getCategoryName(p.category); });
        html += addRow('Цена', function(p) { return '<span style="font-weight:700; color:var(--price-color);">' + formatPriceFn(p.price) + '</span>'; });
        html += addRow('Бренд', function(p) { return p.brand || '—'; });
        html += addRow('Год выпуска', function(p) { return p.year || '—'; });
        html += addRow('Характеристики', function(p) { 
    if (!p.specs || p.specs === '—') return '—';
    // Разбиваем по символу | и выводим каждую характеристику с новой строки
    const lines = p.specs.split('|');
    let formatted = '<div style="text-align: left; line-height: 1.5;">';
    for (let i = 0; i < lines.length; i++) {
        formatted += lines[i].trim() + '<br>';
    }
    formatted += '</div>';
    return formatted;
});
        
        html += '<div style="display: grid; grid-template-columns: 200px repeat(' + displayProducts.length + ', 1fr);">';
        html += '<div style="padding: 12px; font-weight: 600; background: #fafafa; border-radius: 0 0 0 12px;">Действия</div>';
        for (let i = 0; i < displayProducts.length; i++) {
            html += '<div style="padding: 12px; text-align: center;">' +
                '<button class="btn compare-add-to-cart" data-id="' + displayProducts[i].id + '" style="background: var(--deep-space-blue); color: white; border: none; padding: 6px 12px; border-radius: 20px; cursor: pointer; font-size: 12px;">В корзину</button>' +
            '</div>';
        }
        html += '</div>';
        
        html += '</div>';
        
        container.innerHTML = html;
        
        // Обработчики категорий
        container.querySelectorAll('.category-switch-btn').forEach(function(btn) {
            btn.onclick = function() {
                localStorage.setItem('easychoice_compare_category', btn.dataset.category);
                showComparePage();
            };
        });
        
        // Обработчики удаления
        container.querySelectorAll('.btn-remove-from-compare').forEach(function(btn) {
            btn.onclick = function() {
                const id = parseInt(btn.dataset.id);
                removeFromCompare(id);
                showComparePage();
            };
        });
        
        // Обработчики добавления в корзину
        container.querySelectorAll('.compare-add-to-cart').forEach(function(btn) {
            btn.onclick = function() {
                if (typeof addToCart === 'function') {
                    addToCart(parseInt(btn.dataset.id));
                }
            };
        });
        
        // Обработчик кнопки "Очистить всё"
        const clearBtn = container.querySelector('.btn-clear-compare');
        if (clearBtn) {
            clearBtn.onclick = function() {
                if (confirm('Очистить весь список сравнения?')) {
                    clearCompare();
                    showComparePage();
                }
            };
        }
    }
    
    loadAndRender();
}

// ========== СИНХРОНИЗАЦИЯ С СЕРВЕРОМ ==========
async function loadWishlistFromServer() {
    if (!window.api || !window.api.getToken()) return;
    try {
        const serverWishlist = await window.api.loadWishlist();
        if (serverWishlist) {
            wishlist = serverWishlist;
            localStorage.setItem('easychoice_wishlist', JSON.stringify(wishlist));
            window.wishlist = wishlist;
            updateWishlistCount();
            console.log('Избранное загружено с сервера:', wishlist.length);
        }
    } catch (error) {
        console.error('Ошибка загрузки избранного:', error);
    }
}

async function loadCompareFromServer() {
    if (!window.api || !window.api.getToken()) return;
    try {
        const serverCompare = await window.api.loadCompare();
        if (serverCompare) {
            compareList = serverCompare;
            localStorage.setItem('easychoice_compare', JSON.stringify(compareList));
            window.compareList = compareList;
            updateCompareCount();
            console.log('Сравнение загружено с сервера:', compareList.length);
        }
    } catch (error) {
        console.error('Ошибка загрузки сравнения:', error);
    }
}

async function loadCartFromServer() {
    if (!window.api || !window.api.getToken()) return;
    try {
        const serverCart = await window.api.loadCart();
        if (serverCart) {
            cartItems = serverCart;
            localStorage.setItem('easychoice_cart', JSON.stringify(cartItems));
            window.cartItems = cartItems;
            if (typeof updateCartCount === 'function') updateCartCount();
            if (typeof renderCartItems === 'function') renderCartItems();
            if (typeof updateCartSummary === 'function') updateCartSummary();
            console.log('Корзина загружена с сервера:', cartItems.length);
        }
    } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
    }
}

async function saveWishlistToServer() {
    if (!window.api || !window.api.getToken()) return;
    try {
        const wishlistData = JSON.parse(localStorage.getItem('easychoice_wishlist') || '[]');
        const serverWishlist = await window.api.loadWishlist();
        for (const id of wishlistData) {
            if (!serverWishlist.includes(id)) {
                await window.api.addToWishlist(id);
            }
        }
        for (const id of serverWishlist) {
            if (!wishlistData.includes(id)) {
                await window.api.removeFromWishlist(id);
            }
        }
        console.log('Избранное сохранено на сервер');
    } catch (error) {
        console.error('Ошибка сохранения избранного:', error);
    }
}

async function saveCompareToServer() {
    if (!window.api || !window.api.getToken()) return;
    try {
        const compareData = JSON.parse(localStorage.getItem('easychoice_compare') || '[]');
        const serverCompare = await window.api.loadCompare();
        for (const id of compareData) {
            if (!serverCompare.includes(id)) {
                await window.api.addToCompare(id);
            }
        }
        for (const id of serverCompare) {
            if (!compareData.includes(id)) {
                await window.api.removeFromCompare(id);
            }
        }
        console.log('Сравнение сохранено на сервер');
    } catch (error) {
        console.error('Ошибка сохранения сравнения:', error);
    }
}

async function saveCartToServer() {
    if (!window.api || !window.api.getToken()) return;
    try {
        const cartData = JSON.parse(localStorage.getItem('easychoice_cart') || '[]');
        const serverCart = await window.api.loadCart();
        const serverMap = new Map(serverCart.map(function(i) { return [i.id, i.quantity]; }));
        for (const item of cartData) {
            if (serverMap.has(item.id)) {
                if (serverMap.get(item.id) !== item.quantity) {
                    await window.api.updateCartQuantity(item.id, item.quantity);
                }
            } else {
                await window.api.addToCart(item.id, item.quantity);
            }
        }
        for (const item of serverCart) {
            const exists = cartData.some(function(localItem) { return localItem.id === item.id; });
            if (!exists) {
                await window.api.removeFromCart(item.id);
            }
        }
        console.log('Корзина сохранена на сервер');
    } catch (error) {
        console.error('Ошибка сохранения корзины:', error);
    }
}

function clearLocalData() {
    wishlist = [];
    localStorage.setItem('easychoice_wishlist', JSON.stringify([]));
    window.wishlist = [];
    updateWishlistCount();
    
    compareList = [];
    localStorage.setItem('easychoice_compare', JSON.stringify([]));
    window.compareList = [];
    updateCompareCount();
    
    if (typeof cartItems !== 'undefined') {
        cartItems = [];
        localStorage.setItem('easychoice_cart', JSON.stringify([]));
        window.cartItems = [];
        updateCartCount();
        if (typeof renderCartItems === 'function') renderCartItems();
        if (typeof updateCartSummary === 'function') updateCartSummary();
    }
    console.log('Локальные данные очищены');
}

async function syncAllWithServer() {
    console.log('Синхронизация с сервером...');
    clearLocalData();
    await loadWishlistFromServer();
    await loadCompareFromServer();
    await loadCartFromServer();
    if (typeof renderCartItems === 'function') renderCartItems();
    if (typeof updateCartSummary === 'function') updateCartSummary();
    console.log('Синхронизация завершена');
}

async function saveAllToServer() {
    if (!window.api || !window.api.getToken()) return;
    await saveWishlistToServer();
    await saveCompareToServer();
    await saveCartToServer();
}

window.syncAllWithServer = syncAllWithServer;
window.saveAllToServer = saveAllToServer;
window.saveWishlistToServer = saveWishlistToServer;
window.saveCompareToServer = saveCompareToServer;
window.saveCartToServer = saveCartToServer;
window.clearLocalData = clearLocalData;

// ========== ЭКСПОРТ ЗАКАЗОВ ==========
async function exportOrdersToCSV() {
    if (!isAdmin()) {
        if (typeof showNotification === 'function') {
            showNotification('Доступ только для администратора', 'error');
        }
        return;
    }
    
    try {
        const token = localStorage.getItem('easychoice_token');
        const response = await fetch('http://localhost:3001/api/admin/orders', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const orders = await response.json();
        
        const headers = ['Номер заказа', 'Клиент', 'Email', 'Телефон', 'Сумма', 'Статус', 'Дата'];
        const csvRows = [headers.join(',')];
        
        orders.forEach(function(order) {
            const row = [
                '"' + (order.order_number || order.id) + '"',
                '"' + (order.customer_name || '') + '"',
                '"' + (order.user_email || '') + '"',
                '"' + (order.customer_phone || '') + '"',
                order.total_price || 0,
                order.status || 'pending',
                '"' + new Date(order.created_at).toLocaleDateString() + '"'
            ];
            csvRows.push(row.join(','));
        });
        
        const csv = csvRows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'orders_' + new Date().toISOString().split('T')[0] + '.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (typeof showNotification === 'function') {
            showNotification('Экспортировано ' + orders.length + ' заказов', 'success');
        }
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        if (typeof showNotification === 'function') {
            showNotification('Ошибка экспорта заказов', 'error');
        }
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
function initEnhancements() {
    console.log('Инициализация улучшений...');
    
    wishlist = JSON.parse(localStorage.getItem('easychoice_wishlist')) || [];
    compareList = JSON.parse(localStorage.getItem('easychoice_compare')) || [];
    window.wishlist = wishlist;
    window.compareList = compareList;
    
    updateWishlistCount();
    updateCompareCount();
    createWishlistSection();
    createCompareSection();
    addMenuLinks();
    
    setTimeout(function() {
        const adminMenu = document.getElementById('admin-menu');
        if (adminMenu && !document.getElementById('admin-export-orders')) {
            const exportBtn = document.createElement('button');
            exportBtn.id = 'admin-export-orders';
            exportBtn.className = 'admin-menu-item';
            exportBtn.innerHTML = '<i class="fas fa-download"></i> Экспорт заказов (CSV)';
            exportBtn.onclick = exportOrdersToCSV;
            const menuContent = adminMenu.querySelector('.admin-menu-content');
            if (menuContent) menuContent.appendChild(exportBtn);
        }
    }, 1000);
    
    const observer = new MutationObserver(function() {
        const productPage = document.getElementById('product');
        if (productPage && productPage.classList.contains('active')) {
            setTimeout(addButtonsToProductPage, 100);
        }
    });
    
    observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
    });
    
    if (document.getElementById('product')?.classList.contains('active')) {
        setTimeout(addButtonsToProductPage, 100);
    }
    
    console.log('Все улучшения инициализированы');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancements);
} else {
    initEnhancements();
}