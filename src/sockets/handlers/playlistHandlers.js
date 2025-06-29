const Playlist = require('../../models/playlist');
const { fetchSongsFromPlaylist } = require("../../controllers/youtubeController");
const getAccurateArtistFromTitle = require("../../utils/extractArtist");

const gameData = {};

module.exports = {
  gameData, 
  async loadPlaylist(socket, { playlistId, room }) {
    try {
      const songs = await fetchSongsFromPlaylist(playlistId);

      const songsWithArtists = await Promise.all(
        songs.map(async (song) => {
          let artist = song.artist?.trim();
          if (!artist || artist.toLowerCase().includes("unknown")) {
            artist = getAccurateArtistFromTitle(song.title);
          }
          return { ...song, artist: artist || "Unknown Artist" };
        })
      );

      const selectedSongs = songsWithArtists.sort(() => 0.5 - Math.random()).slice(0, 10);
      gameData[room] = { songs: selectedSongs, currentSongIndex: 0 };

      await Playlist.findOneAndDelete({ roomCode: room });
      await Playlist.create({ roomCode: room, songs: selectedSongs });

      console.log(`🎶 Saved ${selectedSongs.length} songs to DB for room: ${room}`);
    } catch (err) {
      console.error("Error loading playlist:", err.message);
      socket.emit("errorMessage", "Failed to load playlist");
    }
  }
};
