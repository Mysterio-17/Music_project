const Playlist = require('../models/SongList');
const Room = require('../models/Room');

const { fetchSongsFromPlaylist } = require('../controllers/playlistController');
const currentRounds = {};
const gameData = {};

function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function generateFakeTitles(correctTitle, songs) {
  const titles = songs
    .map(s => s.title)
    .filter(t => t !== correctTitle && t.length > 3);
  const unique = [...new Set(titles)];
  const randoms = shuffleArray(unique).slice(0, 3);

  const generic = ["Let It Go", "Blinding Lights", "Shape of You", "Bad Guy", "Closer"];
  while (randoms.length < 3) {
    const r = generic[Math.floor(Math.random() * generic.length)];
    if (!randoms.includes(r) && r !== correctTitle) {
      randoms.push(r);
    }
  }
  return randoms;
}

async function startNextRound(roomCode, io, songs) {
  const round = currentRounds[roomCode];
  const song = songs[round.currentSongIndex];

  if (round.isRoundActive || !song) return;

  round.isRoundActive = true;
  round.answered = false;

  const questionData = {
    question: "Guess the name of this song!",
    options: shuffleArray([
      song.title,
      ...generateFakeTitles(song.title, songs)
    ]),
    correctAnswer: song.title
  };

  round.correctAnswer = questionData.correctAnswer;
  round.responses = {};
  round.startTime = Date.now();

  io.to(roomCode).emit("newRound", {
    question: questionData.question,
    options: questionData.options,
    videoId: song.videoId,
    startTime: 0
  });

  setTimeout(() => {
    if (!round.isRoundActive) return;

    io.to(roomCode).emit("roundEnd", round.responses);
    round.isRoundActive = false;

    setTimeout(() => {
      round.currentSongIndex++;
      if (round.currentSongIndex >= songs.length) {
        delete currentRounds[roomCode];
        delete gameData[roomCode];
        return io.to(roomCode).emit("gameOver");
      }
      startNextRound(roomCode, io, songs);
    }, 3000);

  }, 7000); 
}

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log("User connected:", socket.id);

    socket.on("createRoom", async ({ username }) => {
      let roomCode, existing;
      do {
        roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        existing = await Room.findOne({ roomCode });
      } while (existing);

      const room = new Room({ roomCode, host: socket.id, players: [{ socketId: socket.id, username, score: 0 }] });
      await room.save();

      socket.join(roomCode);
      io.to(roomCode).emit("roomCreated", { roomCode, host: socket.id, players: room.players.map(p => p.username) });
      socket.emit("roomCodeAssigned", roomCode);
    });

    socket.on("joinRoom", async ({ username, roomCode }) => {
      try {
        let room = await Room.findOne({ roomCode });
        if (!room) return socket.emit("errorMessage", "Room not found.");

        if (!room.players.some(p => p.username === username)) {
          room.players.push({ socketId: socket.id, username, score: 0 });
          await room.save();
        }

        socket.join(roomCode);
        io.to(roomCode).emit("updatePlayers", room.players.map(p => p.username));
      } catch (err) {
        socket.emit("errorMessage", "Failed to join room.");
      }
    });

    socket.on("loadPlaylist", async ({ playlistId, room }) => {
        console.log(`🎶 Loading playlist ${playlistId} for room ${room}`);
      try {
        const songs = await fetchSongsFromPlaylist(playlistId);
        const selectedSongs = shuffleArray(songs).slice(0, 10);

        gameData[room] = { songs: selectedSongs };
        await Playlist.findOneAndDelete({ roomCode: room });
        await Playlist.create({ roomCode: room, songs: selectedSongs });

        io.to(room).emit("playlistLoaded", selectedSongs.length);
      } catch (err) {
        socket.emit("errorMessage", `Failed to load playlist: ${err.message}`);
      }
    });

    socket.on("startGame", async ({ roomCode }) => {
      const playlist = await Playlist.findOne({ roomCode });
      if (!playlist || playlist.songs.length === 0) return socket.emit("errorMessage", "No playlist found.");

      if (currentRounds[roomCode]?.isGameStarted) return;

      currentRounds[roomCode] = {
        currentSongIndex: 0,
        responses: {},
        isGameStarted: true,
        isRoundActive: false
      };

      io.to(roomCode).emit("gameStarted");
      startNextRound(roomCode, io, playlist.songs);
    });

    socket.on("readyForGame", ({ roomCode }) => {
      socket.join(roomCode);
    });

    socket.on("submitAnswer", ({ roomCode, username, answer }) => {
      const round = currentRounds[roomCode];
      if (!round || !round.isRoundActive || round.responses[username]) return;

      const responseTime = Date.now() - round.startTime;
      round.responses[username] = { answer, time: responseTime };
    });

    socket.on("disconnect", async () => {
      for (const roomCode in currentRounds) {
        const room = await Room.findOne({ roomCode });
        if (room) {
          const before = room.players.length;
          room.players = room.players.filter(p => p.socketId !== socket.id);
          if (room.players.length < before) {
            await room.save();
            io.to(roomCode).emit("updatePlayers", room.players.map(p => p.username));
          }

          if (room.host === socket.id) {
            io.to(roomCode).emit("hostDisconnected", "The host has disconnected.");
            if (room.players.length === 0) {
              await Room.deleteOne({ roomCode });
              await Playlist.deleteOne({ roomCode });
              delete currentRounds[roomCode];
              delete gameData[roomCode];
            }
          }
        }
      }
    });
  });
};
