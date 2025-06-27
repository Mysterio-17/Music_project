// const socket = io();
// const urlParams = new URLSearchParams(window.location.search);
// const roomCode = urlParams.get("room");
// const username = urlParams.get("username");

// const questionEl = document.getElementById("question");
// const optionsEl = document.getElementById("options");
// const timerEl = document.getElementById("timer");
// const audioEl = document.getElementById("song-player");
// const scoreEl = document.getElementById("score-feedback");

// let selected = false;
// let roundStartTime;

// socket.emit("readyForGame", { roomCode, username });

// socket.on("newRound", ({ videoId, startTime, question, options }) => {
//   selected = false;
//   questionEl.textContent = question;
//   optionsEl.innerHTML = "";
//   scoreEl.textContent = "";
//   roundStartTime = Date.now();

//   options.forEach((opt) => {
//     const btn = document.createElement("button");
//     btn.textContent = opt;
//     btn.classList.add("option-btn");
//     btn.onclick = () => {
//       if (selected) return;
//       selected = true;
//       const time = Date.now() - roundStartTime;
//       socket.emit("submitAnswer", {
//         roomCode,
//         username,
//         answer: opt,
//         time,
//       });
//       btn.classList.add("selected");
//     };
//     optionsEl.appendChild(btn);
//   });

//   audioEl.src = `https://www.youtube.com/embed/${videoId}?start=${startTime}&autoplay=1`;
//   startCountdown(10);
// });

// socket.on("roundEnd", (scores) => {
//   const userScore = scores.find(s => s.username === username);
//   scoreEl.textContent = `You scored: ${userScore?.score || 0}`;
// });

// function startCountdown(duration) {
//   let time = duration;
//   timerEl.textContent = time;
//   const interval = setInterval(() => {
//     time--;
//     timerEl.textContent = time;
//     if (time <= 0) clearInterval(interval);
//   }, 1000);
// }