import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Navbar from './Navbar';
import './Chat.css';

const Chat = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  useEffect(() => {
    // Get current user from localStorage and normalize if needed
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Legacy format from previous login implementation
          const normalized = {
            id: String(parsed[0]),
            name: parsed[1],
            email: parsed[2],
            password: parsed[3],
            phone: parsed[4],
            location: parsed[5],
            interests: parsed[6],
            type: parsed[7],
            achievements: parsed[8]
          };
          setCurrentUser(normalized);
          localStorage.setItem('user', JSON.stringify(normalized));
        } else {
          setCurrentUser(parsed);
        }
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join with current user ID only after socket connects
    newSocket.on('connect', () => {
      if (currentUser && currentUser.id) {
        newSocket.emit('join', currentUser.id);
      }
    });

    // Socket event listeners
    newSocket.on('new_message', (messageData) => {
      setMessages(prev => [...prev, messageData]);
    });

    // Confirm sent messages appear instantly for the sender
    newSocket.on('message_sent', (messageData) => {
      setMessages(prev => [...prev, messageData]);
    });

    newSocket.on('user_typing', (data) => {
      setTypingUsers(prev => [...prev.filter(u => u.fromUserId !== data.fromUserId), data]);
    });

    newSocket.on('user_stop_typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u.fromUserId !== data.fromUserId));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    // Load user connections
    if (currentUser && currentUser.id) {
      loadConnections();
    }
  }, [currentUser]);

  useEffect(() => {
    // Load chat history when connection is selected
    if (selectedConnection && currentUser) {
      loadChatHistory();
    }
  }, [selectedConnection, currentUser]);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const loadConnections = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/connections`);
      const userConnections = response.data.filter(
        conn => conn.fromUserId === currentUser.id || conn.toUserId === currentUser.id
      );
      setConnections(userConnections);
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const otherUserId = selectedConnection.fromUserId === currentUser.id 
        ? selectedConnection.toUserId 
        : selectedConnection.fromUserId;
      
      const response = await axios.get(`${API_BASE_URL}/chat/history/${currentUser.id}/${otherUserId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConnection || !socket) return;

    const otherUserId = selectedConnection.fromUserId === currentUser.id 
      ? selectedConnection.toUserId 
      : selectedConnection.fromUserId;

    const messageData = {
      toUserId: otherUserId,
      message: newMessage.trim(),
      fromUserId: currentUser.id,
      fromUserName: currentUser.name
    };

    socket.emit('private_message', messageData);
    setNewMessage('');
  };

  const handleTyping = () => {
    if (!selectedConnection || !socket) return;

    const otherUserId = selectedConnection.fromUserId === currentUser.id 
      ? selectedConnection.toUserId 
      : selectedConnection.fromUserId;

    socket.emit('typing', {
      toUserId: otherUserId,
      fromUserId: currentUser.id,
      fromUserName: currentUser.name
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { toUserId: otherUserId });
    }, 1000);
  };

  const getOtherUserName = (connection) => {
    return connection.fromUserId === currentUser.id 
      ? connection.toUserName 
      : connection.fromUserName;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentUser) {
    return <div className="chat-container">Please log in to access chat.</div>;
  }

  return (
    <div>
      <Navbar />
      <div className="chat-container">
        <div className="chat-sidebar">
        <h3>Connections</h3>
        <div className="connections-list">
          {connections.length === 0 ? (
            <p className="no-connections">No connections found. Connect with users to start chatting!</p>
          ) : (
            connections.map((connection) => {
              const otherUserName = getOtherUserName(connection);
              const isSelected = selectedConnection && 
                ((selectedConnection.fromUserId === connection.fromUserId && selectedConnection.toUserId === connection.toUserId) ||
                 (selectedConnection.fromUserId === connection.toUserId && selectedConnection.toUserId === connection.fromUserId));

              return (
                <div
                  key={`${connection.fromUserId}-${connection.toUserId}`}
                  className={`connection-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedConnection(connection)}
                >
                  <div className="connection-avatar">
                    {otherUserName.charAt(0).toUpperCase()}
                  </div>
                  <div className="connection-info">
                    <div className="connection-name">{otherUserName}</div>
                    <div className="connection-status">Connected</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="chat-main">
        {selectedConnection ? (
          <>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="chat-user-avatar">
                  {getOtherUserName(selectedConnection).charAt(0).toUpperCase()}
                </div>
                <div className="chat-user-details">
                  <h4>{getOtherUserName(selectedConnection)}</h4>
                  <span className="chat-status">Online</span>
                </div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.fromUserId === currentUser.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <div className="message-text">{message.message}</div>
                    <div className="message-time">{formatTime(message.timestamp)}</div>
                  </div>
                </div>
              ))}
              
              {typingUsers.length > 0 && (
                <div className="typing-indicator">
                  <span>{typingUsers[0].fromUserName} is typing...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows="1"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="send-button"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="chat-placeholder">
            <div className="placeholder-content">
              <h3>Select a connection to start chatting</h3>
              <p>Choose from your connections list to begin a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default Chat;
