let verbalDB = {};
let currentMode = '';
let score = 0;
let lives = 3;
let timerId = null;
let currentQuestion = null;

async function loadDatabase() {
    try {
        const response = await fetch('words.json');
        verbalDB = await response.json();
    } catch (error) {
        console.error("Помилка завантаження бази даних:", error);
    }
}

function startGame(mode) {
    if (!verbalDB[mode]) return;

    currentMode = mode;
    score = 0;
    lives = (mode === 'builder') ? 3 : 5;
    
    // Перемикання екранів
    document.getElementById('modeSelection').classList.add('hidden');
    document.getElementById('gameArea').classList.remove('hidden');
    document.getElementById('gameStats').classList.remove('hidden');
    document.getElementById('toModes').classList.remove('hidden'); // Кнопка "До режимів"
    
    updateStats();
    nextQuestion();
}

function nextQuestion() {
    const data = verbalDB[currentMode];
    currentQuestion = data[Math.floor(Math.random() * data.length)];
    
    const display = document.getElementById('contentDisplay');
    const interaction = document.getElementById('interactionArea');
    interaction.innerHTML = '';

    if (currentMode === 'builder') {
        document.getElementById('taskInstruction').textContent = "Складіть слово";
        display.textContent = currentQuestion.scrambled;
        
        const input = document.createElement('input');
        input.className = "word-input";
        input.placeholder = "ПИШІТЬ ТУТ...";
        input.onkeyup = (e) => {
            if (e.key === 'Enter') {
                if (input.value.toUpperCase() === currentQuestion.word) {
                    handleSuccess();
                } else {
                    handleError();
                    input.value = '';
                }
            }
        };
        interaction.appendChild(input);
        input.focus();
    } 
    else {
        document.getElementById('taskInstruction').textContent = 
            currentMode === 'missing' ? "Яка літера пропущена?" : "Оберіть синонім";
        display.textContent = currentQuestion.text || currentQuestion.word;
        
        const grid = document.createElement('div');
        grid.className = 'options-grid';
        currentQuestion.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'opt-btn';
            btn.textContent = opt;
            btn.onclick = () => (opt === currentQuestion.correct) ? handleSuccess() : handleError();
            grid.appendChild(btn);
        });
        interaction.appendChild(grid);
    }
    startTimer();
}

function handleSuccess() {
    score += 20;
    updateStats();
    nextQuestion();
}

function handleError() {
    lives--;
    updateStats();
    
    const card = document.getElementById('mainCard');
    card.style.animation = 'shake 0.3s';
    setTimeout(() => card.style.animation = '', 300);

    if (lives <= 0) endGame(); else nextQuestion();
}

function startTimer() {
    clearInterval(timerId);
    let timeLeft = 100;
    let speed = currentMode === 'synonym' ? 0.7 : 1.4;
    
    timerId = setInterval(() => {
        timeLeft -= speed;
        document.getElementById('timerBar').style.width = timeLeft + '%';
        if (timeLeft <= 0) handleError();
    }, 100);
}

function updateStats() {
    document.getElementById('scoreDisplay').textContent = score;
    document.getElementById('livesDisplay').textContent = lives;
}

function endGame() {
    clearInterval(timerId);
    document.getElementById('gameArea').classList.add('hidden');
    document.getElementById('resultScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
}

loadDatabase();