const express = require('express');
const Playlist = require('../models/playlist');
const router = express.Router();

router.get('/debug/playlists', async (req, res) => {
  const all = await Playlist.find();
  res.json(all);
});

module.exports = router;