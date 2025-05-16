import React, { useState } from 'react';
import './RegistrationForm.css';

const RegistrationForm = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!login || !password) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Пользователь ${data.login} успешно зарегистрирован!`);
        onRegisterSuccess(data);
      } else {
        setError(data.error || 'Ошибка регистрации.');
      }
    } catch (err) {
      setError('Ошибка подключения к серверу.');
    }
  };

  return (
    <div className="auth-page">
      <header className="chat-header">
        <h2>Чат</h2>
      </header>
      <div className="auth-container">
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="reg-login">Логин</label>
            <input
              type="text"
              id="reg-login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">Пароль</label>
            <input
              type="password"
              id="reg-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button">Зарегистрироваться</button>
        </form>
        <button onClick={onSwitchToLogin} className="switch-button">
          Уже есть аккаунт? Войти
        </button>
      </div>
    </div>
  );
};

export default RegistrationForm;
