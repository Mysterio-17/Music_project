function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

exports.generateQuestion = async (song, allSongs) => {
  const correctArtist = song.artist || "Unknown Artist";

  const wrongArtists = allSongs
    .filter(s => s.artist && 
            s.artist !== correctArtist && 
            s.artist !== "Unknown Artist" &&
            s.artist.trim().length > 0)
    .map(s => s.artist);

  let shuffledWrong = shuffleArray([...new Set(wrongArtists)]).slice(0, 3);

  const genericOptions = [
    "Taylor Swift", "Ed Sheeran", "Ariana Grande", 
    "Drake", "The Weeknd", "Billie Eilish"
  ];
  
  while (shuffledWrong.length < 3) {
    const randomOption = genericOptions[Math.floor(Math.random() * genericOptions.length)];
    if (!shuffledWrong.includes(randomOption) && randomOption !== correctArtist) {
      shuffledWrong.push(randomOption);
    }
  }

  const artistOptions = shuffleArray([correctArtist, ...shuffledWrong]);

  return {
    question: `Who is the artist of "${song.title}"?`,
    options: artistOptions,
    correctAnswer: correctArtist
  };
};