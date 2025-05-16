const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'my_super_secret';

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'chat',
  password: '6974I21830',
  port: 5432,
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.post('/api/register', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Логин и пароль обязательны.' });

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: 'Логин уже используется.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserResult = await pool.query(
      'INSERT INTO users (login, password) VALUES ($1, $2) RETURNING user_id, login',
      [login, hashedPassword]
    );
    res.status(201).json(newUserResult.rows[0]);
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: 'Логин и пароль обязательны.' });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'Пользователь не найден.' });

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Неверный пароль.' });

    const token = jwt.sign(
      { user_id: user.user_id, login: user.login },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).json({ token, user_id: user.user_id, login: user.login });
  } catch (error) {
    console.error('Ошибка при авторизации:', error);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет токена.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Неверный токен.' });
    req.user = user;
    next();
  });
}

app.get('/api/messages', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.message_id, 
        m.user_id, 
        m.content, 
        m.created_at,
        m.updated_at,
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

app.post('/api/messages', authenticateToken, async (req, res) => {
  const { content } = req.body;
  const user_id = req.user.user_id;

  if (!content) return res.status(400).json({ error: 'Сообщение обязательно.' });

  try {
    const result = await pool.query(
      'INSERT INTO messages (user_id, content, created_at, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING message_id, user_id, content, created_at, updated_at',
      [user_id, content]
    );
    const newMessage = result.rows[0];
    io.emit('new message', newMessage);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    res.status(500).json({ error: 'Ошибка сервера.' });
  }
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = user;
    next();
  });
});

io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);
  socket.on('disconnect', () => {
    console.log('Пользователь отключился:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
