const shapes = ['▲', '■', '●', '◆', '★', '✖'];
const colors = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];
let score = 0, level = 1, correctAnswer;

const startTrigger = document.getElementById('startTrigger');
const gameContent = document.getElementById('gameContent');
const gameZone = document.getElementById('gameZone');
const optionsGrid = document.getElementById('optionsGrid');
const answerSection = document.getElementById('answerSection');
const instruction = document.getElementById('instruction');

function initLevel() {
    gameZone.innerHTML = '';
    optionsGrid.innerHTML = '';
    answerSection.classList.add('hidden');
    gameZone.className = 'game-zone';

    const modes = ['matrix', 'odd_one', 'sequence'];
    const currentMode = modes[Math.floor(Math.random() * modes.length)];

    if (currentMode === 'matrix') {
        instruction.textContent = "Доповніть логічну матрицю";
        gameZone.classList.add('mode-matrix');
        answerSection.classList.remove('hidden');
        generateMatrix();
    } else if (currentMode === 'odd_one') {
        instruction.textContent = "Знайдіть елемент, що порушує правило";
        gameZone.classList.add('mode-odd');
        generateOddOne();
    } else {
        instruction.textContent = "Продовжте послідовність";
        gameZone.classList.add('mode-sequence');
        answerSection.classList.remove('hidden');
        generateSequence();
    }
}

function handleResponse(element, isCorrect) {
    if (isCorrect) {
        element.classList.add('correct');
        setTimeout(() => {
            score += 25; level++;
            document.getElementById('score').textContent = score;
            document.getElementById('level').textContent = level;
            initLevel();
        }, 450);
    } else {
        element.classList.add('wrong');
        document.querySelector('.gameCard').classList.add('error-shake');
        setTimeout(() => {
            element.classList.remove('wrong');
            document.querySelector('.gameCard').classList.remove('error-shake');
        }, 450);
    }
}

function createShape(item) {
    const group = document.createElement('div');
    group.className = 'shape-group';
    group.style.color = item.color;
    group.style.transform = `rotate(${item.rotate}deg)`;
    for (let i = 0; i < item.count; i++) {
        const span = document.createElement('span');
        span.textContent = item.shape;
        group.appendChild(span);
    }
    return group;
}

// --- Режими ГРИ ---

function generateMatrix() {
    const s = [...shapes].sort(() => 0.5 - Math.random());
    const c = [...colors].sort(() => 0.5 - Math.random());
    let data = [];
    const offset = Math.floor(Math.random() * 3);

    for (let r = 0; r < 3; r++) {
        for (let col = 0; col < 3; col++) {
            data.push({ shape: s[(r+col+offset)%3], color: c[(r+col+offset)%3], rotate: r*90, count: 1 });
        }
    }
    correctAnswer = data[8];
    data.forEach((item, i) => {
        const cell = document.createElement('div');
        cell.className = (i === 8) ? 'cell empty' : 'cell';
        if (i !== 8) cell.appendChild(createShape(item));
        else cell.textContent = '?';
        gameZone.appendChild(cell);
    });
    renderOptions(correctAnswer);
}

function generateOddOne() {
    const s = shapes[Math.floor(Math.random()*shapes.length)];
    const c1 = colors[0], c2 = colors[2];
    const oddIdx = Math.floor(Math.random() * 6);
    
    for (let i = 0; i < 6; i++) {
        const item = { shape: s, color: (i === oddIdx) ? c2 : c1, rotate: (i === oddIdx) ? 45 : 0, count: 1 };
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.appendChild(createShape(item));
        cell.onclick = () => handleResponse(cell, i === oddIdx);
        gameZone.appendChild(cell);
    }
}

function generateSequence() {
    const s = shapes[Math.floor(Math.random()*shapes.length)];
    const c = colors[Math.floor(Math.random()*colors.length)];
    let seq = [];
    for (let i = 0; i < 5; i++) {
        seq.push({ shape: s, color: c, rotate: i * 90, count: 1 });
    }
    correctAnswer = seq[4];
    seq.forEach((item, i) => {
        const cell = document.createElement('div');
        cell.className = (i === 4) ? 'cell empty' : 'cell';
        if (i !== 4) cell.appendChild(createShape(item));
        else cell.textContent = '?';
        gameZone.appendChild(cell);
    });
    renderOptions(correctAnswer);
}

function renderOptions(correct) {
    let opts = [correct];
    let attempts = 0;

    // Гарантуємо 6 унікальних варіантів
    while(opts.length < 6 && attempts < 200) {
        attempts++;
        let f = { 
            shape: shapes[Math.floor(Math.random()*shapes.length)], 
            color: colors[Math.floor(Math.random()*colors.length)], 
            rotate: Math.floor(Math.random()*4)*90, 
            count: 1 
        };
        const isDuplicate = opts.some(o => 
            o.shape === f.shape && o.color === f.color && o.rotate === f.rotate
        );
        if (!isDuplicate) opts.push(f);
    }

    opts.sort(() => 0.5 - Math.random()).forEach(opt => {
        const div = document.createElement('div');
        div.className = 'option';
        div.appendChild(createShape(opt));
        div.onclick = () => handleResponse(div, JSON.stringify(opt) === JSON.stringify(correct));
        optionsGrid.appendChild(div);
    });
}

startTrigger.onclick = () => {
    startTrigger.classList.add('hidden');
    gameContent.classList.remove('hidden');
    initLevel();
};