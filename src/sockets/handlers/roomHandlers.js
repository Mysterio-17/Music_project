const Room = require('../../models/Room');
const Player = require('../../models/Player');

module.exports = {
  async createRoom(socket, { username }, io) {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const player = await Player.create({ username, socketId: socket.id });
    const room = await Room.create({ code: roomCode, players: [player._id] });

    socket.join(roomCode);
    await emitPlayersInRoom(roomCode, io);
    socket.emit('roomCreated', { roomCode });
  },

  async joinRoom(socket, { username, room }, io) {
    const foundRoom = await Room.findOne({ code: room }).populate('players');
    if (!foundRoom) return socket.emit('errorMessage', 'Room not found.');

    const player = await Player.create({ username, socketId: socket.id });
    foundRoom.players.push(player._id);
    await foundRoom.save();

    socket.join(room);
    await emitPlayersInRoom(room, io);
    socket.emit('roomJoined', { roomCode: room });
  },
};

async function emitPlayersInRoom(roomCode, io) {
  const room = await Room.findOne({ code: roomCode }).populate('players');
  if (!room) return;
  const usernames = room.players.map(p => p.username);
  io.to(roomCode).emit('updatePlayers', usernames);
}
