const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  username: String,
  socketId: String,
  score: {
    type: Number,
    default: 0
  }
});

const roomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  host: String,
  players: [playerSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 
  }
});

module.exports = mongoose.model('Room', roomSchema);
