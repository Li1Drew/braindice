const gridEl = document.getElementById("grid");
const digitBox = document.getElementById("digitBox");
const numpad = document.getElementById("numpad");
const startBtn = document.getElementById("startBtn");
const instruction = document.getElementById("instruction");
const levelEl = document.getElementById("level");
const livesEl = document.getElementById("lives");

let level = 1;
let lives = 3;
let activeTiles = [];
let clickedTiles = [];
let targetCode = "";
let userCode = "";
let currentMode = "dual"; // dual або seq
let gameState = "start";

// Перемикання режимів
document.querySelectorAll(".modeBtn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".modeBtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
    resetGame();
  };
});

function initNumpad() {
  numpad.innerHTML = "";
  for (let i = 1; i <= 9; i++) {
    const btn = document.createElement("button");
    btn.className = "numBtn";
    btn.textContent = i;
    btn.onclick = () => {
      if (gameState !== "recall_code") return;
      if (userCode.length < targetCode.length) {
        userCode += i;
        digitBox.textContent = userCode.padEnd(targetCode.length, "-");
        if (userCode.length === targetCode.length) checkCode();
      }
    };
    numpad.appendChild(btn);
  }
}

function startRound() {
  gameState = "memorize";
  userCode = "";
  clickedTiles = [];
  gridEl.innerHTML = "";
  numpad.classList.add("hidden");
  digitBox.textContent = "----";
  
  const gridSize = level < 5 ? 3 : 4;
  const tileCount = 2 + Math.floor(level / 2);
  const codeLength = 2 + Math.floor(level / 4);

  // Адаптивний час: базові 2сек + по 0.4сек за кожен новий елемент
  const showTime = 2000 + (tileCount + codeLength) * 400;

  gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  for (let i = 0; i < gridSize * gridSize; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.index = i;
    gridEl.appendChild(tile);
  }

  activeTiles = [];
  while (activeTiles.length < tileCount) {
    let r = Math.floor(Math.random() * (gridSize * gridSize));
    if (!activeTiles.includes(r)) activeTiles.push(r);
  }

  targetCode = "";
  for (let i = 0; i < codeLength; i++) {
    targetCode += Math.floor(Math.random() * 9) + 1;
  }

  if (currentMode === "dual") {
    // Паралельний режим: показуємо все разом
    activeTiles.forEach(idx => gridEl.children[idx].classList.add("active"));
    digitBox.textContent = targetCode;
    instruction.textContent = `Запам'ятовуй (${(showTime/1000).toFixed(1)}с)...`;
    setTimeout(switchToGridRecall, showTime);
  } else {
    // Послідовний режим: спочатку сітка, потім код
    instruction.textContent = "Запам'ятай сітку...";
    activeTiles.forEach(idx => gridEl.children[idx].classList.add("active"));
    setTimeout(() => {
      activeTiles.forEach(idx => gridEl.children[idx].classList.remove("active"));
      instruction.textContent = "Запам'ятай код...";
      digitBox.textContent = targetCode;
      setTimeout(switchToGridRecall, showTime / 1.5);
    }, showTime / 1.5);
  }
}

function switchToGridRecall() {
  gameState = "recall_grid";
  instruction.textContent = "Де були рожеві квадрати?";
  activeTiles.forEach(idx => gridEl.children[idx].classList.remove("active"));
  digitBox.textContent = "????";
  
  Array.from(gridEl.children).forEach(tile => {
    tile.onclick = () => handleTileClick(tile);
  });
}

function handleTileClick(tile) {
  if (gameState !== "recall_grid") return;
  const idx = parseInt(tile.dataset.index);

  if (activeTiles.includes(idx)) {
    if (!clickedTiles.includes(idx)) {
      tile.classList.add("correct");
      clickedTiles.push(idx);
      if (clickedTiles.length === activeTiles.length) {
        gameState = "recall_code";
        instruction.textContent = "Тепер введи код!";
        numpad.classList.remove("hidden");
        digitBox.textContent = "_".repeat(targetCode.length);
        initNumpad();
      }
    }
  } else {
    tile.classList.add("wrong");
    handleMistake();
  }
}

function checkCode() {
  if (userCode === targetCode) {
    level++;
    levelEl.textContent = level;
    instruction.textContent = "Вірно! Рівень " + level;
    setTimeout(startRound, 1200);
  } else {
    handleMistake();
  }
}

function handleMistake() {
  lives--;
  livesEl.textContent = "❤️".repeat(Math.max(0, lives));
  if (lives <= 0) {
    gameState = "start";
    instruction.textContent = "Гру завершено!";
    gridEl.innerHTML = `<button onclick="resetGame()" class="bigBtn">Спробувати ще</button>`;
  } else {
    setTimeout(startRound, 1000);
  }
}

function resetGame() {
  level = 1;
  lives = 3;
  levelEl.textContent = level;
  livesEl.textContent = "❤️❤️❤️";
  digitBox.textContent = "----";
  numpad.classList.add("hidden");
  gridEl.innerHTML = `<button id="startBtn" class="bigBtn">Почати сесію</button>`;
  document.getElementById("startBtn").onclick = startRound;
  instruction.textContent = "Оберіть режим та почніть тренування";
}

startBtn.onclick = startRound;