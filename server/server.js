const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',       
  database: 'chat',
  password: '6974I21830',
  port: 5432
});
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.post('/api/register', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны.' });
  }
  try {
    const userExists = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Логин уже используется.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (login, password) VALUES ($1, $2) RETURNING user_id, login',
      [login, hashedPassword]
    );
    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Логин и пароль обязательны.' });
  }
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Пользователь не найден.' });
    }
    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверный пароль.' });
    }
    res.status(200).json({ user_id: user.user_id, login: user.login });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.message_id, 
        m.user_id, 
        m.content, 
        m.created_at, 
        u.login AS sender
      FROM messages m
      JOIN users u ON m.user_id = u.user_id
      ORDER BY m.created_at ASC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении сообщений:', error);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});
app.post('/api/messages', async (req, res) => {
  const { user_id, content } = req.body;
  if (!user_id || !content) {
    return res.status(400).json({ error: 'User ID и сообщение обязательны.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO messages (user_id, content, created_at) VALUES ($1, $2, NOW()) RETURNING message_id, user_id, content, created_at',
      [user_id, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
