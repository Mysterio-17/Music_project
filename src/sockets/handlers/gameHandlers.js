const Playlist = require('../../models/playlist');
const { generateQuestion } = require("../../controllers/aicontroller");
const { gameData } = require('./playlistHandlers');

const currentRounds = {};
const leaderboard = {};

module.exports = {
  async startGame(io, socket, { roomCode }) {
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
  },

  submitAnswer({ roomCode, username, answer }) {
    const round = currentRounds[roomCode];
    if (!round) return;
    const responseTime = Date.now() - round.startTime;
    round.responses[username] = { answer, time: responseTime };
  },

  readyForGame(socket, { roomCode }) {
    socket.join(roomCode);
  }
};

async function startNextRound(roomCode, io, songs) {
  const round = currentRounds[roomCode];
  if (round.isRoundActive) return;

  if (round.currentSongIndex >= songs.length) {
    delete currentRounds[roomCode];
    return io.to(roomCode).emit("gameOver");
  }

  round.isRoundActive = true;
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
    round.isRoundActive = false;
    const scores = calculateScores(round.responses, round.startTime, round.correctAnswer);
    updateLeaderboard(io, roomCode, scores);
    io.to(roomCode).emit("roundEnd", scores);

    round.currentSongIndex++;
    setTimeout(() => startNextRound(roomCode, io, songs), 3000);
  }, 10000);
}

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

function updateLeaderboard(io, roomCode, roundScores) {
  if (!leaderboard[roomCode]) leaderboard[roomCode] = {};
  roundScores.forEach(({ username, score }) => {
    leaderboard[roomCode][username] = (leaderboard[roomCode][username] || 0) + score;
  });
  io.to(roomCode).emit("updateLeaderboard", leaderboard[roomCode]);
}
