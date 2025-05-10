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

app.post('/api/register', async (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ error: 'Поля логина и пароля обязательны.' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE login = $1', [login]);
        if (userResult.rows.length > 0) {
            return res.status(400).json({ error: 'Логин уже используется.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertQuery = 'INSERT INTO users (login, password) VALUES ($1, $2) RETURNING user_id, login';
        const newUser = await pool.query(insertQuery, [login, hashedPassword]);

        res.status(201).json(newUser.rows[0]);
    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({ error: 'Ошибка сервера.' });
    }
});
app.post('/api/login', async (req, res) => {
    const { login, password } = req.body;
  
    if (!login || !password) {
      return res.status(400).json({ error: 'Поля логина и пароля обязательны.' });
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
  
app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
