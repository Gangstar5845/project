import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import './ChatPage.css';

const ChatPage = ({ sendIcon, currentUser, token, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!currentUser || !token) return;

    const socket = io("http://localhost:5000", {
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log("WebSocket подключён, socket id:", socket.id);
    });

    socket.on('new message', (newMessageData) => {
      console.log("Новое сообщение:", newMessageData);
      const created = new Date(newMessageData.created_at);
      setMessages(prev => {
        if (prev.some(m => String(m.id) === String(newMessageData.message_id))) return prev;

        return [
          ...prev,
          {
            id: newMessageData.message_id,
            sender: newMessageData.sender || (newMessageData.user_id === currentUser.user_id ? currentUser.login : 'Другой пользователь'),
            text: newMessageData.content,
            date: created.toLocaleDateString('en-GB'),
            time: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isEdited: false,
            isCurrentUser: newMessageData.user_id === currentUser.user_id
          }
        ];
      });
    });

    return () => {
      socket.disconnect();
      console.log("WebSocket отключён");
    };
  }, [currentUser, token]);

  useEffect(() => {
    if (!currentUser || !token) return;
    async function fetchMessages() {
      try {
        const response = await fetch('http://localhost:5000/api/messages', {
          headers: {
            'Authorization': 'Bearer ' + token,
          }
        });
        if (response.ok) {
          const data = await response.json();
          const formattedMessages = data.map(m => {
            const created = new Date(m.created_at);
            const updated = new Date(m.updated_at);
            return {
              id: m.message_id,
              sender: m.sender,
              text: m.content,
              date: created.toLocaleDateString('en-GB'),
              time: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isEdited: updated.getTime() !== created.getTime(),
              isCurrentUser: m.user_id === currentUser.user_id
            };
          });
          setMessages(formattedMessages);
        } else {
          console.error('Ошибка получения сообщений, статус:', response.status);
        }
      } catch (error) {
        console.error('Ошибка получения сообщений:', error);
      }
    }
    fetchMessages();
  }, [currentUser, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!currentUser || !token) return;

    if (editingMessage) {
      if (editingMessage.text.trim() === '') return;
      try {
        const response = await fetch(`http://localhost:5000/api/messages/${editingMessage.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ user_id: currentUser.user_id, content: editingMessage.text })
        });
        if (!response.ok) throw new Error('Ошибка обновления сообщения');
        const updatedMessage = await response.json();
        setMessages(prev =>
          prev.map(m =>
            m.id === editingMessage.id
              ? {
                  ...m,
                  text: updatedMessage.content,
                  isEdited: new Date(updatedMessage.updated_at).getTime() !== new Date(updatedMessage.created_at).getTime()
                }
              : m
          )
        );
        setEditingMessage(null);
      } catch (error) {
        console.error('Ошибка обновления сообщения:', error);
      }
    } else {
      if (newMessage.trim() === '') return;
      try {
        const response = await fetch('http://localhost:5000/api/messages', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ content: newMessage })
        });
        if (!response.ok) throw new Error('Ошибка отправки сообщения');
        const insertedMessage = await response.json();
        const created = new Date(insertedMessage.created_at);
        const messageObj = {
          id: insertedMessage.message_id,
          sender: currentUser.login,
          text: insertedMessage.content,
          date: created.toLocaleDateString('en-GB'),
          time: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEdited: false,
          isCurrentUser: true
        };
        setMessages(prev => {
          if (prev.some(m => String(m.id) === String(messageObj.id))) return prev;
          return [...prev, messageObj];
        });
        setNewMessage('');
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
      }
    }
  };

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h2>Чат</h2>
        <button className="logout-button" onClick={onLogout}>Выйти</button>
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
                  {msg.isEdited && <span className="edited-info">{'изменено'}</span>}
                  <span className="time">{msg.time}</span>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      <footer className="chat-footer">
        <form onSubmit={handleSubmitMessage}>
          <input 
            type="text" 
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="send-button">
            {sendIcon ? sendIcon : "📩"}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;
