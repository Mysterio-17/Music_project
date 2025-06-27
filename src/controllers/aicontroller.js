exports.generateQuestion = async (song, allSongs) => {
  const correctArtist = song.artist;

  const wrongArtists = allSongs
    .filter(s => s.artist && s.artist !== correctArtist)
    .map(s => s.artist);

  let shuffledWrong = shuffleArray([...new Set(wrongArtists)]).slice(0, 3);

  while (shuffledWrong.length < 3) {
    shuffledWrong.push("Unknown Artist " + (shuffledWrong.length + 1));
  }

  const artistOptions = shuffleArray([correctArtist, ...shuffledWrong]);

  return {
    question: `Who is the artist of "${song.title}"?`,
    options: artistOptions,
    correctAnswer: correctArtist
  };
};

function shuffleArray(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}
