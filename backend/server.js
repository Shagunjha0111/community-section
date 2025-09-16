const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const connectionRoutes = require('./routes/connections');
const requestRoutes = require('./routes/connectionRequests');
const simpleConnRoutes = require('./routes/simpleConn');
const chatRoutes = require('./routes/chat');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = 5000;

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/conn', simpleConnRoutes);
app.use('/api/chat', chatRoutes);

// WebSocket connection handling
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their userId
  socket.on('join', (userId) => {
    connectedUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} joined with socket ${socket.id}`);
  });

  // Handle private messages
  socket.on('private_message', (data) => {
    const { toUserId, message, fromUserId, fromUserName } = data;
    
    // Save message to CSV
    const messageData = {
      id: Date.now().toString(),
      fromUserId,
      fromUserName,
      toUserId,
      message,
      timestamp: new Date().toISOString()
    };
    
    // Save to CSV file
    const chatMessagesPath = path.join(__dirname, 'chat_messages.csv');
    const csvLine = `${messageData.id},${messageData.fromUserId},${messageData.fromUserName},${messageData.toUserId},${messageData.message},${messageData.timestamp}\n`;
    
    if (!fs.existsSync(chatMessagesPath)) {
      const header = 'id,fromUserId,fromUserName,toUserId,message,timestamp\n';
      fs.writeFileSync(chatMessagesPath, header);
    }
    fs.appendFileSync(chatMessagesPath, csvLine);

    // Send to recipient if online
    const recipientSocketId = connectedUsers.get(toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('new_message', messageData);
    }
    
    // Send to sender as well to keep UI in sync
    io.to(socket.id).emit('new_message', messageData);
    // Optional explicit confirmation
    socket.emit('message_sent', messageData);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { toUserId, fromUserId, fromUserName } = data;
    const recipientSocketId = connectedUsers.get(toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('user_typing', { fromUserId, fromUserName });
    }
  });

  socket.on('stop_typing', (data) => {
    const { toUserId } = data;
    const recipientSocketId = connectedUsers.get(toUserId);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('user_stop_typing', { fromUserId: socket.userId });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      connectedUsers.delete(socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));