const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static('public'));
const debugRoutes = require('./src/routes/debug');
app.use(debugRoutes);


const roomSockets = require('./src/sockets/room');
roomSockets(io);


// Socket setup
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB Connected');
}).catch((err) => {
  console.error('❌ MongoDB Connection Error:', err);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
