const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Create express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'https://chit-chat-tau-ten.vercel.app/',
    methods: ['GET', 'POST']
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../client')));

// Waiting users queue - now storing objects with socket.id and username
let waitingUsers = [];

// Active chat pairs (socket.id -> {partnerId, username})
let chatPairs = new Map();

// User information storage
let users = new Map();

// Connect to Socket.IO
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle username setting
  socket.on('set_username', (data) => {
    const username = data.username || 'Anonymous';

    // Store username
    users.set(socket.id, {
      username: username
    });

    console.log(`User ${socket.id} set username to ${username}`);
    socket.emit('username_set', { success: true });
  });

  // Handle start chat request
  socket.on('start_chat', () => {
    console.log(`${socket.id} is looking for a chat partner`);

    // Check if user has set a username
    if (!users.has(socket.id)) {
      socket.emit('error', { message: 'Please set a username first' });
      return;
    }

    // Check if this user is already in a chat
    if (chatPairs.has(socket.id)) {
      socket.emit('error', { message: 'You are already in a chat' });
      return;
    }

    const username = users.get(socket.id).username;

    // Check if there's someone waiting
    if (waitingUsers.length > 0) {
      // Get the first waiting user
      const partnerId = waitingUsers.shift();
      const partnerSocket = io.sockets.sockets.get(partnerId);

      // Make sure partner is still connected
      if (partnerSocket && users.has(partnerId)) {
        const partnerUsername = users.get(partnerId).username;

        // Create chat pair
        chatPairs.set(socket.id, { partnerId, username: partnerUsername });
        chatPairs.set(partnerId, { partnerId: socket.id, username });

        // Notify both users that chat has started
        socket.emit('chat_started', {
          message: `You are now connected with ${partnerUsername}`,
          partnerUsername: partnerUsername
        });

        partnerSocket.emit('chat_started', {
          message: `You are now connected with ${username}`,
          partnerUsername: username
        });

        console.log(`Chat started between ${username} (${socket.id}) and ${partnerUsername} (${partnerId})`);
      } else {
        // If partner disconnected, remove from waiting list and try again
        waitingUsers = waitingUsers.filter(id => id !== partnerId);
        handleStartChat();
      }
    } else {
      // No one waiting, add to waiting list
      waitingUsers.push(socket.id);
      socket.emit('waiting', { message: 'Looking for someone to chat with...' });
    }
  });

  // Handle sending messages
  socket.on('send_message', (data) => {
    // Check if user is in a chat
    if (!chatPairs.has(socket.id)) {
      socket.emit('error', { message: 'You are not in a chat' });
      return;
    }

    const { partnerId, username } = chatPairs.get(socket.id);
    const partnerSocket = io.sockets.sockets.get(partnerId);

    // Check if partner is still connected
    if (partnerSocket) {
      // Send message to partner with username
      partnerSocket.emit('receive_message', {
        message: data.message,
        timestamp: new Date().toISOString(),
        username: users.get(socket.id).username
      });
    } else {
      // Partner disconnected, end chat
      endChat(socket.id);
      socket.emit('chat_ended', { message: 'Your chat partner disconnected' });
    }
  });

  // Handle disconnect chat (manual or automatic)
  socket.on('disconnect_chat', () => {
    endChat(socket.id);
  });

  // Handle browser disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    endChat(socket.id);

    // Remove from waiting list
    waitingUsers = waitingUsers.filter(id => id !== socket.id);

    // Remove user data
    users.delete(socket.id);
  });

  // Function to end a chat
  function endChat(userId) {
    if (chatPairs.has(userId)) {
      const { partnerId } = chatPairs.get(userId);

      // Notify partner that chat ended
      const partnerSocket = io.sockets.sockets.get(partnerId);
      if (partnerSocket) {
        partnerSocket.emit('chat_ended', { message: 'Your chat partner disconnected' });
      }

      // Remove chat pair
      chatPairs.delete(userId);
      chatPairs.delete(partnerId);

      console.log(`Chat ended between ${userId} and ${partnerId}`);
    }

    // Notify user that chat ended
    socket.emit('chat_ended', { message: 'Chat ended' });
  }
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});