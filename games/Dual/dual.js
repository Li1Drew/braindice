let score = 0;
let level = 1;
let lives = 3;
let stability = 60;
let gameActive = false;
let currentEq = { isCorrect: true };
let stabilityInterval;

// Метрики для бекенду
let totalAttempts = 0;
let successfulActions = 0;
let gameStartedAt = null;

const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const stabilityBar = document.getElementById("stabilityBar");
const equationEl = document.getElementById("equation");
const startTrigger = document.getElementById('startTrigger');
const gameContent = document.getElementById('gameContent');
const instruction = document.getElementById("instruction");
const leaderboardList = document.getElementById("leaderboardList");

function startGame() {
  startTrigger.classList.add('hidden');
  gameContent.classList.remove('hidden');
  
  gameActive = true;
  stability = 60;
  score = 0; 
  level = 1; 
  lives = 3;
  
  totalAttempts = 0;
  successfulActions = 0;
  gameStartedAt = Date.now();
  
  levelEl.textContent = level;
  livesEl.textContent = "❤️❤️❤️";
  instruction.textContent = "Тримай баланс у зеленій зоні та вирішуй завдання!";
  instruction.style.color = "var(--text-muted)";
  
  startStabilityDrain();
  spawnEquation();
}

startTrigger.onclick = startGame;

function startStabilityDrain() {
  stabilityInterval = setInterval(() => {
    if (!gameActive) return;

    const drain = 0.8 + (level * 0.2);
    stability -= drain;

    updateStabilityUI();

    if (stability <= 0 || stability >= 100) {
      handleMistake("Збій реактора!");
      stability = 60;
    }
  }, 100);
}

document.getElementById("stabilizeBtn").onclick = () => {
  if (!gameActive) return;
  stability = Math.min(100, stability + 8);
  updateStabilityUI();
};

function updateStabilityUI() {
  stabilityBar.style.width = `${stability}%`;

  if (stability >= 40 && stability <= 80) {
    stabilityBar.style.backgroundColor = "#22c55e"; 
  } else {
    stabilityBar.style.backgroundColor = "#f59e0b"; 
    if (stability < 15 || stability > 90) stabilityBar.style.backgroundColor = "#ef4444"; 
  }
}

function spawnEquation() {
  if (!gameActive) return;

  const maxNum = 10 + (level * 2);
  const a = Math.floor(Math.random() * maxNum) + 1;
  const b = Math.floor(Math.random() * maxNum) + 1;

  const ops = ['+', '-', '*'];
  const op = level > 2 ? ops[Math.floor(Math.random() * (level > 4 ? 3 : 2))] : '+';

  let realRes;
  if (op === '+') realRes = a + b;
  else if (op === '-') realRes = a - b;
  else realRes = a * Math.floor(Math.random() * 5 + 1);

  const isCorrect = Math.random() > 0.5;
  const shownRes = isCorrect ? realRes : realRes + (Math.random() > 0.5 ? 2 : -2);

  currentEq = { isCorrect };
  equationEl.textContent = `${a} ${op} ${b} = ${shownRes}`;
}

document.querySelectorAll(".logic-controls .actionBtn").forEach(btn => {
  btn.onclick = () => {
    if (!gameActive) return;
    
    totalAttempts++;
    const answer = btn.dataset.val === "true";
    const inSafetyZone = stability >= 40 && stability <= 80;

    if (answer === currentEq.isCorrect && inSafetyZone) {
      successfulActions++;
      score += 10;
      if (score % 50 === 0) {
        level++;
        levelEl.textContent = level;
      }
      spawnEquation();
    } else {
      let msg = !inSafetyZone ? "Поза безпечною зоною!" : "Помилка в обчисленні!";
      handleMistake(msg);
    }
  };
});

function handleMistake(msg) {
  lives--;
  livesEl.textContent = "❤️".repeat(Math.max(0, lives));
  instruction.textContent = msg;
  instruction.style.color = "#ef4444";

  setTimeout(() => {
    if (gameActive) {
        instruction.textContent = "Тримай енергію в межах безпечної зони!";
        instruction.style.color = "var(--text-muted)";
    }
  }, 1000);

  if (lives <= 0) gameOver("Система вийшла з ладу");
  else spawnEquation();
}

function gameOver(msg) {
  gameActive = false;
  clearInterval(stabilityInterval);
  
  const gameFinishedAt = Date.now();
  const duration = gameStartedAt ? Math.round((gameFinishedAt - gameStartedAt) / 1000) : 0;
  let accuracy = totalAttempts > 0 ? Math.round((successfulActions / totalAttempts) * 100) : 0;
  if (accuracy > 100) accuracy = 100;
  
  gameContent.classList.add("hidden");
  startTrigger.classList.remove("hidden");
  
  startTrigger.innerHTML = `
    <div>
      <h2 style="font-size: 28px; color: #1e293b; margin-bottom: 10px;">${msg}</h2>
      <p style="font-size: 18px; color: #64748b; margin-bottom: 5px;">Ви дійшли до рівня ${level}</p>
      <p style="font-size: 22px; font-weight: 800; color: var(--accent-dual); margin-bottom: 5px;">Результат: ${score}</p>
      <p style="font-size: 14px; color: #64748b; margin-bottom: 25px;">Точність: ${accuracy}% · Час: ${duration} сек.</p>
      <button class="bigBtn" id="restartBtn">Спробувати ще</button>
    </div>
  `;
  
  document.getElementById("restartBtn").onclick = (e) => {
      e.stopPropagation();
      startTrigger.innerHTML = `<button class="bigBtn" style="margin: 40px auto; display: block;">Почати сесію</button>`;
      startGame();
  };

  saveGameResult(score, accuracy, duration);
}

async function saveGameResult(finalScore, finalAccuracy, finalDuration) {
  try {
    if (!window.myFirebaseAuth) return;
    const user = window.myFirebaseAuth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    const response = await fetch("https://braindice-api.onrender.com/api/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        trainer: "dual",
        score: finalScore,
        accuracy: finalAccuracy,
        averageTime: 0,
        difficulty: level,
        duration: finalDuration
      })
    });

    const data = await response.json();
    if (data.status === "ok") {
        loadLeaderboard();
    }
  } catch (error) {
    console.error("Помилка збереження результату:", error);
  }
}

async function loadLeaderboard() {
  if (!leaderboardList) return;
  try {
    const response = await fetch("https://braindice-api.onrender.com/api/results/leaderboard/dual");
    const data = await response.json();

    if (data.status === "ok" && data.leaderboard.length > 0) {
      leaderboardList.innerHTML = ""; 
      data.leaderboard.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${index + 1}. ${item.displayName}</span> <span class="lb-score">${item.score} б.</span>`;
        leaderboardList.appendChild(li);
      });
    } else {
      leaderboardList.innerHTML = "<li><span>Ще немає рекордів</span></li>";
    }
  } catch (error) {
    leaderboardList.innerHTML = "<li><span>Помилка завантаження</span></li>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadLeaderboard();
});