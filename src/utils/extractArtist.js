function extractArtistFromTitle(title) {
  if (!title) return "Unknown Artist";
  
  let artist = null;
  
  if (title.includes(" - ")) {
    const parts = title.split(" - ");
    artist = parts[0].trim();
  }
  else if (title.includes(": ")) {
    const parts = title.split(": ");
    artist = parts[0].trim();
  }
  else {
    const match = title.match(/\(([^)]+)\)|\[([^\]]+)\]/);
    if (match) {
      artist = (match[1] || match[2]).trim();
    }
  }
  
  if (artist) {
    artist = artist
      .replace(/\(official.*\)/gi, '')
      .replace(/\[official.*\]/gi, '')
      .replace(/official.*video/gi, '')
      .replace(/HD|4K|lyrics/gi, '')
      .trim();
  }
  
  return artist || "Unknown Artist";
}
module.exports = extractArtistFromTitle;