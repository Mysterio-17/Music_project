const axios = require("axios");

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function fetchSongsFromPlaylist(playlistId) {
  const songs = [];
  let nextPageToken = '';
  try {
    while (songs.length < 100 && nextPageToken !== null) {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const res = await axios.get(url);

      const items = res.data.items;
      items.forEach((item) => {
        const title = item.snippet.title;
        const videoId = item.snippet.resourceId.videoId;
        const artist = item.snippet.channelTitle; 
        songs.push({ title, videoId });
      });

      nextPageToken = res.data.nextPageToken || null;
    }

    return songs;
  } catch (err) {
    console.error("YouTube API error:", err.message);
    return [];
  }
}

async function fetchChannelTitle(videoId) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const res = await axios.get(url);
    return res.data.items[0]?.snippet?.channelTitle || "Unknown Artist";
  } catch (err) {
    console.error("Failed to fetch channel title:", err.message);
    return "Unknown Artist";
  }
}

module.exports = { fetchSongsFromPlaylist, fetchChannelTitle };
