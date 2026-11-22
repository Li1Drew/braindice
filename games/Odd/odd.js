const startBtn = document.getElementById('startBtn');
const startTrigger = document.getElementById('startTrigger');
const gameContent = document.getElementById('gameContent');
const resultScreen = document.getElementById('resultScreen');

const gridContainer = document.getElementById('gridContainer');
const timerBar = document.getElementById('timerBar');

const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const scoreEl = document.getElementById('score');

const finalScoreEl = document.getElementById('finalScore');
const finalStatsEl = document.getElementById('finalStats');
const retryBtn = document.getElementById('retryBtn');
const leaderboardList = document.getElementById('leaderboardList');

const balancedPairs = [
    { n: 'O', o: 'Q' }, { n: 'E', o: 'F' }, { n: '5', o: 'S' },
    { n: '8', o: 'B' }, { n: '0', o: 'O' }, { n: 'I', o: 'l' },
    { n: 'C', o: 'G' }, { n: 'X', o: 'K' }, { n: ':', o: ';' },
    { n: '!', o: 'i' }, { n: 'P', o: 'R' }, { n: 'U', o: 'V' },
    { n: '3', o: '8' }, { n: '6', o: '5' }, { n: '9', o: 'g' },
    { n: 'm', o: 'n' }, { n: 'u', o: 'v' }, { n: 'p', o: 'b' },
    { n: 'd', o: 'b' }, { n: 'q', o: 'p' }, { n: 'L', o: 'T' },
    { n: '🍏', o: '🍐' }, { n: '🍊', o: '🍑' }, { n: '🍋', o: '🍌' }, 
    { n: '🍓', o: '🍎' }, { n: '🌑', o: '🌚' }, { n: '🌕', o: '🌖' },
    { n: '🍙', o: '🍚' }, { n: '🏐', o: '⚾' }, { n: '🦁', o: '🐱' },
    { n: '▰', o: '▱' }, { n: '☷', o: '☲' }, { n: '≡', o: '≣' },
    { n: '●', o: '○' }, { n: '†', o: '‡' }
];

let score = 0, level = 1, lives = 3, correctAnswers = 0, totalAnswers = 0;
let gameActive = false;
let currentOddIndex = -1;
let gridSize = 4;
let isWait = false;

// Таймер (60 секунд на сесію)
const SESSION_TIME = 60;
let timeLeft = SESSION_TIME;
let timerInterval;

// Завантаження лідерборду при відкритті
document.addEventListener('DOMContentLoaded', loadLeaderboard);

function startGame() {
    score = 0; level = 1; lives = 3; gridSize = 4;
    correctAnswers = 0; totalAnswers = 0;
    timeLeft = SESSION_TIME; gameActive = true;
    isWait = false;

    updateHUD();
    startTrigger.classList.add('hidden');
    resultScreen.classList.add('hidden');
    gameContent.classList.remove('hidden');

    startTimer();
    nextLevel();
}

function startTimer() {
    clearInterval(timerInterval);
    timerBar.style.width = '100%';
    
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        timerBar.style.width = `${(timeLeft / SESSION_TIME) * 100}%`;
        if (timeLeft <= 0) endGame();
    }, 100);
}

function nextLevel() {
    if (!gameActive) return;
    isWait = false;

    // Прогресія складності сітки
    if (level > 4) gridSize = 5;
    if (level > 9) gridSize = 6;
    if (level > 15) gridSize = 7;
    if (level > 22) gridSize = 8; // Максимальний розмір

    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    const pair = balancedPairs[Math.floor(Math.random() * balancedPairs.length)];
    const totalItems = gridSize * gridSize;
    currentOddIndex = Math.floor(Math.random() * totalItems);

    for (let i = 0; i < totalItems; i++) {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.textContent = (i === currentOddIndex) ? pair.o : pair.n;
        
        // Динамічний розмір шрифту
        let fontSize = gridSize <= 5 ? '28px' : gridSize <= 7 ? '22px' : '18px';
        item.style.fontSize = fontSize;
        
        item.onclick = () => {
            if (isWait || !gameActive) return;
            if (i === currentOddIndex) handleHit();
            else handleMiss(item);
        };
        
        gridContainer.appendChild(item);
    }
}

function handleHit() {
    correctAnswers++;
    totalAnswers++;
    score += gridSize * 2;
    level++;
    updateHUD();
    nextLevel();
}

function handleMiss(wrongItem) {
    isWait = true;
    totalAnswers++;
    lives--;
    updateHUD();
    
    // Підсвічуємо правильну відповідь
    const items = document.querySelectorAll('.grid-item');
    items[currentOddIndex].classList.add('correct-hint');
    
    // Перезапускаємо анімацію "трясіння"
    const card = document.querySelector('.gameCard');
    card.classList.remove('error-shake');
    void card.offsetWidth; // Тригер reflow
    card.classList.add('error-shake');

    if (lives <= 0) {
        setTimeout(endGame, 600);
    } else {
        setTimeout(nextLevel, 600);
    }
}

function updateHUD() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    livesEl.textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
}

async function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    
    gameContent.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    finalScoreEl.textContent = score;
    finalStatsEl.innerHTML = `Рівень: <strong>${level}</strong> | Точність: <strong>${accuracy}%</strong>`;

    if (window.gameUserToken) {
        try {
            await fetch("http://localhost:3000/api/results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${window.gameUserToken}`
                },
                body: JSON.stringify({
                    trainer: "odd",
                    score: score,
                    accuracy: accuracy,
                    averageTime: 0, 
                    difficulty: 1   
                })
            });
            loadLeaderboard();
        } catch (error) {
            console.error("Помилка збереження результату:", error);
        }
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch("http://localhost:3000/api/results/leaderboard/odd");
        if (!response.ok) throw new Error("Помилка завантаження");
        
        const data = await response.json();
        leaderboardList.innerHTML = '';

        if (data.status === "ok" && data.leaderboard && data.leaderboard.length > 0) {
            data.leaderboard.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${index + 1}. ${item.displayName}</span><span class="lb-score">${item.score} б.</span>`;
                leaderboardList.appendChild(li);
            });
        } else {
            leaderboardList.innerHTML = '<li><span>Ще немає результатів</span></li>';
        }
    } catch (error) {
        console.error("Помилка лідерборду:", error);
        leaderboardList.innerHTML = '<li><span>Не вдалося завантажити</span></li>';
    }
}

startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);