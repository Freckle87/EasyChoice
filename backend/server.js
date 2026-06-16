require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
const JWT_SECRET = process.env.JWT_SECRET;
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use(express.json());
console.log({
  DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
  PORT: process.env.PORT
});
// Подключение к БД
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err) => {
    if (err) console.error('❌ Ошибка БД:', err.message);
    else console.log('✅ PostgreSQL подключена');
});

// Проверка токена
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'Требуется авторизация' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Неверный токен' });
        req.user = user;
        next();
    });
}

// Проверка админа
function isAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещён' });
    }
    next();
}
app.get('/', (req, res) => {
    res.send('EasyChoice работает!');
});
// ========== ТОВАРЫ ==========

app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Товар не найден' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/products/category/:category', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE category = $1', [req.params.category]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/search', async (req, res) => {
    const query = req.query.q || '';
    if (!query.trim()) return res.json([]);
    
    try {
        const result = await pool.query(
            `SELECT * FROM products 
             WHERE LOWER(name) LIKE LOWER($1) 
                OR LOWER(brand) LIKE LOWER($1)
                OR LOWER(category) LIKE LOWER($1)
             LIMIT 20`,
            [`%${query}%`]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
    const { name, brand, price, image, category, specs, energyClass, year, popularity } = req.body;
    
    console.log('=== ПОЛУЧЕН ЗАПРОС НА ДОБАВЛЕНИЕ ТОВАРА ===');
    console.log('Данные:', JSON.stringify(req.body, null, 2));
    
    try {
        const result = await pool.query(
            `INSERT INTO products (name, brand, price, image, category, specs, energy_class, year, popularity) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [name, brand, price, image, category, specs, energyClass, year || 2024, popularity || 50]
        );
        
        console.log('✅ Товар добавлен, ID:', result.rows[0].id);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('❌ Ошибка:', err.message);
        res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
    }
});

app.put('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    const { name, brand, price, image, category, specs, energyClass, year, popularity } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE products 
             SET name=$1, brand=$2, price=$3, image=$4, category=$5, 
                 specs=$6, energy_class=$7, year=$8, popularity=$9
             WHERE id=$10 RETURNING *`,
            [name, brand, price, image, category, specs, energyClass, year, popularity, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Товар не найден' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Товар не найден' });
        res.json({ message: 'Товар удалён' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========== АВТОРИЗАЦИЯ ==========

app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;
    
    console.log('Регистрация:', { email, name });
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    
    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Пользователь уже существует' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const userName = name && name.trim() !== '' ? name : email.split('@')[0];
        const result = await pool.query(
            'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
            [email, hashedPassword, userName, 'user']
        );
        
        console.log('Пользователь создан:', result.rows[0]);
        
        const token = jwt.sign(
            { id: result.rows[0].id, email: result.rows[0].email, role: result.rows[0].role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ success: true, token, user: result.rows[0] });
    } catch (err) {
        console.error('Ошибка регистрации:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // Убедитесь, что возвращается name
        res.json({ 
            success: true, 
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                name: user.name || email.split('@')[0], 
                role: user.role 
            } 
        });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        console.log('Возвращаем пользователя:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========== ИЗБРАННОЕ ==========

app.get('/api/wishlist', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.* FROM products p 
             JOIN wishlist w ON p.id = w.product_id 
             WHERE w.user_id = $1`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/wishlist', authenticateToken, async (req, res) => {
    const { productId } = req.body;
    try {
        await pool.query(
            'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [req.user.id, productId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/wishlist/:productId', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [req.user.id, req.params.productId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========== СРАВНЕНИЕ ==========

app.get('/api/compare', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.* FROM products p 
             JOIN compare c ON p.id = c.product_id 
             WHERE c.user_id = $1`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/compare', authenticateToken, async (req, res) => {
    const { productId } = req.body;
    try {
        const count = await pool.query('SELECT COUNT(*) FROM compare WHERE user_id = $1', [req.user.id]);
        if (parseInt(count.rows[0].count) >= 8) {
            return res.status(400).json({ error: 'Можно добавить не более 8 товаров' });
        }
        
        await pool.query(
            'INSERT INTO compare (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [req.user.id, productId]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/compare/:productId', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM compare WHERE user_id = $1 AND product_id = $2', [req.user.id, req.params.productId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/compare', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM compare WHERE user_id = $1', [req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========== КОРЗИНА ==========

app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, c.quantity FROM products p 
             JOIN cart c ON p.id = c.product_id 
             WHERE c.user_id = $1`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
    const { productId, quantity = 1 } = req.body;
    try {
        await pool.query(
            `INSERT INTO cart (user_id, product_id, quantity) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (user_id, product_id) 
             DO UPDATE SET quantity = cart.quantity + $3`,
            [req.user.id, productId, quantity]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.put('/api/cart/:productId', authenticateToken, async (req, res) => {
    const { quantity } = req.body;
    try {
        await pool.query('UPDATE cart SET quantity = $1 WHERE user_id = $2 AND product_id = $3', [quantity, req.user.id, req.params.productId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM cart WHERE user_id = $1 AND product_id = $2', [req.user.id, req.params.productId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.delete('/api/cart', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========== ЗАКАЗЫ ==========

app.post('/api/orders', authenticateToken, async (req, res) => {
    const { orderNumber, totalPrice, customerName, customerPhone, customerAddress, comment, items } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const orderResult = await client.query(
            `INSERT INTO orders (user_id, order_number, total_price, status, customer_name, customer_phone, customer_address, comment) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [req.user.id, orderNumber, totalPrice, 'pending', customerName, customerPhone, customerAddress, comment]
        );
        
        const orderId = orderResult.rows[0].id;
        
        for (const item of items) {
            await client.query(
                `INSERT INTO order_items (order_id, product_id, product_name, price, quantity) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [orderId, item.id, item.name, item.price, item.quantity]
            );
        }
        
        await client.query('DELETE FROM cart WHERE user_id = $1', [req.user.id]);
        
        await client.query('COMMIT');
        res.json({ success: true, orderId });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Ошибка создания заказа' });
    } finally {
        client.release();
    }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        
        for (const order of result.rows) {
            const items = await pool.query(
                'SELECT * FROM order_items WHERE order_id = $1',
                [order.id]
            );
            order.items = items.rows;
        }
        
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT o.*, u.email as user_email 
             FROM orders o 
             LEFT JOIN users u ON o.user_id = u.id 
             ORDER BY o.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.put('/api/admin/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
    const { status } = req.body;
    try {
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// ========== ОТЗЫВЫ ==========

app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT r.*, u.name as user_name 
             FROM reviews r 
             LEFT JOIN users u ON r.user_id = u.id 
             WHERE r.product_id = $1 
             ORDER BY r.created_at DESC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
    const { rating, comment } = req.body;
    try {
        await pool.query(
            'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES ($1, $2, $3, $4)',
            [req.user.id, req.params.id, rating, comment]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
// ========== ГОСТЕВЫЕ ЗАКАЗЫ ==========

// Сохранение гостевого заказа
app.post('/api/guest/orders', async (req, res) => {
    const { orderNumber, totalPrice, customerName, customerPhone, customerAddress, items } = req.body;
    
    if (!orderNumber || !totalPrice) {
        return res.status(400).json({ error: 'Обязательные поля не заполнены' });
    }
    
    try {
        await pool.query(
            `INSERT INTO guest_orders (order_number, total_price, customer_name, customer_phone, customer_address, items) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [orderNumber, totalPrice, customerName || '', customerPhone || '', customerAddress || '', JSON.stringify(items || [])]
        );
        res.json({ success: true, message: 'Гостевой заказ сохранён' });
    } catch (err) {
        console.error('Ошибка сохранения гостевого заказа:', err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Получение всех гостевых заказов (для админа)
app.get('/api/admin/guest-orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM guest_orders ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
// ========== ЗАПУСК ==========
app.listen(process.env.PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🚀 EasyChoice Сервер запущен!        ║
║   📍 http://localhost:${PORT}              ║
║   🗄️  База: ${process.env.DB_NAME}         ║
╚════════════════════════════════════════╝
    `);
});
// Обновление профиля пользователя
// Обновление имени пользователя
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Имя обязательно' });
    }
    
    try {
        await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, req.user.id]);
        
        // Возвращаем обновлённого пользователя
        const result = await pool.query('SELECT id, email, name, role FROM users WHERE id = $1', [req.user.id]);
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Смена пароля
app.put('/api/user/password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    try {
        const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
        const user = result.rows[0];
        
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Неверный текущий пароль' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
// Обновление имени пользователя
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Имя обязательно' });
    }
    
    try {
        await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, req.user.id]);
        res.json({ success: true, message: 'Имя обновлено' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});
