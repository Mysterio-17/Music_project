function extractArtistFromTitle(title) {
  if (!title) return "Unknown Artist";

  title = title.replace(/ *\([^)]*\) */g, "")  
               .replace(/ *\[[^\]]*\] */g, "")   
               .replace(/(official|video|lyrics|HD|4K|remix|audio)/gi, "")
               .replace(/ft\.|feat\.|featuring/gi, "") 
               .replace(/[\u{1F600}-\u{1F64F}]/gu, "") 
               .trim();

  const separators = [' - ', ' | ', ': ', ' – '];
  for (const sep of separators) {
    if (title.includes(sep)) {
      const parts = title.split(sep);
      if (parts[0].length > 1) {
        return parts[0].trim();
      }
    }
  }

  return "Unknown Artist";
}

module.exports = extractArtistFromTitle;