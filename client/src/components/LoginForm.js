import React, { useState } from 'react';
import './RegistrationForm.css';

const LoginForm = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!login || !password) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(`Пользователь ${data.login} успешно вошёл!`);
        onLoginSuccess();
      } else {
        setError(data.error || 'Ошибка авторизации.');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Вход</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label htmlFor="login">Логин</label>
          <input
            type="text"
            id="login"
            placeholder="Введите логин"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <input
            type="password"
            id="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="auth-button">Войти</button>
      </form>
      <button onClick={onSwitchToRegister} className="switch-button">
        Нет аккаунта? Зарегистрироваться
      </button>
    </div>
  );
};

export default LoginForm;
