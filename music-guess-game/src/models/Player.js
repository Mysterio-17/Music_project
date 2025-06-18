const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  username: String,
  socketId: String
});

module.exports = mongoose.model('Player', playerSchema);
