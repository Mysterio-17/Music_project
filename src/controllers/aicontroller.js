const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.generateQuestion = async (songTitle) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `
You are a quiz generator. Given a Bollywood song title, you must create a trivia question about the artist, genre, year, or mood. 
The output must be valid JSON like this:
{
  "question": "Who is the artist of 'Tum Se Hi'?",
  "options": ["Atif Aslam", "Arijit Singh", "KK", "Mohit Chauhan"],
  "answer": "Mohit Chauhan"
}
Only give the JSON object. No explanation.

Song: "${songTitle}"
`;


  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    return {
      question: data.question || `Who is the artist of "${songTitle}"?`,
      options: shuffleArray(data.options),
      correctAnswer: data.answer
    };
  } catch (err) {
    console.error("Gemini API error:", err.message);
    return {
      question: `Who is the artist of "${songTitle}"?`,
      options: ["Correct Artist", "Wrong A", "Wrong B", "Wrong C"],
      correctAnswer: "Correct Artist"
    };
  }
};

function shuffleArray(array) {
  return array.sort(() => 0.5 - Math.random());
}
