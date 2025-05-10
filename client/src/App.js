import React, { useState } from 'react';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';
import ChatPage from './components/ChatPage';
import './App.css';
import sendIcon from './components/icon.png';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="App">
            <ChatPage sendIcon={<img src={sendIcon} alt="Send" />} />
      {isAuthenticated ? (
        <ChatPage />
      ) : isLogin ? (
        <LoginForm 
          onSwitchToRegister={() => setIsLogin(false)}
          onLoginSuccess={() => setIsAuthenticated(true)}
        />
      ) : (
        <RegistrationForm 
          onSwitchToLogin={() => setIsLogin(true)}
          onRegisterSuccess={() => setIsAuthenticated(true)}
        />
      )}
    </div>
  );
}

export default App;
