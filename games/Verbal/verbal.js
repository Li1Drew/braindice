const startBtn = document.getElementById('startBtn');
const startTrigger = document.getElementById('startTrigger');
const gameContent = document.getElementById('gameContent');
const resultScreen = document.getElementById('resultScreen');

const taskTitle = document.getElementById('taskTitle');
const displayWord = document.getElementById('displayWord');
const interactionArea = document.getElementById('interactionArea');
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
let currentAnswer = null;
let serverDB = null; 

// Таймер (60 секунд на сесію)
const SESSION_TIME = 60;
let timeLeft = SESSION_TIME;
let timerInterval;

// 1. Завантаження бази слів з бекенду
document.addEventListener('DOMContentLoaded', async () => {
    loadLeaderboard();
    try {
        const response = await fetch('http://localhost:3000/api/verbal/tasks');
        if (!response.ok) throw new Error("Сервер не відповів");
        
        const json = await response.json();
        if (json.status === 'ok') {
            serverDB = json.data;
            startBtn.textContent = "Почати сесію";
            startBtn.disabled = false;
        }
    } catch (err) {
        startBtn.textContent = "Помилка бази даних";
        console.error("Не вдалося завантажити словник.", err);
    }
});

function startGame() {
    if (!serverDB) return;
    
    score = 0; level = 1; lives = 3;
    correctAnswers = 0; totalAnswers = 0;
    timeLeft = SESSION_TIME; gameActive = true;

    updateHUD();
    startTrigger.classList.add('hidden');
    resultScreen.classList.add('hidden');
    gameContent.classList.remove('hidden');

    startTimer();
    nextTask();
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

function nextTask() {
    if (!gameActive) return;
    interactionArea.innerHTML = '';

    let modePool = [];
    
    // Базові набори для простих режимів
    if (serverDB.missing && serverDB.missing.length > 0) {
        modePool.push('missing', 'missing'); 
    }
    if (serverDB.synonym && serverDB.synonym.length > 0) {
        modePool.push('synonym', 'synonym'); 
    }

    if (serverDB.builder && serverDB.builder.length > 0) {
        if (level >= 3) {
            modePool.push('builder', 'builder'); 
        } else {
            modePool.push('builder'); 
        }
    }

    if (modePool.length === 0) {
        return endGame();
    }

    const currentMode = modePool[Math.floor(Math.random() * modePool.length)];
    const arr = serverDB[currentMode];
    
    const randomIndex = Math.floor(Math.random() * arr.length);
    const q = arr.splice(randomIndex, 1)[0]; 

    if (currentMode === 'builder') {
        taskTitle.textContent = "Складіть слово з літер";
        displayWord.textContent = q.scrambled;
        currentAnswer = q.word;

        const input = document.createElement('input');
        input.className = "word-input";
        input.placeholder = "ПИШІТЬ ТУТ...";
        input.autocomplete = "off";
        
        input.onkeyup = (e) => {
            if (!gameActive) return;
            if (e.key === 'Enter') {
                const userVal = input.value.toUpperCase().trim();
                if (!userVal) return;

                totalAnswers++;
                if (userVal === currentAnswer) {
                    correctAnswers++;
                    input.style.borderColor = '#10b981';
                    input.style.color = '#10b981';
                    handleAnswer(true);
                } else {
                    input.style.borderColor = '#ef4444';
                    input.style.color = '#ef4444';
                    handleAnswer(false);
                }
            }
        };
        interactionArea.appendChild(input);
        input.focus();

    } else {
        if (currentMode === 'missing') {
            taskTitle.textContent = "Яка літера пропущена?";
            displayWord.textContent = q.text;
        } else {
            taskTitle.textContent = "Оберіть синонім";
            displayWord.textContent = q.word;
        }
        
        currentAnswer = q.correct;
        const optionsToRender = [...q.options].sort(() => Math.random() - 0.5);

        const grid = document.createElement('div');
        grid.className = 'options-grid';
        optionsToRender.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'opt-btn';
            btn.textContent = opt;
            btn.onclick = () => {
                if (!gameActive) return;
                
                totalAnswers++;
                if (opt === currentAnswer) {
                    correctAnswers++;
                    btn.style.borderColor = '#10b981';
                    btn.style.backgroundColor = '#f0fdf4';
                    btn.style.color = '#10b981';
                    handleAnswer(true);
                } else {
                    btn.style.borderColor = '#ef4444';
                    btn.style.backgroundColor = '#fef2f2';
                    btn.style.color = '#ef4444';
                    
                    // Підсвічуємо правильну відповідь
                    Array.from(grid.children).forEach(b => {
                        if (b.textContent === currentAnswer) {
                            b.style.borderColor = '#10b981';
                            b.style.backgroundColor = '#f0fdf4';
                        }
                    });

                    handleAnswer(false);
                }
            };
            grid.appendChild(btn);
        });
        interactionArea.appendChild(grid);
    }
}

function handleAnswer(isCorrect) {
    if (!gameActive) return;

    if (isCorrect) {
        score += 10 * level; 
        correctAnswers++;
        
        level = Math.floor(correctAnswers / 5) + 1;

        updateHUD();
        setTimeout(() => {
            nextTask();
        }, 300);
    } else {
        lives--;
        updateHUD();

        if (lives <= 0) {
            endGame();
        } else {
            setTimeout(() => {
                nextTask();
            }, 600);
        }
    }
}

function updateHUD() {
    scoreEl.textContent = score;
    levelEl.textContent = level;
    if (livesEl) {
        livesEl.textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, 3 - lives));
    }
}

// Завершення гри
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
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${window.gameUserToken}` },
                body: JSON.stringify({ trainer: "verbal", score: score, accuracy: accuracy, averageTime: 0, difficulty: 1 })
            });
            loadLeaderboard();
        } catch (error) { console.error("Помилка:", error); }
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch("http://localhost:3000/api/results/leaderboard/verbal");
        if (!response.ok) throw new Error("Помилка завантаження");
        const data = await response.json();
        leaderboardList.innerHTML = '';
        if (data.status === "ok" && data.leaderboard && data.leaderboard.length > 0) {
            data.leaderboard.forEach((item, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${index + 1}. ${item.displayName}</span><span class="lb-score">${item.score} б.</span>`;
                leaderboardList.appendChild(li);
            });
        } else { leaderboardList.innerHTML = '<li><span>Ще немає результатів</span></li>'; }
    } catch (error) { leaderboardList.innerHTML = '<li><span>Не вдалося завантажити</span></li>'; }
}

startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);