document.addEventListener("DOMContentLoaded", () => {
  const socket = io();
  const urlParams = new URLSearchParams(window.location.search);
  const roomCode = urlParams.get("room");
  const username = urlParams.get("username");
  let latestLeaderboard = {};
  let ytPlayer;
  let interval;
  let answered = false;

  socket.emit("readyForGame", { roomCode, username });

  function startCountdown(seconds) {
    if (interval) clearInterval(interval);
    const timer = document.getElementById("timer");
    let time = seconds;
    timer.textContent = time;

    interval = setInterval(() => {
      time--;
      timer.textContent = time;
      if (time <= 0) clearInterval(interval);
    }, 1000);
  }

  function createPlayer(videoId, startTime) {
    if (!window.YT || !window.YT.Player) {
      console.error("YouTube API not loaded yet");
      return;
    }

    if (ytPlayer) {
      ytPlayer.destroy();
    }

    ytPlayer = new YT.Player("player", {
      height: "0",
      width: "0",
      videoId,
      events: {
        onReady: (event) => {
          event.target.seekTo(startTime, true);
          event.target.playVideo();
        }
      },
      playerVars: {
        autoplay: 0,
        start: startTime,
        end: startTime + 10
      }
    });
  }

  socket.on("newRound", ({ videoId, startTime, question, options }) => {
    console.log("📩 New round received:", { videoId, question, options });

    answered = false;
    document.getElementById("question").textContent = question;

    const opts = document.getElementById("options");
    opts.innerHTML = '';

    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.textContent = opt;
      btn.className = "bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg shadow-md text-lg font-medium transition duration-300 ease-in-out transform hover:-translate-y-1";
      btn.onclick = () => {
        if (document.querySelector(".selected")) return;
        btn.classList.add("bg-green-500", "selected");
        socket.emit("submitAnswer", {
          roomCode,
          username,
          answer: opt
        });
      };
      opts.appendChild(btn);
    });

    createPlayer(videoId, startTime);
    startCountdown(10);
  });

  socket.on("roundEnd", (scores) => {
    console.log("Round ended, scores calculated.");
  });

  socket.on("updateLeaderboard", (leaderboard) => {
    latestLeaderboard = leaderboard;
    const popup = document.getElementById("leaderboardPopup");
    const list = document.getElementById("leaderboardPopupList");
    const currentScore = leaderboard[username] || 0;
    document.getElementById("scoreDisplay").textContent = `Score: ${currentScore}`;

    list.innerHTML = '';
    const sorted = Object.entries(leaderboard).sort((a, b) => b[1] - a[1]).slice(0, 5);

    sorted.forEach(([name, score], i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1}. ${name}: ${score}`;
      list.appendChild(li);
    });

    popup.classList.remove("hidden");
    setTimeout(() => popup.classList.add("show"), 10);

    setTimeout(() => {
      popup.classList.remove("show");
      setTimeout(() => popup.classList.add("hidden"), 500);
    }, 3000);
  });

  socket.on("gameOver", () => {
    const modal = document.getElementById("finalLeaderboard");
    const list = document.getElementById("finalLeaderboardList");

    const sorted = Object.entries(latestLeaderboard).sort((a, b) => b[1] - a[1]);
    list.innerHTML = '';

    sorted.forEach(([name, score], i) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${i + 1}. ${name}</strong>: ${score} points`;
      list.appendChild(li);
    });

    modal.classList.remove("hidden");
    modal.classList.add("show");
  });
});
