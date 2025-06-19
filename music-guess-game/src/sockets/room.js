const Room = require('../models/Room');
const Player = require('../models/Player');

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
