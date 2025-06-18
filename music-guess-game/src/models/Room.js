const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: String,
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Room expires in 1 hour
  }
});

module.exports = mongoose.model('Room', roomSchema);
