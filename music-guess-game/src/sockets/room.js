const Room = require('../models/Room');
const Player = require('../models/Player');
const axios = require('axios');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log("User connected:", socket.id);

    socket.on('createRoom', async ({ username }) => {
    const roomCode = generateRoomCode();

     const player = await Player.create({ username, socketId: socket.id });
     const room = await Room.create({ code: roomCode, players: [player._id] });
         
      socket.join(roomCode);
      await emitPlayersInRoom(roomCode, io);

      console.log(`${username} created room: ${roomCode}`);
      socket.emit('roomCreated', { roomCode });
    });

    socket.on('joinRoom', async ({ username, room }) => {
    const foundRoom = await Room.findOne({ code: room }).populate('players');
    if (!foundRoom) {
    return socket.emit('errorMessage', 'Room not found.');
    }
    const player = await Player.create({ username, socketId: socket.id });
    foundRoom.players.push(player._id);
    await foundRoom.save();

    socket.join(room);
    await emitPlayersInRoom(room, io);

    console.log(`${username} joined room: ${room}`);
    socket.emit('roomJoined', { roomCode: room });
    const alreadyJoined = foundRoom.players.some(p => p.socketId === socket.id);
if (!alreadyJoined) {
  foundRoom.players.push(player._id);
  await foundRoom.save();
}
  });
    socket.on("loadPlaylist", async ({ playlistId, room }) => {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${playlistId}&key=${apiKey}`;

      const { data } = await axios.get(url);
      const songs = data.items.map(item => ({
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
      }));

      // Emit songs list to room (for display or preview)
      io.to(room).emit("playlistLoaded", songs);
    } catch (err) {
      console.error("Error loading playlist:", err.message);
      socket.emit("errorMessage", "Failed to load playlist");
    }
  });

  });
};
const emitPlayersInRoom = async (roomCode, io) => {
  const room = await Room.findOne({ code: roomCode }).populate('players');
  if (!room) return;
  
  const usernames = room.players.map(p => p.username);
  io.to(roomCode).emit('updatePlayers', usernames);
};

function generateRoomCode(length = 6) {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}
