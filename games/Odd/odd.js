const balancedPairs = [
    // ПАРІ, ДЕ Є РЕАЛЬНА РІЗНИЦЯ (Тонка, але помітна)
    { n: 'O', o: 'Q' }, { n: 'E', o: 'F' }, { n: '5', o: 'S' },
    { n: '8', o: 'B' }, { n: '0', o: 'O' }, { n: 'I', o: 'l' },
    { n: 'C', o: 'G' }, { n: 'X', o: 'K' }, { n: ':', o: ';' },
    { n: '!', o: 'i' }, { n: 'P', o: 'R' }, { n: 'U', o: 'V' },
    { n: '3', o: '8' }, { n: '6', o: '5' }, { n: '9', o: 'g' },
    { n: 'm', o: 'n' }, { n: 'u', o: 'v' }, { n: 'p', o: 'b' },
    { n: 'd', o: 'b' }, { n: 'q', o: 'p' }, { n: 'L', o: 'T' },
    // СКЛАДНІ ЕМОДЗІ (Різна форма при одному кольорі)
    { n: '🍏', o: '🍐' }, { n: '🍊', o: '🍑' }, { n: '🍋', o: '🍌' }, 
    { n: '🍓', o: '🍎' }, { n: '🌑', o: '🌚' }, { n: '🌕', o: '🌖' },
    { n: '🍙', o: '🍚' }, { n: '🏐', o: '⚾' }, { n: '🦁', o: '🐱' },
    // ГРАФІЧНІ (Для напруження зору)
    { n: '▰', o: '▱' }, { n: '☷', o: '☲' }, { n: '≡', o: '≣' },
    { n: '●', o: '○' }, { n: '†', o: '‡' }
];

let score = 0, lives = 3, timerId = null, gridSize = 5; // Починаємо з 5х5
let currentOddIndex = -1;
let isWait = false;

function startGame() {
    score = 0; lives = 3; gridSize = 5;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameArea').classList.remove('hidden');
    document.getElementById('gameStats').classList.remove('hidden');
    updateStats();
    nextLevel();
}

function nextLevel() {
    isWait = false;
    // Прогресія: 5х5 -> 6х6 -> 8х8 (максимум)
    if (score >= 60) gridSize = 6;
    if (score >= 180) gridSize = 7;
    if (score >= 350) gridSize = 8;

    const container = document.getElementById('gridContainer');
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

    const pair = balancedPairs[Math.floor(Math.random() * balancedPairs.length)];
    const total = gridSize * gridSize;
    currentOddIndex = Math.floor(Math.random() * total);

    for (let i = 0; i < total; i++) {
        const item = document.createElement('div');
        item.className = 'grid-item';
        item.textContent = (i === currentOddIndex) ? pair.o : pair.n;
        
        // Оптимальний розмір тексту
        let fontSize = gridSize <= 5 ? '28px' : gridSize <= 7 ? '22px' : '18px';
        item.style.fontSize = fontSize;
        
        item.onclick = () => {
            if (isWait) return;
            if (i === currentOddIndex) handleHit();
            else handleMiss();
        };
        container.appendChild(item);
    }
    startTimer();
}

function handleHit() {
    score += gridSize * 2;
    updateStats();
    nextLevel();
}

function handleMiss() {
    isWait = true;
    lives--;
    updateStats();
    
    // Показ правильної відповіді (тепер на 0.8 сек)
    const items = document.querySelectorAll('.grid-item');
    items[currentOddIndex].classList.add('correct-hint');

    const card = document.getElementById('mainCard');
    card.style.animation = 'shake 0.3s';

    if (lives <= 0) setTimeout(endGame, 800);
    else setTimeout(nextLevel, 800);
}

function startTimer() {
    clearInterval(timerId);
    let timeLeft = 100;
    // Комфортна, але прогресуюча швидкість
    let speed = 1.5 + (score / 200); 
    timerId = setInterval(() => {
        if (isWait) return;
        timeLeft -= speed;
        document.getElementById('timerBar').style.width = timeLeft + '%';
        if (timeLeft <= 0) handleMiss();
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