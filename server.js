const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

if (!process.env.YOUTUBE_API_KEY) {
  console.error('❌ YOUTUBE_API_KEY is required');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is required');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
const debugRoutes = require('./src/routes/debug');
app.use(debugRoutes);


const roomSockets = require('./src/sockets/room');
roomSockets(io);


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
