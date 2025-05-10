import React, { useState } from 'react';
import RegistrationForm from './components/RegistrationForm';
import LoginForm from './components/LoginForm';
import ChatPage from './components/ChatPage';
import './App.css';
import sendIcon from './components/icon.png';

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  console.log('isAuthenticated:', isAuthenticated, 'currentUser:', currentUser);

  return (
    <div className="App">
      {isAuthenticated && currentUser ? (
        <ChatPage 
          currentUser={currentUser}
          sendIcon={<img src={sendIcon} alt="Send" />} 
        />
      ) : isLogin ? (
        <LoginForm 
          onSwitchToRegister={() => setIsLogin(false)}
          onLoginSuccess={(user) => {
            console.log('Login success:', user);
            setCurrentUser(user);
            setIsAuthenticated(true);
          }}
        />
      ) : (
        <RegistrationForm 
          onSwitchToLogin={() => setIsLogin(true)}
          onRegisterSuccess={(user) => {
            console.log('Register success:', user);
            setCurrentUser(user);
            setIsAuthenticated(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
