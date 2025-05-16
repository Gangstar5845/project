import React, { useState, useEffect } from 'react';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';
import ChatPage from './components/ChatPage';
import './App.css';
import sendIcon from './components/icon.png';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setCurrentUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (data) => {
    setToken(data.token);
    setCurrentUser({ user_id: data.user_id, login: data.login });
    setIsAuthenticated(true);

    localStorage.setItem('token', data.token);
    localStorage.setItem('currentUser', JSON.stringify({ user_id: data.user_id, login: data.login }));
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);

    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  };

  return (
    <div className="App">
      {isAuthenticated && currentUser ? (
        <ChatPage 
          currentUser={currentUser}
          token={token}
          sendIcon={<img src={sendIcon} alt="Send" />}
          onLogout={handleLogout}
        />
      ) : isLogin ? (
        <LoginForm 
          onSwitchToRegister={() => setIsLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <RegistrationForm 
          onSwitchToLogin={() => setIsLogin(true)}
          onRegisterSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

export default App;
  