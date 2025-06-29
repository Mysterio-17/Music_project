const mongoose = require('mongoose');

const SongSchema = new mongoose.Schema({
  title: String,
  videoId: String,
});

const PlaylistSchema = new mongoose.Schema({
  roomCode: String,
  songs: [SongSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SongList', PlaylistSchema);
