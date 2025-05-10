import React, { useState } from 'react';
import './ChatPage.css';

const ChatPage = ({ sendIcon }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'Alice', text: 'Привет! Как дела?', date: '10/05/2025', time: '10:00 AM', isCurrentUser: false },
    { id: 2, sender: 'Вы', text: 'Отлично, спасибо! А у тебя?', date: '10/05/2025', time: '10:01 AM', isCurrentUser: true },
    { id: 3, sender: 'Bob', text: 'Пошли обсудим проект?', date: '10/05/2025', time: '10:02 AM', isCurrentUser: false }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if(newMessage.trim() === '') return;
    const now = new Date();
    const message = {
      id: messages.length + 1,
      sender: 'Вы',
      text: newMessage,
      date: now.toLocaleDateString('en-GB'),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCurrentUser: true
    };
    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h2>Чат</h2>
      </header>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <React.Fragment key={msg.id}>
            {(index === 0 || msg.date !== messages[index - 1].date) && (
              <div className="message-date">{msg.date}</div>
            )}
            <div className={`chat-message ${msg.isCurrentUser ? 'current-user' : 'other-user'}`}>
              <div className="bubble">
                {!msg.isCurrentUser && <span className="sender">{msg.sender}</span> }
                <div className="message-text">{msg.text}</div>
                <div className="message-info">
                  <span className="time">{msg.time}</span>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
      <footer className="chat-footer">
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="send-button">
            {sendIcon ? sendIcon : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3v7l15 2-15 2z" />
              </svg>
            )}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;
