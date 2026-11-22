const startBtn = document.getElementById('startBtn');
const startTrigger = document.getElementById('startTrigger');
const gameContent = document.getElementById('gameContent');
const resultScreen = document.getElementById('resultScreen');

const sequenceBox = document.getElementById('sequenceBox');
const optionsGrid = document.getElementById('optionsGrid');
const timerBar = document.getElementById('timerBar');

const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const scoreEl = document.getElementById('score');

const finalScoreEl = document.getElementById('finalScore');
const finalStatsEl = document.getElementById('finalStats');
const retryBtn = document.getElementById('retryBtn');
const leaderboardList = document.getElementById('leaderboardList');

// Ігрові змінні
let score = 0;
let level = 1;
let lives = 3;
let correctAnswers = 0;
let totalAnswers = 0;
let gameActive = false;
let currentAnswer = null;

// Таймер (60 секунд на сесію)
const SESSION_TIME = 60;
let timeLeft = SESSION_TIME;
let timerInterval;

// Завантаження лідерборду при відкритті сторінки
document.addEventListener('DOMContentLoaded', loadLeaderboard);

function startGame() {
    score = 0;
    level = 1;
    lives = 3;
    correctAnswers = 0;
    totalAnswers = 0;
    timeLeft = SESSION_TIME;
    gameActive = true;

    updateHUD();
    startTrigger.classList.add('hidden');
    resultScreen.classList.add('hidden');
    gameContent.classList.remove('hidden');

    startTimer();
    nextPattern();
}

function startTimer() {
    clearInterval(timerInterval);
    timerBar.style.width = '100%';
    
    timerInterval = setInterval(() => {
        timeLeft -= 0.1;
        const percentage = (timeLeft / SESSION_TIME) * 100;
        timerBar.style.width = `${percentage}%`;

        if (timeLeft <= 0) {
            endGame();
        }
    }, 100);
}

// ==========================================
// ПРОЦЕДУРНА ГЕНЕРАЦІЯ ПАТЕРНІВ
// ==========================================
function generatePatternData(currentLevel) {
    // Визначаємо складність (від 0 до 4)
    let type = Math.floor(Math.random() * Math.min(1 + Math.floor(currentLevel / 3), 5));
    let seq = [];
    let ans;

    if (type === 0) {
        // 1. Арифметична прогресія (+N або -N)
        let step = Math.floor(Math.random() * 5) + 1 + Math.floor(currentLevel / 2);
        let start = Math.floor(Math.random() * 20);
        for(let i = 0; i < 4; i++) seq.push(start + i * step);
        ans = start + 4 * step;
    } 
    else if (type === 1) {
        // 2. Альтернуюча прогресія (+A, -B)
        let step1 = Math.floor(Math.random() * 5) + 2;
        let step2 = Math.floor(Math.random() * 3) + 1;
        let current = Math.floor(Math.random() * 10) + 5;
        seq.push(current);
        for(let i = 1; i < 5; i++) {
            current += (i % 2 !== 0) ? step1 : -step2;
            if (i < 4) seq.push(current);
            else ans = current;
        }
    } 
    else if (type === 2) {
        // 3. Геометрична прогресія (*N)
        let step = Math.floor(Math.random() * 2) + 2; // *2 або *3
        let start = Math.floor(Math.random() * 3) + 1;
        for(let i = 0; i < 4; i++) seq.push(start * Math.pow(step, i));
        ans = start * Math.pow(step, 4);
    } 
    else if (type === 3) {
        // 4. Подібна до Фібоначчі (сума двох попередніх)
        let a = Math.floor(Math.random() * 3) + 1;
        let b = Math.floor(Math.random() * 3) + 1;
        seq.push(a, b);
        for(let i = 2; i < 4; i++) seq.push(seq[i-1] + seq[i-2]);
        ans = seq[3] + seq[2];
    } 
    else {
        // 5. Квадрати чисел
        let start = Math.floor(Math.random() * 5) + 1;
        for(let i = 0; i < 4; i++) seq.push(Math.pow(start + i, 2));
        ans = Math.pow(start + 4, 2);
    }

    // Генерація 4 варіантів відповідей
    let options = new Set([ans]);
    while(options.size < 4) {
        let offset = Math.floor(Math.random() * 7) - 3;
        if(offset === 0) offset = 5;
        let fake = ans + offset;
        if (fake >= 0 && fake !== ans) options.add(fake);
    }
    
    return {
        sequenceText: seq.join(", ") + ", ?",
        correct: ans,
        options: Array.from(options).sort(() => Math.random() - 0.5)
    };
}

function nextPattern() {
    if (!gameActive) return;

    const patternData = generatePatternData(level);
    currentAnswer = patternData.correct;
    
    sequenceBox.textContent = patternData.sequenceText;
    optionsGrid.innerHTML = '';

    patternData.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => handleAnswer(opt, btn);
        optionsGrid.appendChild(btn);
    });
}

function handleAnswer(selected, btnEl) {
    if (!gameActive) return;
    totalAnswers++;

    if (selected === currentAnswer) {
        // Правильно
        correctAnswers++;
        score += (10 + level * 2);
        level++;
        btnEl.style.backgroundColor = '#10b981';
        btnEl.style.color = 'white';
        
        updateHUD();
        setTimeout(nextPattern, 200);
    } else {
        // Неправильно
        lives--;
        btnEl.style.backgroundColor = '#ef4444';
        btnEl.style.color = 'white';
        document.querySelector('.gameCard').classList.add('error-shake'); // Додай анімацію в CSS якщо треба
        
        updateHUD();
        setTimeout(() => {
            document.querySelector('.gameCard').classList.remove('error-shake');
            if (lives <= 0) {
                endGame();
            } else {
                nextPattern();
            }
        }, 400);
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
    finalStatsEl.innerHTML = `
        Рівень: <strong>${level}</strong> | 
        Точність: <strong>${accuracy}%</strong>
    `;

    // Зберігаємо на бекенд
    if (window.gameUserToken) {
        try {
            await fetch("https://braindice-api.onrender.com/api/results", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${window.gameUserToken}`
                },
                body: JSON.stringify({
                    trainer: "pattern", // ЗМІНЕНО: gameId на trainer
                    score: score,
                    accuracy: accuracy,
                    averageTime: 0, // Додано для сумісності з бекендом
                    difficulty: 1   // Додано для сумісності з бекендом
                })
            });
            loadLeaderboard(); // Оновлюємо лідерборд
        } catch (error) {
            console.error("Помилка збереження результату:", error);
        }
    }
}

async function loadLeaderboard() {
    try {
        // ЗМІНЕНО: шлях змінено на /pattern замість ?game=pattern
        const response = await fetch("https://braindice-api.onrender.com/api/results/leaderboard/pattern");
        if (!response.ok) throw new Error("Помилка завантаження");
        
        const data = await response.json();
        leaderboardList.innerHTML = '';

        if (data.status === "ok" && data.leaderboard && data.leaderboard.length > 0) {
            data.leaderboard.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${index + 1}. ${item.displayName}</span>
                    <span class="lb-score">${item.score} б.</span>
                `;
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

// Слухачі кнопок
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);