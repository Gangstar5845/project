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
    const socket = io("http://localhost:5000", { auth: { token } });
    socketRef.current = socket;
    socket.on('connect', () => {
      console.log("WebSocket подключён, socket id:", socket.id);
    });
    socket.on('new message', (newMessageData) => {
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
    socket.on('message updated', (updatedMessageData) => {
      const created = new Date(updatedMessageData.created_at);
      setMessages(prev =>
        prev.map(m =>
          m.id === updatedMessageData.message_id
            ? { ...m, text: updatedMessageData.content, isEdited: new Date(updatedMessageData.updated_at).getTime() !== created.getTime() }
            : m
        )
      );
    });
    socket.on('message deleted', ({ message_id }) => {
      setMessages(prev => prev.filter(m => String(m.id) !== String(message_id)));
    });
    return () => {
      socket.disconnect();
    };
  }, [currentUser, token]);

  useEffect(() => {
    if (!currentUser || !token) return;
    async function fetchMessages() {
      try {
        const response = await fetch('http://localhost:5000/api/messages', {
          headers: { 'Authorization': 'Bearer ' + token }
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentUser || !token) return;
    if (editingMessage) {
      if (editingMessage.text.trim() === '') return;
      socketRef.current.emit('update message', { message_id: editingMessage.id, content: editingMessage.text, user_id: currentUser.user_id });
      setEditingMessage(null);
    } else {
      if (newMessage.trim() === '') return;
      socketRef.current.emit('send message', { user_id: currentUser.user_id, content: newMessage });
      setNewMessage('');
    }
  };

  const handleContextMenu = (e, messageId, isCurrentUser) => {
    if (!isCurrentUser) return;
    e.preventDefault();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, messageId });
  };

  const handleDeleteMessage = () => {
    const { messageId } = contextMenu;
    socketRef.current.emit('delete message', { message_id: messageId, user_id: currentUser.user_id });
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  const startEditing = (messageId, currentText) => {
    setEditingMessage({ id: messageId, text: currentText });
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  const cancelEditing = () => {
    setEditingMessage(null);
  };

  const handleInputChange = (e) => {
    if (editingMessage) {
      setEditingMessage(prev => ({ ...prev, text: e.target.value }));
    } else {
      setNewMessage(e.target.value);
    }
  };

  const handleCloseContextMenu = useCallback(() => {
    if (contextMenu.visible) setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  }, [contextMenu.visible]);

  useEffect(() => {
    const handleClick = () => {
      handleCloseContextMenu();
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleCloseContextMenu]);

  return (
    <div className="chat-page" onContextMenu={(e) => e.preventDefault()}>
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
            <div className={`chat-message ${msg.isCurrentUser ? 'current-user' : 'other-user'}`} onContextMenu={(e) => handleContextMenu(e, msg.id, msg.isCurrentUser)}>
              <div className="bubble">
                {!msg.isCurrentUser && <span className="sender">{msg.sender}</span>}
                <div className="message-text">{msg.text}</div>
                <div className="message-info">
                  {msg.isEdited && <span className="edited-info">изменено</span>}
                  <span className="time">{msg.time}</span>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      {contextMenu.visible && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <div className="context-menu-item" onClick={handleDeleteMessage}>Удалить</div>
          <div className="context-menu-item" onClick={() => {
            const msg = messages.find(m => m.id === contextMenu.messageId);
            if (msg) startEditing(msg.id, msg.text);
          }}>Изменить</div>
        </div>
      )}
      <footer className="chat-footer">
        {editingMessage && (
          <div className="edit-banner">
            Редактирование
            <button className="cancel-edit" onClick={cancelEditing}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" />
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage}>
          <input 
            type="text" 
            placeholder={editingMessage ? "Редактировать сообщение..." : "Введите сообщение..."}
            value={editingMessage ? editingMessage.text : newMessage}
            onChange={handleInputChange}
          />
          <button type="submit" className="send-button">
            {editingMessage ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 12-12-1.5-1.5z"/>
              </svg>
            ) : (
              sendIcon ? sendIcon : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3v7l15 2-15 2z"/>
                </svg>
              )
            )}
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;
