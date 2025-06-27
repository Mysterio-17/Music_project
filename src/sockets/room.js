const Room = require('../models/Room');
const Player = require('../models/Player');
const Playlist = require('../models/playlist');
const { generateQuestion } = require('../controllers/aicontroller');
const axios = require('axios');
const { fetchSongsFromPlaylist } = require("../controllers/youtubeController");

const gameData = {};
let currentRounds = {};
let leaderboard = {};

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
      if (!foundRoom) return socket.emit('errorMessage', 'Room not found.');

      const player = await Player.create({ username, socketId: socket.id });
      foundRoom.players.push(player._id);
      await foundRoom.save();

      socket.join(room);
      await emitPlayersInRoom(room, io);
      console.log(`${username} joined room: ${room}`);
      socket.emit('roomJoined', { roomCode: room });
    });

    socket.on("loadPlaylist", async ({ playlistId, room }) => {
      try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${playlistId}&key=${apiKey}`;
        const { data } = await axios.get(url);

        const songs = data.items.map(item => ({
          title: item.snippet.title,
          videoId: item.snippet.resourceId.videoId,
           artist: extractArtistFromTitle(item.snippet.title)
        }));

        const selectedSongs = songs.sort(() => 0.5 - Math.random()).slice(0, 10);
        gameData[room] = { songs: selectedSongs, currentSongIndex: 0 };

        await Playlist.findOneAndDelete({ roomCode: room });
        await Playlist.create({ roomCode: room, songs: selectedSongs });

        console.log(`🎵 Saved ${selectedSongs.length} songs to DB for room: ${room}`);
      } catch (err) {
        console.error("Error loading playlist:", err.message);
        socket.emit("errorMessage", "Failed to load playlist");
      }
    });

    socket.on("startGame", async ({ roomCode }) => {
      const playlist = await Playlist.findOne({ roomCode });
      if (!playlist || playlist.songs.length === 0) {
        return socket.emit("errorMessage", "No playlist found for this room.");
      }

      io.to(roomCode).emit("gameStarted");
      currentRounds[roomCode] = {
        currentSongIndex: 0,
        responses: {}
      };

      startNextRound(roomCode, io, playlist.songs);
    });

    async function startNextRound(roomCode, io, songs) {
      const round = currentRounds[roomCode];
      if (round.currentSongIndex >= songs.length) {
        return io.to(roomCode).emit("gameOver");
      }

      const song = songs[round.currentSongIndex];
      const questionData = await generateQuestion(song, songs, round.currentSongIndex);

      round.correctAnswer = questionData.correctAnswer;
      round.responses = {};
      round.startTime = Date.now();

      io.to(roomCode).emit("newRound", {
        videoId: song.videoId,
        startTime: Math.floor(Math.random() * 40),
        question: questionData.question,
        options: questionData.options
      });

      setTimeout(() => {
        const scores = calculateScores(round.responses, round.startTime, round.correctAnswer);
        updateLeaderboard(roomCode, scores);
        io.to(roomCode).emit("roundEnd", scores);

        round.currentSongIndex++;
        setTimeout(() => startNextRound(roomCode, io, songs), 3000);
      }, 10000);
    }

    socket.on("submitAnswer", ({ roomCode, username, answer }) => {
      const round = currentRounds[roomCode];
      if (!round) return;

      const responseTime = Date.now() - round.startTime;
      round.responses[username] = { answer, time: responseTime };
    });

    function calculateScores(responses, startTime, correctAnswer) {
      const results = [];

      for (const [username, { answer, time }] of Object.entries(responses)) {
        const isCorrect = answer === correctAnswer;
        const timeScore = Math.max(0, 10000 - time);
        const score = isCorrect ? 100 + timeScore / 100 : 0;
        results.push({ username, score: Math.round(score) });
      }

      return results;
    }

    socket.on("readyForGame", ({ roomCode }) => {
      socket.join(roomCode);
    });
  });

  function updateLeaderboard(roomCode, roundScores) {
    if (!leaderboard[roomCode]) leaderboard[roomCode] = {};

    roundScores.forEach(({ username, score }) => {
      leaderboard[roomCode][username] = (leaderboard[roomCode][username] || 0) + score;
    });

    io.to(roomCode).emit("updateLeaderboard", leaderboard[roomCode]);
  }

  async function emitPlayersInRoom(roomCode, io) {
    const room = await Room.findOne({ code: roomCode }).populate('players');
    if (!room) return;

    const usernames = room.players.map(p => p.username);
    io.to(roomCode).emit('updatePlayers', usernames);
  }

  function generateRoomCode(length = 6) {
    return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
  }
};
function extractArtistFromTitle(title) {
  if (!title) return null;
  const parts = title.split(" - ");
  if (parts.length > 1) {
    return parts[1].split("|")[0].trim();
  }
  return null;
}
