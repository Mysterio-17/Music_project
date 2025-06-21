const Room = require('../models/Room');
const Player = require('../models/Player');
const Playlist = require('../models/playlist');

const axios = require('axios');
const gameData = {};
const { fetchSongsFromPlaylist } = require("../controllers/youtubeController");


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
      const selectedSongs = getRandomTenSongs(songs);
      gameData[room] = {
      songs: selectedSongs,
      currentSongIndex: 0,
      };
      await Playlist.findOneAndDelete({ roomCode: room });
      await Playlist.create({
      roomCode: room,
      songs: selectedSongs,
      });

      console.log(`🎵 Saved ${selectedSongs.length} songs to MongoDB for room: ${room}`);
    } catch (err) {
      console.error("Error loading playlist:", err.message);
      socket.emit("errorMessage", "Failed to load playlist");
    }
  });
    function getRandomTenSongs(songs) {
    const shuffled = songs.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  }

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


