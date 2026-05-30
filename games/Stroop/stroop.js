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

const startTrigger = document.getElementById('startTrigger');
const gameContent = document.getElementById('gameContent');
const resultScreen = document.getElementById('resultScreen');
const wordDisplay = document.getElementById('wordDisplay');
const optionsGrid = document.getElementById('optionsGrid');
const instruction = document.getElementById('instruction');

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
    const isCorrect = (currentTask === 'color') 
        ? (selected.hex === correctHex) 
        : (selected.name === correctText);

    if (isCorrect) {
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
        if (timeLeft <= 0) handleError();
    }, speed);
}

function handleError() {
    lives--;
    document.getElementById('lives').textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
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
    document.getElementById('finalScore').textContent = score;
}

startTrigger.onclick = () => {
    startTrigger.classList.add('hidden');
    gameContent.classList.remove('hidden');
    initRound();
};