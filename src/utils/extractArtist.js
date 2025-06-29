const { getArtistFromSpotifyByTitle } = require("./spotify");

async function getAccurateArtistFromTitle(title) {
  if (!title) return "Unknown Artist";

  const spotifyArtist = await getArtistFromSpotifyByTitle(title);
   if (spotifyArtist) {
        console.log(`🎵 Spotify found artist for "${title}": ${spotifyArtist}`); // Debug log
        return spotifyArtist;
    }
    console.log(`🔍 Spotify did not find artist for "${title}", falling back to title parsing.`);
  title = title
    .replace(/ *\([^)]*\) */g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/(official|video|lyrics|HD|4K|remix|audio)/gi, "")
    .replace(/(ft\.|feat\.|featuring)/gi, "")
    .replace(/[\u{1F600}-\u{1F64F}]/gu, "")
    .trim();

  const separators = [' - ', '|', ':', '–', '—'];
  for (const sep of separators) {
    if (title.includes(sep)) {
      const parts = title.split(sep);
      if (parts[0].length > 1){
        console.log(`🎨 Parsed artist from title "${title}": ${parts[0].trim()}`);
         return parts[0].trim();
      }
    }
  }
  console.log(`❓ Could not determine artist for "${title}", returning "Unknown Artist".`);
  return "Unknown Artist";
}

module.exports = getAccurateArtistFromTitle;
