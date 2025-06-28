const axios = require("axios");

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function fetchChannelTitle(videoId) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
  const response = await axios.get(url);
  return response?.data?.items?.[0]?.snippet?.channelTitle || null;
}

module.exports = fetchChannelTitle;
