const startBtn = document.getElementById('startBtn');
const startTrigger = document.getElementById('startTrigger');
const gameContent = document.getElementById('gameContent');
const resultScreen = document.getElementById('resultScreen');

const modeHint = document.getElementById('modeHint');
const dL = document.getElementById('deckL');
const dR = document.getElementById('deckR');
const timerBar = document.getElementById('timerBar');

const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const scoreEl = document.getElementById('score');

const finalScoreEl = document.getElementById('finalScore');
const finalStatsEl = document.getElementById('finalStats');
const retryBtn = document.getElementById('retryBtn');
const leaderboardList = document.getElementById('leaderboardList');

let score = 0, level = 1, lives = 3, correctAnswers = 0, totalAnswers = 0;
let gameActive = false;
let counts = { left: 0, right: 0 };
let isWait = false;

// Таймер (60 секунд на сесію)
const SESSION_TIME = 60;
let timeLeft = SESSION_TIME;
let timerInterval;

document.addEventListener('DOMContentLoaded', loadLeaderboard);

function startGame() {
    score = 0; level = 1; lives = 3; 
    correctAnswers = 0; totalAnswers = 0;
    timeLeft = SESSION_TIME; gameActive = true;
    isWait = false;

    updateHUD();
    startTrigger.classList.add('hidden');
    resultScreen.classList.add('hidden');
    gameContent.classList.remove('hidden');

    startTimer();
    
    // Даємо час браузеру зрозуміти нові розміри блоків (як у твоєму старому коді)
    setTimeout(nextRound, 50);
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

function nextRound() {
    if (!gameActive) return;
    isWait = false;
    
    // Підвищуємо рівень кожні 30 балів (як у твоєму коді)
    level = Math.floor(score / 30) + 1;
    updateHUD();
    updateHint();
    generateChallenge();
}

function updateHint() {
    if (level <= 2) modeHint.textContent = "Де більше фігур?";
    else if (level <= 4) modeHint.textContent = "З'явилися квадрати!";
    else if (level <= 6) modeHint.textContent = "Різні розміри!";
    else if (level <= 9) modeHint.textContent = "Рахуй ТІЛЬКИ помаранчеві!";
    else modeHint.textContent = "Запам'ятовуй! Вони зникнуть...";
}

function generateChallenge() {
    const diff = Math.max(1, 4 - Math.floor(level / 6));
    const base = 4 + Math.floor(level * 1.3);
    
    counts.left = base + Math.floor(Math.random() * 5);
    do {
        counts.right = counts.left + (Math.random() < 0.5 ? -diff : diff);
    } while (counts.right < 2 || counts.right === counts.left);

    render(dL, counts.left);
    render(dR, counts.right);

    // Зникнення на 10+ рівні
    if (level >= 10) {
        setTimeout(() => {
            const allShapes = document.querySelectorAll('.shape');
            allShapes.forEach(s => s.style.opacity = '0');
        }, 1500); // Даємо 1.5 сек на запам'ятовування
    }
}

function render(container, count) {
    container.innerHTML = '';
    
    let w = container.clientWidth || 300;
    let h = container.clientHeight || 200;

    const items = [];
    let fakes = (level >= 7) ? (2 + level) : 0;
    let total = count + fakes;

    for (let i = 0; i < total; i++) {
        const isFake = i >= count;
        let placed = false;
        let tries = 0;

        while (!placed && tries < 50) {
            let size = (level >= 5) ? (14 + Math.random() * 20) : 22;
            const x = 20 + Math.random() * (w - size - 40);
            const y = 20 + Math.random() * (h - size - 40);

            const collision = items.some(it => {
                const dist = Math.sqrt(Math.pow(it.x - x, 2) + Math.pow(it.y - y, 2));
                return dist < (it.s + size) * 0.7;
            });

            if (!collision) {
                const el = document.createElement('div');
                const isSquare = (level >= 3 && Math.random() > 0.5);
                
                el.className = `shape ${isSquare ? 'square' : 'circle'} ${isFake ? 'fake' : ''}`;
                el.style.width = size + 'px';
                el.style.height = size + 'px';
                el.style.left = x + 'px';
                el.style.top = y + 'px';

                container.appendChild(el);
                items.push({x, y, s: size});
                placed = true;
            }
            tries++;
        }
    }
}

window.choose = function(side) {
    if (isWait || !gameActive) return;
    isWait = true;
    totalAnswers++;

    const isWin = (side === 'left' && counts.left > counts.right) || 
                  (side === 'right' && counts.right > counts.left);

    if (isWin) {
        correctAnswers++;
        score += 10;
        updateHUD();
        setTimeout(nextRound, 200);
    } else {
        lives--;
        updateHUD();
        
        // Трясемо екран при помилці
        const card = document.querySelector('.gameCard');
        card.classList.remove('error-shake');
        void card.offsetWidth;
        card.classList.add('error-shake');

        setTimeout(() => {
            if (lives <= 0) endGame();
            else nextRound();
        }, 400);
    }
}

function updateHUD() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    livesEl.textContent = '🧡'.repeat(lives) + '🤍'.repeat(3 - lives);
}

// ==========================================
// ЗАВЕРШЕННЯ ТА БЕКЕНД
// ==========================================
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
            await fetch("https://braindice-api.onrender.com/api/results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${window.gameUserToken}`
                },
                body: JSON.stringify({
                    trainer: "estimation", // НЕ ЗАБУДЬ ДОДАТИ estimation В БЕКЕНД!
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
        const response = await fetch("https://braindice-api.onrender.com/api/results/leaderboard/estimation");
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
        leaderboardList.innerHTML = '<li><span>Не вдалося завантажити</span></li>';
    }
}

startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);