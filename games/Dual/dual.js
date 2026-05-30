let score = 0;
let level = 1;
let lives = 3;
let stability = 60; // Починаємо з середини
let gameActive = false;
let currentEq = { isCorrect: true };
let stabilityInterval;

const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const stabilityBar = document.getElementById("stabilityBar");
const equationEl = document.getElementById("equation");
const overlay = document.getElementById("startOverlay");
const startTrigger = document.getElementById('startTrigger');
const gameContent = document.getElementById('gameContent');

startTrigger.onclick = () => {
  startTrigger.classList.add('hidden');
  gameContent.classList.remove('hidden');
  gameActive = true;
  stability = 60;
  score = 0; level = 1; lives = 3;
  startStabilityDrain();
  spawnEquation();
};

function startStabilityDrain() {
  stabilityInterval = setInterval(() => {
    if (!gameActive) return;

    // Складність: чим вище рівень, тим швидше падає енергія
    const drain = 0.8 + (level * 0.2);
    stability -= drain;
    
    updateStabilityUI();

    // Перевірка на критичні значення (0 або 100)
    if (stability <= 0 || stability >= 100) {
      handleMistake("Збій реактора!");
      stability = 60; // Скидання для продовження
    }
  }, 100);
}

document.getElementById("stabilizeBtn").onclick = () => {
  if (!gameActive) return;
  // Кожен клік дає +8% енергії. Треба клацати вчасно, щоб не перегріти.
  stability = Math.min(100, stability + 8);
  updateStabilityUI();
};

function updateStabilityUI() {
  stabilityBar.style.width = `${stability}%`;
  
  // Колірна індикація зони (40% - 80%)
  if (stability >= 40 && stability <= 80) {
    stabilityBar.style.backgroundColor = "#22c55e"; // Безпечно
  } else {
    stabilityBar.style.backgroundColor = "#f59e0b"; // Попередження (оранжевий)
    if (stability < 15 || stability > 90) stabilityBar.style.backgroundColor = "#ef4444"; // Небезпека
  }
}

function spawnEquation() {
  if (!gameActive) return;

  const maxNum = 10 + (level * 2);
  const a = Math.floor(Math.random() * maxNum) + 1;
  const b = Math.floor(Math.random() * maxNum) + 1;
  
  // Додаємо випадковий оператор (+, -, *)
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
    const answer = btn.dataset.val === "true";
    
    // Перевіряємо ОДНОЧАСНО математику і чи знаходимось ми в зоні стабільності
    const inSafetyZone = stability >= 40 && stability <= 80;

    if (answer === currentEq.isCorrect && inSafetyZone) {
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
    instruction.textContent = "Тримай енергію в межах безпечної зони!";
    instruction.style.color = "#64748b";
  }, 1000);

  if (lives <= 0) gameOver("Система вийшла з ладу");
  else spawnEquation();
}

function gameOver(msg) {
  gameActive = false;
  clearInterval(stabilityInterval);
  overlay.classList.remove("hidden");
  overlay.innerHTML = `
    <div>
      <h2 style="font-size: 32px; color: #1e293b;">${msg}</h2>
      <p style="font-size: 18px; color: #64748b; margin-bottom: 25px;">Ви дійшли до рівня ${level}</p>
      <button class="bigBtn" onclick="location.reload()">Спробувати ще</button>
    </div>
  `;
}

document.getElementById("startBtn").onclick = () => {
  overlay.classList.add("hidden");
  gameActive = true;
  stability = 60;
  score = 0;
  level = 1;
  lives = 3;
  levelEl.textContent = level;
  livesEl.textContent = "❤️❤️❤️";
  startStabilityDrain();
  spawnEquation();
};