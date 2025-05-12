import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatPage.css';

const ChatPage = ({ sendIcon, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, messageId: null });
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    async function fetchMessages() {
      try {
        const response = await fetch('http://localhost:5000/api/messages');
        if (response.ok) {
          const data = await response.json();
          const formattedMessages = data.map(m => {
            const created = new Date(m.created_at);
            const updated = new Date(m.updated_at);
            const isEdited = updated.getTime() !== created.getTime();
            return {
              id: m.message_id,
              sender: m.sender,
              text: m.content,
              date: created.toLocaleDateString('en-GB'),
              time: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isEdited,
              isCurrentUser: m.user_id === currentUser.user_id
            };
          });
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

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (editingMessage) {
      if (editingMessage.text.trim() === '') return;
      try {
        const response = await fetch(`http://localhost:5000/api/messages/${editingMessage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.user_id, content: editingMessage.text })
        });
        if (!response.ok) throw new Error('Error updating message');
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
        console.error('Error updating message:', error);
      }
    } else {
      if (newMessage.trim() === '') return;
      try {
        const response = await fetch('http://localhost:5000/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: currentUser.user_id, content: newMessage })
        });
        if (!response.ok) throw new Error('Error sending message');
        const insertedMessage = await response.json();
        const created = new Date(insertedMessage.created_at);
        const updated = new Date(insertedMessage.updated_at);
        const messageObj = {
          id: insertedMessage.message_id,
          sender: currentUser.login,
          text: insertedMessage.content,
          date: created.toLocaleDateString('en-GB'),
          time: created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isEdited: updated.getTime() !== created.getTime(),
          isCurrentUser: true
        };
        setMessages(prev => [...prev, messageObj]);
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleContextMenu = (e, messageId, isCurrentUser) => {
    if (!isCurrentUser) return;
    e.preventDefault();
    setContextMenu({ visible: true, x: e.pageX, y: e.pageY, messageId });
  };

  const handleDeleteMessage = async () => {
    const id = contextMenu.messageId;
    try {
      const response = await fetch(`http://localhost:5000/api/messages/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.user_id })
      });
      if (!response.ok) throw new Error('Error deleting message');
      setMessages(prev => prev.filter(m => m.id !== id));
      setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const startEditing = (messageId, currentText) => {
    setEditingMessage({ id: messageId, text: currentText });
    setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  };

  const handleCloseContextMenu = useCallback(() => {
    if (contextMenu.visible) setContextMenu({ visible: false, x: 0, y: 0, messageId: null });
  }, [contextMenu.visible]);

  useEffect(() => {
    const handleClick = () => { handleCloseContextMenu(); };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [handleCloseContextMenu]);

  const handleInputChange = (e) => {
    if (editingMessage) {
      setEditingMessage(prev => ({ ...prev, text: e.target.value }));
    } else {
      setNewMessage(e.target.value);
    }
  };

  const cancelEditing = () => {
    setEditingMessage(null);
  };

  return (
    <div className="chat-page" onContextMenu={(e) => e.preventDefault()}>
      <header className="chat-header">
        <h2>Чат релиз</h2>
      </header>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <React.Fragment key={msg.id}>
            {(index === 0 || msg.date !== messages[index - 1].date) && (
              <div className="message-date">{msg.date}</div>
            )}
            <div className={`chat-message ${msg.isCurrentUser ? 'current-user' : 'other-user'}`}
                 onContextMenu={(e) => handleContextMenu(e, msg.id, msg.isCurrentUser)}>
              <div className="bubble">
                {!msg.isCurrentUser && <span className="sender">{msg.sender}</span>}
                <div className="message-text">{msg.text}</div>
                <div className="message-info">
                  {msg.isEdited && (
                    <span className={`edited-info ${msg.isCurrentUser ? '' : 'edited-info-other'}`}>изменено</span>
                  )}
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
        <form onSubmit={handleSubmitMessage}>
          <input 
            type="text" 
            placeholder={editingMessage ? "Редактировать сообщение..." : "Введите сообщение..."}
            value={editingMessage ? editingMessage.text : newMessage}
            onChange={handleInputChange}
          />
          <button type="submit" className="send-button">
            {editingMessage ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.2l-3.5-3.5L4 14.2l5 5 12-12-1.5-1.5z" />
              </svg>
            ) : (
              sendIcon ? sendIcon : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3v7l15 2-15 2z" />
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
