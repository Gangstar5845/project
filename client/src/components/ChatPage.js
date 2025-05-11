import React, { useState, useEffect, useRef } from 'react';
import './ChatPage.css';

const ChatPage = ({ sendIcon, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    async function fetchMessages() {
      try {
        const response = await fetch('http://localhost:5000/api/messages');
        if (response.ok) {
          const data = await response.json();
          const formattedMessages = data.map(m => ({
            id: m.message_id,
            sender: m.sender,
            text: m.content,
            date: new Date(m.created_at).toLocaleDateString('en-GB'),
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isCurrentUser: m.user_id === currentUser.user_id
          }));
          setMessages(formattedMessages);
        } else {
          console.error('Error fetching messages, status:', response.status);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    }
    fetchMessages();
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    try {
      const response = await fetch('http://localhost:5000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.user_id, content: newMessage })
      });
      if (!response.ok) throw new Error('Error sending message');
      const insertedMessage = await response.json();
      const messageObj = {
        id: insertedMessage.message_id,
        sender: currentUser.login,
        text: insertedMessage.content,
        date: new Date(insertedMessage.created_at).toLocaleDateString('en-GB'),
        time: new Date(insertedMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCurrentUser: true
      };
      setMessages(prev => [...prev, messageObj]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
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
                {!msg.isCurrentUser && <span className="sender">{msg.sender}</span>}
                <div className="message-text">{msg.text}</div>
                <div className="message-info">
                  <span className="time">{msg.time}</span>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
        <div ref={messagesEndRef}></div>
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
