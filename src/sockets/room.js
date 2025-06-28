const roomHandlers = require('./handlers/roomHandlers');
const gameHandlers = require('./handlers/gameHandlers');
const playlistHandler = require('./handlers/playlistHandlers');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log("User connected:", socket.id);

    socket.on("createRoom", (data) => roomHandlers.createRoom(socket, data, io));
    socket.on("joinRoom", (data) => roomHandlers.joinRoom(socket, data, io));
    socket.on("loadPlaylist", (data) => playlistHandler.loadPlaylist(socket, data));
    socket.on("startGame", (data) => gameHandlers.startGame(io, socket, data));
    socket.on("submitAnswer", gameHandlers.submitAnswer);
    socket.on("readyForGame", (data) => gameHandlers.readyForGame(socket, data));
  });
};
