const arena = document.getElementById("arena");
const targetBox = document.getElementById("targetBox");
const livesEl = document.getElementById("lives");
const scoreEl = document.getElementById("score");
const startBtn = document.getElementById("startBtn");

const DATA = {
  color: {
    easy: ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a78bfa", "#ec4899"],
    medium: ["#3b82f6", "#60a5fa", "#93c5fd", "#2563eb", "#1d4ed8", "#1e40af", "#64748b"],
    hard: ["#16a34a", "#15803d", "#166534", "#14532d", "#4ade80", "#86efac", "#a7f3d0", "#059669", "#047857"]
  },
  symbol: {
    easy: ["A", "B", "X", "Y", "Z", "K"],
    medium: ["E", "F", "L", "H", "I", "T", "V"],
    hard: ["O", "Q", "C", "G", "D", "0", "U", "6", "9"]
  }
};

let gameActive = false;
let currentMode = "color";
let currentDiff = "easy";
let lives = 3;
let score = 0;
let startTime = 0;
let currentTarget = null;
let placedObjects = [];

// Коефіцієнти складності
const DIFF_MULTIPLIER = { easy: 1, medium: 2, hard: 4 };

document.querySelectorAll(".modeBtn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".modeBtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
    resetGame();
  };
});

document.querySelectorAll(".diffBtn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".diffBtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentDiff = btn.dataset.diff;
    resetGame();
  };
});

function getUniquePosition(objSize, arenaW, arenaH) {
  let attempt = 0;
  const padding = 20; // Відстань між об'єктами
  while (attempt < 150) {
    const x = Math.random() * (arenaW - objSize);
    const y = Math.random() * (arenaH - objSize);
    let overlaps = false;
    for (const p of placedObjects) {
      if (Math.abs(x - p.x) < (objSize + padding) && Math.abs(y - p.y) < (objSize + padding)) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) {
      placedObjects.push({x, y});
      return {x, y};
    }
    attempt++;
  }
  return { x: Math.random() * (arenaW - objSize), y: Math.random() * (arenaH - objSize) };
}

function spawn() {
  arena.innerHTML = "";
  placedObjects = [];
  const fullSet = DATA[currentMode][currentDiff];
  currentTarget = fullSet[Math.floor(Math.random() * fullSet.length)];
  
  updateTargetUI();

  const distractors = fullSet.filter(item => item !== currentTarget).sort(() => Math.random() - 0.5);
  const count = currentDiff === "easy" ? 3 : (currentDiff === "medium" ? 5 : 8);
  let objectsToSpawn = [currentTarget];
  
  for (let i = 0; i < distractors.length && objectsToSpawn.length < count; i++) {
    objectsToSpawn.push(distractors[i]);
  }
  objectsToSpawn.sort(() => Math.random() - 0.5);

  objectsToSpawn.forEach(item => {
    const el = document.createElement("div");
    el.className = "object";
    if (currentMode === "color") el.style.backgroundColor = item;
    else { el.style.backgroundColor = "#334155"; el.textContent = item; }

    const pos = getUniquePosition(52, arena.clientWidth, arena.clientHeight);
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;

    el.onclick = (e) => {
      e.stopPropagation();
      if (!gameActive) return;
      if (item === currentTarget) handleWin(e.clientX, e.clientY);
      else handleMistake();
    };
    arena.appendChild(el);
  });

  startTime = Date.now();
  gameActive = true;
}

function updateTargetUI() {
  if (currentMode === "color") {
    targetBox.style.backgroundColor = currentTarget;
    targetBox.textContent = "";
  } else {
    targetBox.style.backgroundColor = "#fff";
    targetBox.textContent = currentTarget;
    targetBox.style.color = "#1e293b";
  }
}

function handleWin(clickX, clickY) {
  const reactionTime = Date.now() - startTime;
  
  // Логіка нарахування балів:
  // Чим менше ms, тим більше балів. Наприклад, за 200ms на Hard дасть багато очок.
  // Формула: (1000 / час у секундах) * множник складності
  const timeBonus = Math.max(0, Math.floor(2000 / (reactionTime / 100))); 
  const pointsEarned = timeBonus * DIFF_MULTIPLIER[currentDiff];
  
  score += pointsEarned;
  scoreEl.textContent = score;
  gameActive = false;

  // Візуальний ефект очок
  showScorePopup(clickX, clickY, `+${pointsEarned}`);

  arena.innerHTML = `<div style="font-size: 32px; font-weight: 800; color: #6fbf73;">⚡ ${reactionTime}ms</div>`;
  setTimeout(spawn, 800);
}

function showScorePopup(x, y, text) {
  const popup = document.createElement("div");
  popup.className = "score-popup";
  popup.textContent = text;
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 800);
}

function handleMistake() {
  lives--;
  updateLives();
  arena.classList.add("error-flash");
  setTimeout(() => arena.classList.remove("error-flash"), 200);
  if (lives <= 0) gameOver();
}

function updateLives() {
  livesEl.textContent = "❤️".repeat(Math.max(0, lives));
}

function gameOver() {
  gameActive = false;
  arena.innerHTML = `
    <div style="text-align:center">
      <h2 style="font-size: 28px;">Тест завершено</h2>
      <p style="font-size: 20px; margin-bottom: 20px;">Ваш результат: ${score}</p>
      <button class="bigBtn" onclick="resetGame()">Спробувати ще раз</button>
    </div>
  `;
}

function resetGame() {
  gameActive = false;
  lives = 3;
  score = 0;
  scoreEl.textContent = "0";
  updateLives();
  arena.innerHTML = `<div id="startBtn" class="bigBtn">Натисни, щоб почати</div>`;
  document.getElementById("startBtn").onclick = spawn;
  targetBox.style.backgroundColor = "#eee";
  targetBox.textContent = "?";
}

startBtn.onclick = spawn;