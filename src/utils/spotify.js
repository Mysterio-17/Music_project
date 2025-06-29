
const axios = require("axios");

let accessToken = null;
let tokenExpiry = null;

async function getSpotifyToken() {
    if (accessToken && Date.now() < tokenExpiry) return accessToken;

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    try {
        const res = await axios.post(
            "https://accounts.spotify.com/api/token",
            new URLSearchParams({ grant_type: "client_credentials" }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization:
                        "Basic " +
                        Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
                },
            }
        );

        accessToken = res.data.access_token;
        tokenExpiry = Date.now() + res.data.expires_in * 1000;
        return accessToken;
    } catch (error) {
        console.error("Error getting Spotify token:", error.message);
        // Add more detailed error logging for debugging
        if (error.response) {
            console.error("Spotify token error response data:", error.response.data);
            console.error("Spotify token error status:", error.response.status);
        }
        return null;
    }
}

async function getArtistFromSpotifyByTitle(title) { 
    try {
        const token = await getSpotifyToken();
        if (!token) return null; 

        const res = await axios.get("https://api.spotify.com/v1/search", { 
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                q: title,
                type: "track",
                limit: 1,
            },
        });

        const tracks = res.data.tracks.items;
        if (tracks.length === 0) return null;

        return tracks[0].artists[0]?.name || null; 
    } catch (error) {
        console.error("Error searching Spotify track:", error.message);
        if (error.response) {
            console.error("Spotify search error response data:", error.response.data);
            console.error("Spotify search error status:", error.response.status);
        }
        return null;
    }
}

module.exports = { getArtistFromSpotifyByTitle }; 