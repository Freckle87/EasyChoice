// script.js - Адаптирован для PostgreSQL бэкенда

// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let products = [];
let cartItems = JSON.parse(localStorage.getItem('easychoice_cart')) || [];
let checkoutItems = [];
window.products = products;
// ========== ЗАГРУЗКА ТОВАРОВ ИЗ БЭКЕНДА ==========
async function loadProductsFromBackend() {
    try {
        const data = await window.api.loadProducts();
        if (data && data.length > 0) {
            products = data;
            console.log('Загружено товаров из PostgreSQL:', products.length);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        return false;
    }
}

// ========== ДАННЫЕ БРЕНДОВ И КАТЕГОРИЙ ==========
const popularBrands = [
    { id: 'samsung', name: 'Samsung', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Samsung_wordmark.svg/3840px-Samsung_wordmark.svg.png' },
    { id: 'lg', name: 'LG', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/LG_Electronics_Logo_%28modern%29.svg/3840px-LG_Electronics_Logo_%28modern%29.svg.png' },
    { id: 'bosch', name: 'Bosch', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Bosch-logo.svg/3840px-Bosch-logo.svg.png' }
];

const allBrands = [
    { id: 'samsung', name: 'Samsung', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Samsung_wordmark.svg/3840px-Samsung_wordmark.svg.png' },
    { id: 'lg', name: 'LG', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/LG_Electronics_Logo_%28modern%29.svg/3840px-LG_Electronics_Logo_%28modern%29.svg.png' },
    { id: 'bosch', name: 'Bosch', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Bosch-logo.svg/3840px-Bosch-logo.svg.png' },
    { id: 'dyson', name: 'Dyson', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Dyson_logo.svg/3840px-Dyson_logo.svg.png' },
    { id: 'philips', name: 'Philips', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Philips_logo_new.svg/3840px-Philips_logo_new.svg.png' },
    { id: 'tefal', name: 'Tefal', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Tefal_logo.svg/3840px-Tefal_logo.svg.png' },
    { id: 'karcher', name: 'Karcher', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/K%C3%A4rcher_Logo_2015.svg/3840px-K%C3%A4rcher_Logo_2015.svg.png' },
    { id: 'redmond', name: 'Redmond', image: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Redmond.png' },
    { id: 'midea', name: 'Midea', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Midea.svg/3840px-Midea.svg.png' },
    { id: 'indesit', name: 'Indesit', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Indesit_Company_logo.svg/3840px-Indesit_Company_logo.svg.png' },
    { id: 'haier', name: 'Haier', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Haier_logo.svg/3840px-Haier_logo.svg.png' },
    { id: 'gorenje', name: 'Gorenje', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Gorenje_Logo.svg/3840px-Gorenje_Logo.svg.png' },
    { id: 'xiaomi', name: 'Xiaomi', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/1280px-Xiaomi_logo_%282021-%29.svg.png' },
    { id: 'candy', name: 'Candy', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Candy_2024.svg/3840px-Candy_2024.svg.png' },
    { id: 'beko', name: 'Beko', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/New_Beko_logo.svg/3840px-New_Beko_logo.svg.png' },
    { id: 'delonghi', name: 'DeLonghi', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/De%E2%80%99Longhi.svg/3840px-De%E2%80%99Longhi.svg.png' },
    { id: 'melitta', name: 'Melitta', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Logo_Melitta_%28Unternehmen%29.svg/3840px-Logo_Melitta_%28Unternehmen%29.svg.png' }
];

const productCategories = [
    { id: 'refrigerators', name: 'Холодильники', description: 'Двухкамерные, Side-by-Side, морозильные камеры', icon: 'fa-temperature-low' },
    { id: 'washing_machines', name: 'Стиральные машины', description: 'Фронтальные, с сушкой, инверторные', icon: 'fa-soap' },
    { id: 'vacuum_cleaners', name: 'Пылесосы', description: 'Вертикальные, моющие, циклонные', icon: 'fa-broom' },
    { id: 'microwaves', name: 'Микроволновки', description: 'Соло, с грилем, Smart Inverter', icon: 'fa-clock' },
    { id: 'coffee_machines', name: 'Кофемашины', description: 'Автоматические, капсульные', icon: 'fa-mug-hot' },
    { id: 'multicookers', name: 'Мультиварки', description: 'Скороварки, 3D нагрев', icon: 'fa-kitchen-set' }
];

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function formatPrice(price) {
    return (price || 0).toLocaleString('ru-RU') + ' руб.';
}

function saveCartToStorage() {
    localStorage.setItem('easychoice_cart', JSON.stringify(cartItems));
    console.log('Корзина сохранена в localStorage:', cartItems.length, 'товаров');
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('easychoice_cart');
    if (savedCart) {
        cartItems = JSON.parse(savedCart);
        console.log('Корзина загружена из localStorage:', cartItems.length, 'товаров');
    } else {
        cartItems = [];
    }
    updateCartCount();
    return cartItems;
}

function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = '(' + cartItems.length + ')';
    }
}

function showNotification(message, type) {
    type = type || 'success';
    const notification = document.getElementById('notification');
    const messageSpan = document.getElementById('notification-message');
    if (notification && messageSpan) {
        messageSpan.textContent = message;
        notification.className = 'notification';
        if (type === 'error') notification.classList.add('error');
        else if (type === 'info') notification.classList.add('info');
        notification.classList.add('show');
        setTimeout(function() {
            notification.classList.remove('show');
        }, 3000);
    } else {
        console.log(message);
    }
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(function(page) {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) {
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    if (pageId === 'cart') {
        renderCartItems();
        updateCartSummary();
    } else if (pageId === 'checkout') {
        prepareCheckoutPage();
    }
}

// ========== ФУНКЦИИ КОРЗИНЫ ==========
function addToCart(productId) {
    const product = products.find(function(p) { return p.id == productId; });
    if (!product) return;
    
    const existingItem = cartItems.find(function(item) { return item.id == product.id; });
    if (!existingItem) {
        cartItems.push({
            id: product.id,
            name: product.name,
            specs: product.specs,
            price: product.price,
            image: product.image,
            brand: product.brand,
            year: product.year || 2024
        });
        saveCartToStorage();
        if (window.api && window.api.getToken()) {
    saveCartToServer();
}
        updateCartCount();
        showNotification(product.name + ' добавлен в корзину!', 'success');
    } else {
        showNotification(product.name + ' уже есть в корзине', 'info');
    }
}

function removeFromCart(itemId) {
    const itemIndex = cartItems.findIndex(function(item) { return item.id == itemId; });
    if (itemIndex !== -1) {
        const itemName = cartItems[itemIndex].name;
        cartItems.splice(itemIndex, 1);
        saveCartToStorage();
        if (window.api && window.api.getToken()) {
    saveCartToServer();
}
        renderCartItems();
        updateCartSummary();
        updateCartCount();
        showNotification(itemName + ' удален из корзины', 'info');
    }
}

function calculateSubtotal() {
    return cartItems.reduce(function(sum, item) { return sum + (item.price || 0); }, 0);
}

function calculateShipping() {
    return calculateSubtotal() >= 30000 ? 0 : 500;
}

function calculateTotal() {
    return calculateSubtotal() + calculateShipping();
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    if (!container) return;
    
    if (cartItems.length === 0) {
        container.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><h3>Ваша корзина пуста</h3><p>Добавьте товары из каталога, чтобы сделать заказ</p><button class="btn-go-to-catalog" id="go-to-catalog">Перейти в каталог</button></div>';
        document.getElementById('go-to-catalog')?.addEventListener('click', function() { showPage('catalog'); });
        return;
    }
    
    container.innerHTML = cartItems.map(function(item) {
        return '<div class="cart-item" id="cart-item-' + item.id + '">' +
            '<div class="cart-item-image"><img src="' + item.image + '" alt="' + item.name + '" onerror="this.src=\'https://via.placeholder.com/300x300?text=No+Image\'"></div>' +
            '<div class="cart-item-details">' +
                '<div class="cart-item-title">' + item.name + '</div>' +
                '<div class="cart-item-specs">' + (item.specs || '') + '</div>' +
                '<div class="cart-item-price">' + formatPrice(item.price) + '</div>' +
                '<button class="btn-delete" data-id="' + item.id + '"><i class="fas fa-trash-alt"></i> Удалить</button>' +
            '</div>' +
        '</div>';
    }).join('');
    
    document.querySelectorAll('.btn-delete').forEach(function(btn) {
        btn.addEventListener('click', function() { removeFromCart(parseInt(btn.dataset.id)); });
    });
}

function updateCartSummary() {
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping-cost');
    const totalEl = document.getElementById('total-price');
    if (subtotalEl) subtotalEl.textContent = formatPrice(calculateSubtotal());
    if (shippingEl) shippingEl.textContent = calculateShipping() === 0 ? 'Бесплатно' : formatPrice(calculateShipping());
    if (totalEl) totalEl.textContent = formatPrice(calculateTotal());
}
function getImportantSpecs(product) {
    var specs = product.specs || '';
    
    if (product.category === 'refrigerators') {
        // Для холодильников: объем и энергокласс
        var volume = '';
        var energy = '';
        var parts = specs.split('|');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].indexOf('Общий полезный объем') !== -1) volume = parts[i].trim();
            if (parts[i].indexOf('Энергокласс') !== -1) energy = parts[i].trim();
        }
        return (volume ? volume + ' | ' : '') + (energy || 'Энергокласс: ' + (product.energyClass || 'A'));
    }
    
    if (product.category === 'washing_machines') {
        // Для стиральных машин: загрузка и отжим
        var load = '';
        var spin = '';
        var parts = specs.split('|');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].indexOf('Загрузка') !== -1) load = parts[i].trim();
            if (parts[i].indexOf('Отжим') !== -1 && parts[i].indexOf('об/мин') !== -1) spin = parts[i].trim();
        }
        return (load || 'Загрузка: —') + (spin ? ' | ' + spin : '');
    }
    
    if (product.category === 'vacuum_cleaners') {
        // Для пылесосов: мощность всасывания и емкость пылесборника
        var suction = '';
        var capacity = '';
        var parts = specs.split('|');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].indexOf('Мощность всасывания') !== -1) suction = parts[i].trim();
            if (parts[i].indexOf('Емкость пылесборника') !== -1) capacity = parts[i].trim();
        }
        return (suction || 'Мощность всасывания: —') + (capacity ? ' | ' + capacity : '');
    }
    
    if (product.category === 'microwaves') {
        // Для микроволновок: мощность и объем
        var power = '';
        var volume2 = '';
        var parts = specs.split('|');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].indexOf('Мощность микроволн') !== -1) power = parts[i].trim();
        }
        return (power || 'Мощность: —') + (volume2 ? ' | ' + volume2 : '');
    }
    
    if (product.category === 'coffee_machines') {
    // Для кофемашин: мощность, давление, тип капучинатора
    var power = '';
    var pressure = '';
    var cappuccino = '';
    var parts = specs.split('|');
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].indexOf('Мощность:') !== -1) power = parts[i].trim();
        if (parts[i].indexOf('Давление') !== -1) pressure = parts[i].trim();
    }
    return (power || 'Мощность: —') + (pressure ? ' | ' + pressure : '') + (cappuccino ? ' | ' + cappuccino : '');
}
    
    if (product.category === 'multicookers') {
        // Для мультиварок: мощность и объем чаши
        var power4 = '';
        var bowl = '';
        var parts = specs.split('|');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].indexOf('Мощность:') !== -1 && parts[i].indexOf('Вт') !== -1) power4 = parts[i].trim();
            if (parts[i].indexOf('Объем чаши') !== -1) bowl = parts[i].trim();
        }
        return (power4 || 'Мощность: —') + (bowl ? ' | ' + bowl : '');
    }
    
    // Для всех остальных
    var firstTwo = specs.split('|').slice(0, 2).join(' | ');
    return firstTwo || 'Характеристики не указаны';
}
// ========== ГЛАВНАЯ СТРАНИЦА ==========
function initHomePage() {
    const brandsGrid = document.getElementById('brands-grid');
    const featuredProducts = document.getElementById('featured-products');
    if (!brandsGrid || !featuredProducts) return;
    
    brandsGrid.innerHTML = '';
    popularBrands.forEach(function(brand) {
        const brandCard = document.createElement('div');
        brandCard.className = 'brand-card';
        brandCard.innerHTML = '<img src="' + brand.image + '" alt="' + brand.name + '"><h3>' + brand.name + '</h3>';
        brandCard.addEventListener('click', function() {
            const brandProducts = products.filter(function(p) { return p.brand === brand.id; });
            showFilteredByBrand(brandProducts, brand.name);
        });
        brandsGrid.appendChild(brandCard);
    });
    
    featuredProducts.innerHTML = '';
    if (!products || products.length === 0) {
        featuredProducts.innerHTML = '<div style="text-align:center;padding:40px">Нет товаров</div>';
        return;
    }
    
    // Перемешиваем и берем 4 товара
    const shuffled = [...products];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, 5);
    
    featuredProducts.innerHTML = selected.map(function(product) {
        // Получаем 2 главные характеристики для карточки
        var importantSpecs = getImportantSpecs(product);
        
        return '<div class="product-card">' +
            '<img src="' + product.image + '" alt="' + product.name + '" onerror="this.src=\'https://via.placeholder.com/300x300?text=No+Image\'">' +
            '<div class="product-info">' +
                '<div class="product-name">' + product.name + '</div>' +
                '<div class="product-specs">' + importantSpecs + '</div>' +
                '<div class="product-price">' + formatPrice(product.price) + '</div>' +
                '<button class="btn add-to-cart-home" data-id="' + product.id + '"><i class="fas fa-shopping-cart"></i> В корзину</button>' +
                '<button class="btn btn-outline view-details-home" data-id="' + product.id + '"><i class="fas fa-info-circle"></i> Подробнее</button>' +
            '</div>' +
        '</div>';
    }).join('');
    
    document.querySelectorAll('.add-to-cart-home').forEach(function(btn) {
        btn.addEventListener('click', function() { addToCart(parseInt(btn.dataset.id)); });
    });
    document.querySelectorAll('.view-details-home').forEach(function(btn) {
        btn.addEventListener('click', function() { showProductPage(parseInt(btn.dataset.id)); });
    });
}

// ========== КАТАЛОГ ==========
function initCatalogPage() {
    const catalogBrands = document.getElementById('catalog-brands');
    const categoryCards = document.getElementById('category-cards');
    if (!catalogBrands || !categoryCards) return;
    
    catalogBrands.innerHTML = '';
    allBrands.forEach(function(brand) {
        const card = document.createElement('div');
        card.className = 'brand-card';
        card.innerHTML = '<img src="' + brand.image + '" alt="' + brand.name + '"><h3>' + brand.name + '</h3>';
        card.addEventListener('click', function() {
            const brandProducts = products.filter(function(p) { return p.brand === brand.id; });
            showFilteredByBrand(brandProducts, brand.name);
        });
        catalogBrands.appendChild(card);
    });
    
    categoryCards.innerHTML = '';
    productCategories.forEach(function(category) {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = '<i class="fas ' + category.icon + '"></i><h3>' + category.name + '</h3><p>' + category.description + '</p><div class="btn">Смотреть</div>';
        card.addEventListener('click', function() { showCatalogCategoryPage(category.id, category.name); });
        categoryCards.appendChild(card);
    });
}

function showCatalogCategoryPage(categoryId, categoryName) {
    const categoryNameEl = document.getElementById('category-name');
    const categoryTitleEl = document.getElementById('category-page-title');
    if (categoryNameEl) categoryNameEl.textContent = categoryName;
    if (categoryTitleEl) categoryTitleEl.textContent = categoryName;
    window.currentCategory = categoryId;
    renderCatalogProducts();
    showPage('catalog-category');
}

function renderCatalogProducts() {
    const container = document.getElementById('catalog-products');
    if (!container) return;
    
    const filterPrice = document.getElementById('filter-price')?.value || 'default';
    const filterPopularity = document.getElementById('filter-popularity')?.value || 'default';
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-tools" style="font-size:48px"></i><p>Нет товаров</p></div>';
        return;
    }
    
    let filteredProducts = products.filter(function(product) { return product.category === window.currentCategory; });
    
    if (filterPrice === 'asc') filteredProducts.sort(function(a, b) { return a.price - b.price; });
    if (filterPrice === 'desc') filteredProducts.sort(function(a, b) { return b.price - a.price; });
    if (filterPopularity === 'asc') filteredProducts.sort(function(a, b) { return (a.popularity || 0) - (b.popularity || 0); });
    if (filterPopularity === 'desc') filteredProducts.sort(function(a, b) { return (b.popularity || 0) - (a.popularity || 0); });
    
    if (filteredProducts.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-tools" style="font-size:48px"></i><p>В этой категории пока нет товаров</p></div>';
        return;
    }
    
    container.innerHTML = filteredProducts.map(function(product) {
        // Получаем 2 главные характеристики для карточки
        const importantSpecs = getImportantSpecs(product);
        
        return '<div class="product-card">' +
            '<img src="' + product.image + '" alt="' + product.name + '" onerror="this.src=\'https://via.placeholder.com/300x300?text=No+Image\'">' +
            '<div class="product-info">' +
                '<div class="product-name">' + product.name + '</div>' +
                '<div class="product-specs">' + importantSpecs + '</div>' +
                '<div class="product-price">' + formatPrice(product.price) + '</div>' +
                '<button class="btn add-to-cart-catalog" data-id="' + product.id + '"><i class="fas fa-shopping-cart"></i> В корзину</button>' +
                '<button class="btn btn-outline view-details-catalog" data-id="' + product.id + '"><i class="fas fa-info-circle"></i> Подробнее</button>' +
            '</div>' +
        '</div>';
    }).join('');
    
    document.querySelectorAll('.add-to-cart-catalog').forEach(function(btn) {
        btn.addEventListener('click', function() { addToCart(parseInt(btn.dataset.id)); });
    });
    document.querySelectorAll('.view-details-catalog').forEach(function(btn) {
        btn.addEventListener('click', function() { showProductPage(parseInt(btn.dataset.id)); });
    });
}

function initCatalogCategoryPage() {
    const filterPrice = document.getElementById('filter-price');
    const filterPopularity = document.getElementById('filter-popularity');
    if (filterPrice) filterPrice.addEventListener('change', function() { renderCatalogProducts(); });
    if (filterPopularity) filterPopularity.addEventListener('change', function() { renderCatalogProducts(); });
}

// ========== ФИЛЬТР ПО БРЕНДУ ==========
function showFilteredByBrand(brandProducts, brandName) {
    console.log('Фильтр по бренду:', brandName, 'найдено товаров:', brandProducts.length);
    
    if (brandProducts.length === 0) {
        showNotification('Товаров бренда ' + brandName + ' не найдено', 'info');
        return;
    }
    
    window.currentSearchTerm = brandName;
    const searchQueryElement = document.getElementById('search-query');
    if (searchQueryElement) searchQueryElement.textContent = brandName;
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    renderSearchResults(brandProducts);
    showPage('search-results');
}

// ========== ПОИСК ==========
function performSearch() {
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput?.value.trim().toLowerCase();
    if (!searchTerm) {
        showNotification('Введите поисковый запрос', 'info');
        return;
    }
    
    window.currentSearchTerm = searchTerm;
    const searchQueryElement = document.getElementById('search-query');
    if (searchQueryElement) searchQueryElement.textContent = searchTerm;
    
    const results = products.filter(function(product) {
        if (product.name.toLowerCase().includes(searchTerm)) return true;
        if (product.brand && product.brand.toLowerCase().includes(searchTerm)) return true;
        if (product.specs && product.specs.toLowerCase().includes(searchTerm)) return true;
        return false;
    });
    
    renderSearchResults(results);
    showPage('search-results');
}

function renderSearchResults(results) {
    const container = document.getElementById('search-results-container');
    if (!container) return;
    
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><h3>Ничего не найдено</h3><button class="btn-go-to-catalog" id="go-to-catalog-from-search">Перейти в каталог</button></div>';
        document.getElementById('go-to-catalog-from-search')?.addEventListener('click', function() { showPage('catalog'); });
        return;
    }
    
    container.innerHTML = results.map(function(product) {
        var importantSpecs = getImportantSpecs(product);
        
        return '<div class="product-card">' +
            '<img src="' + product.image + '" alt="' + product.name + '" onerror="this.src=\'https://via.placeholder.com/300x300?text=No+Image\'">' +
            '<div class="product-info">' +
                '<div class="product-name">' + product.name + '</div>' +
                '<div class="product-specs">' + importantSpecs + '</div>' +
                '<div class="product-price">' + formatPrice(product.price) + '</div>' +
                '<button class="btn add-to-cart-search" data-id="' + product.id + '"><i class="fas fa-shopping-cart"></i> В корзину</button>' +
                '<button class="btn btn-outline view-details-search" data-id="' + product.id + '"><i class="fas fa-info-circle"></i> Подробнее</button>' +
            '</div>' +
        '</div>';
    }).join('');
    
    document.querySelectorAll('.add-to-cart-search').forEach(function(btn) {
        btn.addEventListener('click', function() { addToCart(parseInt(btn.dataset.id)); });
    });
    document.querySelectorAll('.view-details-search').forEach(function(btn) {
        btn.addEventListener('click', function() { showProductPage(parseInt(btn.dataset.id)); });
    });
}

// ========== СТРАНИЦА ТОВАРА ==========
// ========== СТРАНИЦА ТОВАРА ==========
function showProductPage(productId) {
    const product = products.find(function(p) { return p.id == productId; });
    if (!product) return;
    
    const productCard = document.getElementById('product-card');
    const breadcrumbName = document.getElementById('product-breadcrumb-name');
    if (breadcrumbName) breadcrumbName.textContent = product.name;
    
    // Получаем название категории для хлебных крошек
    let categoryNameForBreadcrumb = '';
    switch (product.category) {
        case 'refrigerators':
            categoryNameForBreadcrumb = 'Холодильники';
            break;
        case 'washing_machines':
            categoryNameForBreadcrumb = 'Стиральные машины';
            break;
        case 'vacuum_cleaners':
            categoryNameForBreadcrumb = 'Пылесосы';
            break;
        case 'microwaves':
            categoryNameForBreadcrumb = 'Микроволновки';
            break;
        case 'coffee_machines':
            categoryNameForBreadcrumb = 'Кофемашины';
            break;
        case 'multicookers':
            categoryNameForBreadcrumb = 'Мультиварки';
            break;
        default:
            categoryNameForBreadcrumb = product.category;
    }
    
    // Обновляем хлебные крошки
    const breadcrumbHtml = `
        <div class="breadcrumb">
            <a href="#" class="nav-link" data-page="home">Главная</a>
            <span class="separator">&gt;</span>
            <a href="#" class="nav-link" data-page="catalog">Каталог</a>
            <span class="separator">&gt;</span>
            <a href="#" class="category-breadcrumb" data-category="${product.category}">${categoryNameForBreadcrumb}</a>
            <span class="separator">&gt;</span>
            <span id="product-breadcrumb-name">${product.name}</span>
        </div>
    `;
    
    const breadcrumbContainer = document.querySelector('#product .breadcrumb');
    if (breadcrumbContainer) {
        breadcrumbContainer.outerHTML = breadcrumbHtml;
    }
    
    // Привязываем обработчики для новых ссылок
    document.querySelectorAll('#product .breadcrumb .nav-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            if (pageId && typeof showPage === 'function') {
                showPage(pageId);
            }
        });
    });
    
    // Обработчик для клика по категории
    const categoryBreadcrumb = document.querySelector('#product .breadcrumb .category-breadcrumb');
    if (categoryBreadcrumb) {
        categoryBreadcrumb.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.dataset.category;
            const categoryName = this.textContent;
            if (typeof showCatalogCategoryPage === 'function') {
                showCatalogCategoryPage(category, categoryName);
            }
        });
    }
    
    // Форматируем характеристики из поля specs
    let specsFormatted = '';
    if (product.specs) {
        var items = product.specs.split('|');
        for (var i = 0; i < items.length; i++) {
            var item = items[i].trim();
            if (item) {
                var parts = item.split(':');
                if (parts.length >= 2) {
                    var label = parts[0];
                    var value = parts.slice(1).join(':');
                    specsFormatted += '<div class="spec-item"><div class="spec-label">' + label + '</div><div class="spec-value">' + value + '</div></div>';
                } else {
                    specsFormatted += '<div class="spec-item"><div class="spec-label">' + item + '</div><div class="spec-value">—</div></div>';
                }
            }
        }
    }
    
    // Базовое описание (первая характеристика)
    var shortDescription = product.specs ? product.specs.split('|')[0].trim() : '';
    
    productCard.innerHTML = `
        <div class="product-header">
            <div class="product-image"><img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'"></div>
            <div class="product-info">
                <h1 class="product-title">${product.name}</h1>
                <div class="product-price">${formatPrice(product.price)}</div>
                <p class="product-description">${shortDescription}</p>
                <button class="add-to-cart-btn" id="product-add-to-cart" data-id="${product.id}"><i class="fas fa-shopping-cart"></i> В корзину</button>
            </div>
        </div>
        <div class="specs-section">
            <h2 class="section-title-smaller">Характеристики</h2>
            <div class="specs-grid">
                ${specsFormatted}
            </div>
        </div>
    `;
    
    document.getElementById('product-add-to-cart')?.addEventListener('click', function() { addToCart(product.id); });
    
    if (typeof showPage === 'function') {
        showPage('product');
    }
}
// ========== КОРЗИНА (СТРАНИЦА) ==========
function initCartPage() {
    const checkoutBtn = document.getElementById('checkout-btn');
    const continueBtn = document.getElementById('continue-shopping');
    
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cartItems.length === 0) {
                showNotification('Корзина пуста', 'error');
            } else {
                prepareCheckoutPage();
                showPage('checkout');
            }
        });
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', function() { showPage('catalog'); });
    }
}

// ========== ОФОРМЛЕНИЕ ЗАКАЗА ==========
function prepareCheckoutPage() {
    checkoutItems = cartItems.map(function(item) { return { ...item, quantity: 1 }; });
    renderOrderItems();
    updateOrderSummary();
    
    // Автозаполнение данных из профиля
    const savedUser = localStorage.getItem('easychoice_user');
    const savedData = localStorage.getItem('easychoice_user_data');
    
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            if (user.name && document.getElementById('full-name')) {
                document.getElementById('full-name').value = user.name;
            }
            if (user.email && document.getElementById('email')) {
                document.getElementById('email').value = user.email;
            }
        } catch(e) {}
    }
    
    if (savedData) {
        try {
            const userData = JSON.parse(savedData);
            if (userData.phone && document.getElementById('phone')) {
                document.getElementById('phone').value = userData.phone;
            }
            if (userData.city && document.getElementById('city')) {
                document.getElementById('city').value = userData.city;
            }
            if (userData.address && document.getElementById('address')) {
                document.getElementById('address').value = userData.address;
            }
        } catch(e) {}
    }
}

function renderOrderItems() {
    const container = document.getElementById('order-items');
    if (!container) return;
    
    if (checkoutItems.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:40px"><p>Ваш заказ пуст</p></div>';
        return;
    }
    
    container.innerHTML = checkoutItems.map(function(item) {
        return '<div class="order-item" id="checkout-item-' + item.id + '">' +
            '<div class="order-item-image"><img src="' + item.image + '" alt="' + item.name + '" onerror="this.src=\'https://via.placeholder.com/300x300?text=No+Image\'"></div>' +
            '<div class="order-item-details">' +
                '<div class="order-item-title">' + item.name + '</div>' +
                '<div class="order-item-specs">' + (item.specs || '') + '</div>' +
                '<div class="order-item-price">' + formatPrice(item.price * item.quantity) + '</div>' +
                '<div class="quantity-control">' +
                    '<button class="quantity-btn minus-btn" data-id="' + item.id + '"><i class="fas fa-minus"></i></button>' +
                    '<div class="quantity-value">' + item.quantity + '</div>' +
                    '<button class="quantity-btn plus-btn" data-id="' + item.id + '"><i class="fas fa-plus"></i></button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
    
    document.querySelectorAll('.minus-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const id = parseInt(btn.dataset.id);
            const item = checkoutItems.find(function(i) { return i.id === id; });
            if (item && item.quantity > 1) {
                item.quantity--;
                updateOrderItem(id);
            } else if (item && item.quantity === 1) {
                if (confirm('Удалить товар "' + item.name + '" из заказа?')) {
                    checkoutItems = checkoutItems.filter(function(i) { return i.id !== id; });
                    renderOrderItems();
                    updateOrderSummary();
                    showNotification('Товар "' + item.name + '" удален из заказа', 'info');
                }
            }
        });
    });
    
    document.querySelectorAll('.plus-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const id = parseInt(btn.dataset.id);
            const item = checkoutItems.find(function(i) { return i.id === id; });
            if (item) {
                item.quantity++;
                updateOrderItem(id);
            }
        });
    });
}

function updateOrderItem(id) {
    const item = checkoutItems.find(function(i) { return i.id === id; });
    if (!item) return;
    const el = document.getElementById('checkout-item-' + id);
    if (el) {
        const priceEl = el.querySelector('.order-item-price');
        const qtyEl = el.querySelector('.quantity-value');
        if (priceEl) priceEl.textContent = formatPrice(item.price * item.quantity);
        if (qtyEl) qtyEl.textContent = item.quantity;
    }
    updateOrderSummary();
}

function updateOrderSummary() {
    const itemsTotal = checkoutItems.reduce(function(sum, i) { return sum + (i.price * i.quantity); }, 0);
    const shipping = itemsTotal >= 30000 ? 0 : 500;
    const finalTotal = itemsTotal + shipping;
    
    const itemsTotalEl = document.getElementById('items-total');
    const shippingEl = document.getElementById('shipping-cost-checkout');
    const finalTotalEl = document.getElementById('final-total');
    
    if (itemsTotalEl) itemsTotalEl.textContent = formatPrice(itemsTotal);
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Бесплатно' : formatPrice(shipping);
    if (finalTotalEl) finalTotalEl.textContent = formatPrice(finalTotal);
}

function initCheckoutPage() {
    const confirmBtn = document.getElementById('confirm-order-btn');
    if (confirmBtn) {
        confirmBtn.onclick = async function() {
            const fullName = document.getElementById('full-name')?.value.trim();
            const email = document.getElementById('email')?.value.trim();
            const phone = document.getElementById('phone')?.value.trim();
            const city = document.getElementById('city')?.value.trim();
            const address = document.getElementById('address')?.value.trim();
            const comment = document.getElementById('comment')?.value.trim();
            
            if (!fullName || !email || !phone || !city || !address) {
                showNotification('Заполните все обязательные поля', 'error');
                return;
            }
            
            // Проверка телефона
            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length !== 11 || !phoneDigits.startsWith('7')) {
                showNotification('Введите корректный номер телефона в формате +7 (xxx) xxx-xx-xx', 'error');
                return;
            }
            
            const itemsTotal = checkoutItems.reduce(function(sum, i) { return sum + (i.price * i.quantity); }, 0);
            const shippingCost = itemsTotal >= 30000 ? 0 : 500;
            const finalTotal = itemsTotal + shippingCost;
            const orderNumber = 'EA-' + Date.now();
            
            const orderData = {
                orderNumber: orderNumber,
                totalPrice: finalTotal,
                customerName: fullName,
                customerEmail: email,
                customerPhone: phone,
                customerCity: city,
                customerAddress: address,
                comment: comment || '',
                items: checkoutItems.map(function(item) { 
                    return { 
                        id: item.id, 
                        name: item.name, 
                        price: item.price, 
                        quantity: item.quantity 
                    }; 
                })
            };
            
            console.log('Оформление заказа:', orderData);
            
            // Сохраняем в localStorage (всегда)
            const savedOrders = localStorage.getItem('easychoice_orders') || '[]';
            const orders = JSON.parse(savedOrders);
            orders.unshift({
                orderNumber: orderNumber,
                customerName: fullName,
                customerEmail: email,
                customerPhone: phone,
                customerCity: city,
                deliveryAddress: address,
                comment: comment,
                items: checkoutItems,
                itemsTotal: itemsTotal,
                shippingCost: shippingCost,
                finalTotal: finalTotal,
                status: 'pending',
                orderDate: new Date().toLocaleDateString('ru-RU')
            });
            localStorage.setItem('easychoice_orders', JSON.stringify(orders));
            
            // Сохраняем данные пользователя для будущих заказов
            const userData = {
                name: fullName,
                email: email,
                phone: phone,
                city: city,
                address: address
            };
            localStorage.setItem('easychoice_user_data', JSON.stringify(userData));
            
            const token = localStorage.getItem('easychoice_token');
            
            // Сохраняем заказ в БД (для авторизованных пользователей)
            if (token) {
                try {
                    const response = await fetch('http://localhost:3001/api/orders', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({
                            orderNumber: orderNumber,
                            totalPrice: finalTotal,
                            customerName: fullName,
                            customerPhone: phone,
                            customerAddress: address + ', г. ' + city,
                            comment: comment || '',
                            items: checkoutItems.map(function(item) { 
                                return { id: item.id, name: item.name, price: item.price, quantity: item.quantity }; 
                            })
                        })
                    });
                    
                    if (response.ok) {
                        console.log('Заказ сохранен в базу данных для пользователя');
                        showNotification('Заказ сохранен в вашем аккаунте!', 'success');
                    } else {
                        console.log('Ошибка сохранения в БД');
                    }
                } catch (error) {
                    console.error('Ошибка соединения:', error);
                }
            } else {
                // Сохраняем гостевой заказ в отдельную таблицу
                try {
                    const guestResponse = await fetch('http://localhost:3001/api/guest/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderNumber: orderNumber,
                            totalPrice: finalTotal,
                            customerName: fullName,
                            customerPhone: phone,
                            customerAddress: address + ', г. ' + city,
                            items: checkoutItems.map(function(item) { 
                                return { id: item.id, name: item.name, price: item.price, quantity: item.quantity }; 
                            })
                        })
                    });
                    
                    if (guestResponse.ok) {
                        console.log('Гостевой заказ сохранен в базу данных');
                        showNotification('Заказ сохранен! Войдите в аккаунт, чтобы видеть историю заказов.', 'info');
                    } else {
                        console.log('Заказ сохранен только локально');
                        showNotification('Заказ сохранен локально', 'info');
                    }
                } catch (error) {
                    console.error('Ошибка сохранения гостевого заказа:', error);
                    showNotification('Заказ сохранен локально', 'info');
                }
            }
            
            // Обновляем отображение подтверждения
            document.getElementById('order-number').textContent = orderNumber;
            document.getElementById('customer-name').textContent = fullName;
            document.getElementById('customer-phone').textContent = phone;
            document.getElementById('order-amount').textContent = formatPrice(finalTotal);
            
            // Очищаем корзину
            cartItems = [];
            checkoutItems = [];
            saveCartToStorage();
            updateCartCount();
            
            showPage('confirmation');
            showNotification('Заказ #' + orderNumber + ' успешно оформлен!', 'success');
        };
    }
    
    // Маска для телефона
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            if (value.length > 0 && value[0] !== '7' && value[0] !== '8') value = '7' + value.slice(1);
            
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

function initConfirmationPage() {
    const backBtn = document.getElementById('back-to-home');
    if (backBtn) backBtn.addEventListener('click', function() { showPage('home'); });
}

// ========== ОТКРЫТИЕ ТОВАРА ПРИ КЛИКЕ НА КАРТИНКУ ==========
function addImageClickHandlers() {
    const productImages = document.querySelectorAll('.product-card img');
    
    productImages.forEach(function(img) {
        img.removeEventListener('click', handleImageClick);
        img.addEventListener('click', handleImageClick);
        img.style.cursor = 'pointer';
        img.style.transition = 'transform 0.2s ease';
        
        img.addEventListener('mouseenter', function() {
            img.style.transform = 'scale(1.02)';
        });
        img.addEventListener('mouseleave', function() {
            img.style.transform = 'scale(1)';
        });
    });
}

function handleImageClick(event) {
    event.stopPropagation();
    const productCard = event.target.closest('.product-card');
    if (!productCard) return;
    
    let productId = null;
    const addToCartBtn = productCard.querySelector('[class*="add-to-cart"]');
    const viewDetailsBtn = productCard.querySelector('[class*="view-details"]');
    
    if (addToCartBtn && addToCartBtn.dataset.id) {
        productId = parseInt(addToCartBtn.dataset.id);
    } else if (viewDetailsBtn && viewDetailsBtn.dataset.id) {
        productId = parseInt(viewDetailsBtn.dataset.id);
    }
    
    if (productId && typeof showProductPage === 'function') {
        showProductPage(productId);
    }
}

function observeProductCards() {
    addImageClickHandlers();
    const observer = new MutationObserver(function() {
        addImageClickHandlers();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function refreshAllPages() {
    initHomePage();
    initCatalogPage();
    if (window.currentCategory) renderCatalogProducts();
    renderCartItems();
    updateCartSummary();
    updateCartCount();
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM загружен');
    
    await loadProductsFromBackend();
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            if (pageId) showPage(pageId);
        });
    });
    
    const logoHome = document.getElementById('logo-home');
    if (logoHome) logoHome.addEventListener('click', function() { showPage('home'); });
    
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') performSearch(); });
    
    initHomePage();
    initCatalogPage();
    initCatalogCategoryPage();
    initCartPage();
    initCheckoutPage();
    initConfirmationPage();
    
    renderCartItems();
    updateCartSummary();
    updateCartCount();
    showPage('home');
    
    loadCartFromStorage();
    observeProductCards();
   // ========== ПОИСК С ПОДСКАЗКАМИ ==========
// ========== ПОИСК С ПОДСКАЗКАМИ ==========
var searchInputElement = document.getElementById('search-input');
var suggestionsContainer = document.getElementById('search-suggestions');
var searchTimeoutId;

function getSearchSuggestions(query) {
    if (!query || query.length < 2) {
        return [];
    }
    
    // Получаем товары из глобального массива
    var allProducts = window.products || [];
    
    if (allProducts.length === 0) {
        console.log('Товары не загружены, пробуем загрузить...');
        if (window.api && window.api.loadProducts) {
            window.api.loadProducts().then(function(data) {
                if (data && data.length > 0) {
                    window.products = data;
                    var results = filterProducts(data, query);
                    displaySuggestions(results);
                }
            });
        }
        return [];
    }
    
    return filterProducts(allProducts, query);
}

function filterProducts(productsArray, query) {
    var lowerQuery = query.toLowerCase();
    var results = [];
    
    for (var i = 0; i < productsArray.length; i++) {
        var product = productsArray[i];
        var nameMatch = product.name && product.name.toLowerCase().indexOf(lowerQuery) !== -1;
        var brandMatch = product.brand && product.brand.toLowerCase().indexOf(lowerQuery) !== -1;
        var categoryMatch = product.category && product.category.toLowerCase().indexOf(lowerQuery) !== -1;
        
        if (nameMatch || brandMatch || categoryMatch) {
            results.push(product);
        }
        if (results.length >= 8) break;
    }
    
    console.log('Найдено результатов:', results.length);
    return results;
}

function displaySuggestions(results) {
    if (!suggestionsContainer) return;
    
    if (results.length === 0) {
        suggestionsContainer.classList.remove('show');
        return;
    }
    
    var priceFormatter = function(price) {
        return (price || 0).toLocaleString('ru-RU') + ' руб.';
    };
    
    var html = '';
    for (var i = 0; i < results.length; i++) {
        var product = results[i];
        html += '<div class="search-suggestion-item" data-id="' + product.id + '">' +
            '<img src="' + product.image + '" alt="' + product.name + '" class="search-suggestion-img" onerror="this.src=\'https://via.placeholder.com/40x40?text=No+Image\'">' +
            '<div class="search-suggestion-info">' +
                '<div class="search-suggestion-name">' + product.name + '</div>' +
                '<div class="search-suggestion-category">' + (product.brand || product.category || '') + '</div>' +
            '</div>' +
            '<div class="search-suggestion-price">' + priceFormatter(product.price) + '</div>' +
        '</div>';
    }
    
    suggestionsContainer.innerHTML = html;
    suggestionsContainer.classList.add('show');
    
    var items = suggestionsContainer.querySelectorAll('.search-suggestion-item');
    for (var j = 0; j < items.length; j++) {
        items[j].onclick = (function(el) {
            return function() {
                var productId = parseInt(el.getAttribute('data-id'));
                if (productId && typeof showProductPage === 'function') {
                    showProductPage(productId);
                    suggestionsContainer.classList.remove('show');
                    if (searchInputElement) searchInputElement.value = '';
                }
            };
        })(items[j]);
    }
}

function onSearchInput() {
    if (searchTimeoutId) clearTimeout(searchTimeoutId);
    searchTimeoutId = setTimeout(function() {
        var query = searchInputElement ? searchInputElement.value.trim() : '';
        if (!query || query.length < 2) {
            if (suggestionsContainer) suggestionsContainer.classList.remove('show');
            return;
        }
        var results = getSearchSuggestions(query);
        displaySuggestions(results);
    }, 300);
}

function closeSearchSuggestions() {
    if (suggestionsContainer) suggestionsContainer.classList.remove('show');
}

if (searchInputElement) {
    searchInputElement.addEventListener('input', onSearchInput);
    searchInputElement.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeSearchSuggestions();
        }
    });
}

document.addEventListener('click', function(e) {
    if (suggestionsContainer && !e.target.closest('.search-wrapper')) {
        closeSearchSuggestions();
    }
});
});
// ========== КЛИК ПО КАРТИНКЕ ДЛЯ ПЕРЕХОДА НА ТОВАР ==========
function addImageClickHandlers() {
    const productImages = document.querySelectorAll('.product-card img');
    
    productImages.forEach(function(img) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            const productCard = this.closest('.product-card');
            if (productCard) {
                const addToCartBtn = productCard.querySelector('[class*="add-to-cart"]');
                const viewDetailsBtn = productCard.querySelector('[class*="view-details"]');
                let productId = null;
                if (addToCartBtn && addToCartBtn.dataset.id) {
                    productId = parseInt(addToCartBtn.dataset.id);
                } else if (viewDetailsBtn && viewDetailsBtn.dataset.id) {
                    productId = parseInt(viewDetailsBtn.dataset.id);
                }
                if (productId && typeof showProductPage === 'function') {
                    showProductPage(productId);
                }
            }
        });
    });
}

// Запускаем при загрузке и при изменениях
document.addEventListener('DOMContentLoaded', addImageClickHandlers);

const observer = new MutationObserver(function() {
    addImageClickHandlers();
});
observer.observe(document.body, { childList: true, subtree: true });
// Гамбургер
const mobileToggle = document.getElementById('mobile-menu-toggle');
const mainNav = document.getElementById('main-nav');

if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        mainNav.classList.toggle('show');
    });
}

// Мобильный профиль
const mobileProfileBtn = document.getElementById('mobile-profile-btn');
if (mobileProfileBtn) {
    mobileProfileBtn.addEventListener('click', function(e) {
        e.preventDefault();
        const token = localStorage.getItem('easychoice_token');
        if (token) {
            if (typeof openProfilePage === 'function') openProfilePage();
        } else {
            document.getElementById('auth-modal').style.display = 'block';
        }
    });
}