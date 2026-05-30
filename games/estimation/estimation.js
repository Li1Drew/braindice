let score = 0;
let level = 1;
let lives = 3;
let timerId = null;
let counts = { left: 0, right: 0 };

function startGame() {
    // 1. Спочатку робимо ігрову зону видимою
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameArea').classList.remove('hidden');

    // 2. ДАЄМО ЧАС БРАУЗЕРУ (50мс), щоб він зрозумів, якого розміру стали картки
    setTimeout(() => {
        nextRound();
    }, 50);
}

function nextRound() {
    level = Math.floor(score / 30) + 1;
    document.getElementById('lvlTag').textContent = `Рівень ${level}`;
    
    updateHint();
    generateChallenge();
    startTimer();
}

function updateHint() {
    const hint = document.getElementById('modeHint');
    if (level <= 2) hint.textContent = "Де більше фігур?";
    else if (level <= 4) hint.textContent = "З'явилися квадрати!";
    else if (level <= 6) hint.textContent = "Різні розміри!";
    else if (level <= 9) hint.textContent = "Рахуй тільки ПОМАРАНЧЕВІ!";
    else hint.textContent = "Запам'ятовуй! Вони зникнуть...";
}

function generateChallenge() {
    const dL = document.getElementById('deckL');
    const dR = document.getElementById('deckR');
    
    const diff = Math.max(1, 4 - Math.floor(level / 6));
    const base = 4 + Math.floor(level * 1.3);
    
    counts.left = base + Math.floor(Math.random() * 5);
    do {
        counts.right = counts.left + (Math.random() < 0.5 ? -diff : diff);
    } while (counts.right < 2 || counts.right === counts.left);

    // Малюємо фігури
    render(dL, counts.left);
    render(dR, counts.right);

    // Механіка зникнення на 10+ рівні
    if (level >= 10) {
        setTimeout(() => {
            const allShapes = document.querySelectorAll('.shape');
            allShapes.forEach(s => s.style.opacity = '0');
        }, 1500);
    }
}

function render(container, count) {
    container.innerHTML = '';
    
    // БЕРЕМО РОЗМІРИ. Якщо clientWidth 0, беремо через getBoundingClientRect
    let w = container.clientWidth;
    let h = container.clientHeight;

    if (w === 0 || h === 0) {
        const rect = container.getBoundingClientRect();
        w = rect.width;
        h = rect.height;
    }

    // Якщо все одно 0 (буває в деяких браузерах), ставимо запасний розмір
    if (w === 0) w = 300;
    if (h === 0) h = 200;

    const items = [];
    let fakes = (level >= 7) ? (2 + level) : 0;
    let total = count + fakes;

    for (let i = 0; i < total; i++) {
        const isFake = i >= count;
        let placed = false;
        let tries = 0;

        while (!placed && tries < 50) {
            let size = (level >= 5) ? (14 + Math.random() * 20) : 22;
            
            // Робимо відступи 20px від країв, щоб фігури не вилазили
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
                
                // ВАЖЛИВО: Явно задаємо стилі через JS
                el.style.position = 'absolute';
                el.style.width = size + 'px';
                el.style.height = size + 'px';
                el.style.left = x + 'px';
                el.style.top = y + 'px';
                el.style.opacity = '1';
                el.style.zIndex = '10';

                container.appendChild(el);
                items.push({x, y, s: size});
                placed = true;
            }
            tries++;
        }
    }
}

function choose(side) {
    if (timerId === null) return; // Захист від подвійних кліків

    clearInterval(timerId);
    timerId = null;

    const isWin = (side === 'left' && counts.left > counts.right) || 
                  (side === 'right' && counts.right > counts.left);

    if (isWin) {
        score += 10;
        document.getElementById('score').textContent = score;
        flash('#f0fff4');
    } else {
        lives--;
        updateHearts();
        flash('#fff5f5');
    }

    setTimeout(() => {
        if (lives <= 0) endGame();
        else nextRound();
    }, 250);
}

function startTimer() {
    if (timerId) clearInterval(timerId);
    
    let time = 100;
    let speed = 0.6 + (level * 0.08);
    
    timerId = setInterval(() => {
        time -= speed;
        const fill = document.getElementById('timeFill');
        if (fill) fill.style.width = time + '%';
        
        if (time <= 0) {
            clearInterval(timerId);
            timerId = null;
            lives--;
            updateHearts();
            if (lives <= 0) endGame(); else nextRound();
        }
    }, 50);
}

function flash(color) {
    document.body.style.backgroundColor = color;
    setTimeout(() => document.body.style.backgroundColor = 'var(--bg)', 200);
}

function updateHearts() {
    let s = '';
    for(let i=0; i<3; i++) s += (i < lives) ? '🧡' : '🤍';
    document.getElementById('hearts').textContent = s;
}

function endGame() {
    if (timerId) clearInterval(timerId);
    document.getElementById('gameArea').classList.add('hidden');
    document.getElementById('resultScreen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
}