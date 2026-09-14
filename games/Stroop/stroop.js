const colorData = [
    { name: 'ЧЕРВОНИЙ', hex: '#ef4444' },
    { name: 'СИНІЙ', hex: '#3b82f6' },
    { name: 'ЗЕЛЕНИЙ', hex: '#10b981' },
    { name: 'ЖОВТИЙ', hex: '#f59e0b' }
];

let score = 0;
let lives = 3;
let timerId = null;
let currentTask = 'color';
let correctHex = '';
let correctText = '';

// Метрики
let totalAttempts = 0;
let successfulActions = 0;
let gameStartedAt = null;
let roundStartedAt = null;
let totalReactionTime = 0;

const startTrigger = document.getElementById('startTrigger');
const gameContent = document.getElementById('gameContent');
const resultScreen = document.getElementById('resultScreen');
const wordDisplay = document.getElementById('wordDisplay');
const optionsGrid = document.getElementById('optionsGrid');
const instruction = document.getElementById('instruction');
const leaderboardList = document.getElementById('leaderboardList');
const retryBtn = document.getElementById('retryBtn');

function startGame() {
    startTrigger.classList.add('hidden');
    resultScreen.classList.add('hidden');
    gameContent.classList.remove('hidden');

    score = 0;
    lives = 3;
    totalAttempts = 0;
    successfulActions = 0;
    totalReactionTime = 0;
    gameStartedAt = Date.now();

    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = '❤️❤️❤️';
    
    initRound();
}

startTrigger.querySelector('button').onclick = startGame;
retryBtn.onclick = startGame;

function initRound() {
    currentTask = Math.random() > 0.5 ? 'color' : 'text';
    instruction.textContent = currentTask === 'color' ? "Натисніть на КОЛІР" : "Натисніть на ТЕКСТ";
    instruction.style.color = currentTask === 'color' ? '#ef4444' : '#3b82f6';

    const textObj = colorData[Math.floor(Math.random() * colorData.length)];
    let colorObj;
    do {
        colorObj = colorData[Math.floor(Math.random() * colorData.length)];
    } while (colorObj.hex === textObj.hex);

    wordDisplay.textContent = textObj.name;
    wordDisplay.style.color = colorObj.hex;
    correctHex = colorObj.hex;
    correctText = textObj.name;

    renderButtons();
    roundStartedAt = Date.now();
    startTimer();
}

function renderButtons() {
    optionsGrid.innerHTML = '';
    colorData.forEach(color => {
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.style.backgroundColor = color.hex;
        btn.textContent = color.name;
        btn.onclick = () => checkAnswer(color);
        optionsGrid.appendChild(btn);
    });
}

function checkAnswer(selected) {
    totalAttempts++;
    const reactionTime = Date.now() - roundStartedAt;
    totalReactionTime += reactionTime;

    const isCorrect = (currentTask === 'color') 
        ? (selected.hex === correctHex) 
        : (selected.name === correctText);

    if (isCorrect) {
        successfulActions++;
        score += 10;
        document.getElementById('score').textContent = score;
        initRound();
    } else {
        handleError();
    }
}

function startTimer() {
    clearInterval(timerId);
    let timeLeft = 100;
    let speed = Math.max(10, 50 - (score / 15));
    timerId = setInterval(() => {
        timeLeft -= 1.5;
        document.getElementById('timerBar').style.width = timeLeft + '%';
        if (timeLeft <= 0) {
            totalAttempts++; // Якщо час вийшов, рахуємо як хибну спробу
            handleError();
        }
    }, speed);
}

function handleError() {
    lives--;
    document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(3 - Math.max(0, lives));
    if (lives <= 0) {
        endGame();
    } else {
        initRound();
    }
}

function endGame() {
    clearInterval(timerId);
    gameContent.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    const duration = gameStartedAt ? Math.round((Date.now() - gameStartedAt) / 1000) : 0;
    let accuracy = totalAttempts > 0 ? Math.round((successfulActions / totalAttempts) * 100) : 0;
    if (accuracy > 100) accuracy = 100;
    const avgTime = totalAttempts > 0 ? Math.round(totalReactionTime / totalAttempts) : 0;

    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalStats').textContent = `Точність: ${accuracy}% · Час: ${duration}с · Сер. реакція: ${avgTime} мс`;

    saveGameResult(score, accuracy, duration, avgTime);
}

async function saveGameResult(finalScore, finalAccuracy, finalDuration, avgTime) {
  try {
    if (!window.myFirebaseAuth) return;
    const user = window.myFirebaseAuth.currentUser;
    if (!user) return;

    const token = await user.getIdToken();

    const response = await fetch("http://localhost:3000/api/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        trainer: "stroop",
        score: finalScore,
        accuracy: finalAccuracy,
        averageTime: avgTime,
        difficulty: 1, 
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
    const response = await fetch("http://localhost:3000/api/results/leaderboard/stroop");
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