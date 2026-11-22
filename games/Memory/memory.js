const gridEl = document.getElementById("grid");
const digitBox = document.getElementById("digitBox");
const numpad = document.getElementById("numpad");
const startBtn = document.getElementById("startBtn");
const instruction = document.getElementById("instruction");
const levelEl = document.getElementById("level");
const livesEl = document.getElementById("lives");
const scoreEl = document.getElementById("score");
const leaderboardList = document.getElementById("leaderboardList");


/* =========================
   СТАН ГРИ
========================= */

let level = 1;
let lives = 3;
let score = 0;

let activeTiles = [];
let clickedTiles = [];

let targetCode = "";
let userCode = "";

let currentMode = "dual";

let gameState = "start";

let mistakes = 0;
let totalAttempts = 0;
let successfulActions = 0;

let gameStartedAt = null;
let gameFinishedAt = null;


/* =========================
   НАЛАШТУВАННЯ
========================= */

const MAX_LIVES = 3;

const MODE_NAMES = {
  dual: "Паралельний",
  seq: "Послідовний"
};


/* =========================
   ПЕРЕМИКАННЯ РЕЖИМУ
========================= */

document.querySelectorAll(".modeBtn").forEach(btn => {

  btn.onclick = () => {

    document
      .querySelectorAll(".modeBtn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    currentMode = btn.dataset.mode;

    resetGame();

  };

});


/* =========================
   NUMPAD
========================= */

function initNumpad() {

  numpad.innerHTML = "";

  for (let i = 1; i <= 9; i++) {

    const btn = document.createElement("button");

    btn.className = "numBtn";

    btn.textContent = i;

    btn.onclick = () => {

      if (gameState !== "recall_code") {
        return;
      }

      if (userCode.length >= targetCode.length) {
        return;
      }

      userCode += i;

      digitBox.textContent =
        userCode.padEnd(
          targetCode.length,
          "-"
        );

      totalAttempts++;

      if (userCode.length === targetCode.length) {

        checkCode();

      }

    };

    numpad.appendChild(btn);

  }

}


/* =========================
   ПОЧАТОК СЕСІЇ
========================= */

function startSession() {

  level = 1;
  lives = MAX_LIVES;
  score = 0;

  mistakes = 0;
  totalAttempts = 0;
  successfulActions = 0;

  gameStartedAt = Date.now();
  gameFinishedAt = null;

  updateHUD();

  startRound();

}


/* =========================
   НОВИЙ РІВЕНЬ
========================= */

function startRound() {

  gameState = "memorize";

  userCode = "";

  clickedTiles = [];

  gridEl.innerHTML = "";

  numpad.classList.add("hidden");

  digitBox.textContent = "----";


  /*
    Сітка:
    рівні 1-4 -> 3x3
    рівень 5+ -> 4x4
  */

  const gridSize =
    level < 5
      ? 3
      : 4;


  /*
    Кількість квадратів
    поступово збільшується.
  */

  const tileCount =
    2 + Math.floor(level / 2);


  /*
    Довжина цифрового коду
  */

  const codeLength =
    2 + Math.floor(level / 4);


  /*
    Час запам'ятовування
  */

  const showTime =
    2000 +
    (tileCount + codeLength) * 400;


  gridEl.style.gridTemplateColumns =
    `repeat(${gridSize}, 1fr)`;


  /*
    Створюємо клітинки
  */

  for (
    let i = 0;
    i < gridSize * gridSize;
    i++
  ) {

    const tile =
      document.createElement("div");

    tile.className = "tile";

    tile.dataset.index = i;

    gridEl.appendChild(tile);

  }


  /*
    Вибираємо випадкові активні клітинки
  */

  activeTiles = [];

  while (
    activeTiles.length < tileCount
  ) {

    const r =
      Math.floor(
        Math.random() *
        (gridSize * gridSize)
      );

    if (!activeTiles.includes(r)) {

      activeTiles.push(r);

    }

  }


  /*
    Генеруємо код
  */

  targetCode = "";

  for (
    let i = 0;
    i < codeLength;
    i++
  ) {

    targetCode +=
      Math.floor(Math.random() * 9) + 1;

  }


  /*
    ПАРАЛЕЛЬНИЙ РЕЖИМ
  */

  if (currentMode === "dual") {

    activeTiles.forEach(idx => {

      gridEl
        .children[idx]
        .classList.add("active");

    });

    digitBox.textContent =
      targetCode;

    instruction.textContent =
      `Запам'ятовуй (${(showTime / 1000).toFixed(1)}с)...`;

    setTimeout(
      switchToGridRecall,
      showTime
    );

  }


  /*
    ПОСЛІДОВНИЙ РЕЖИМ
  */

  else {

    instruction.textContent =
      "Запам'ятай сітку...";


    activeTiles.forEach(idx => {

      gridEl
        .children[idx]
        .classList.add("active");

    });


    setTimeout(() => {

      activeTiles.forEach(idx => {

        gridEl
          .children[idx]
          .classList.remove("active");

      });

      instruction.textContent =
        "Запам'ятай код...";

      digitBox.textContent =
        targetCode;

      setTimeout(
        switchToGridRecall,
        showTime / 1.5
      );

    }, showTime / 1.5);

  }

}


/* =========================
   ПЕРЕХІД ДО ВІДТВОРЕННЯ
========================= */

function switchToGridRecall() {

  if (gameState === "start") {
    return;
  }

  gameState = "recall_grid";

  instruction.textContent =
    "Де були рожеві квадрати?";

  activeTiles.forEach(idx => {

    gridEl
      .children[idx]
      .classList.remove("active");

  });

  digitBox.textContent = "????";


  Array
    .from(gridEl.children)
    .forEach(tile => {

      tile.onclick = () => {
        handleTileClick(tile);
      };

    });

}


/* =========================
   КЛІК ПО КЛІТИНЦІ
========================= */

function handleTileClick(tile) {

  if (
    gameState !== "recall_grid"
  ) {
    return;
  }

  const idx =
    parseInt(tile.dataset.index);

    totalAttempts++;

  /*
    Правильна клітинка
  */

  if (activeTiles.includes(idx)) {

    if (!clickedTiles.includes(idx)) {

      tile.classList.add("correct");

      clickedTiles.push(idx);

      successfulActions++;

      if (
        clickedTiles.length ===
        activeTiles.length
      ) {

        gameState =
          "recall_code";

        instruction.textContent =
          "Тепер введи код!";

        numpad.classList.remove(
          "hidden"
        );

        digitBox.textContent =
          "_".repeat(
            targetCode.length
          );

        initNumpad();

      }

    }

  }


  /*
    Помилкова клітинка
  */

  else {

    tile.classList.add("wrong");

    mistakes++;

    handleMistake();

  }

}


/* =========================
   ПЕРЕВІРКА КОДУ
========================= */

function checkCode() {

  if (
    userCode === targetCode
  ) {

    successfulActions++;

    /*
      Додаткові очки за проходження рівня
    */

    const levelPoints =
      level * 100;

    score += levelPoints;

    level++;

    levelEl.textContent =
      level;

    scoreEl.textContent =
      score;

    instruction.textContent =
      `Вірно! Рівень ${level}`;

    setTimeout(
      startRound,
      1200
    );

  }

  else {

    mistakes++;

    handleMistake();

  }

}


/* =========================
   ПОМИЛКА
========================= */

function handleMistake() {

  lives--;

  updateHUD();


  if (lives <= 0) {

    gameOver();

    return;

  }


  gameState = "waiting";

  instruction.textContent =
    `Помилка. Залишилось життів: ${lives}`;


  setTimeout(
    startRound,
    1000
  );

}


/* =========================
   GAME OVER
========================= */

function gameOver() {

  gameState = "start";

  gameFinishedAt =
    Date.now();

  const duration =
    gameStartedAt
      ? Math.round(
          (gameFinishedAt -
            gameStartedAt) /
          1000
        )
      : 0;
      


  /*
    Фінальний score.
    Якщо користувач не пройшов
    жодного рівня — буде 0.
  */

  const finalScore =
    Math.max(
      0,
      score
    );


  let accuracy =
    totalAttempts > 0
      ? Math.round(
          (successfulActions / totalAttempts) * 100
        )
      : 0;

  if (accuracy > 100) accuracy = 100;


  instruction.textContent =
    "Гру завершено!";


  gridEl.innerHTML = `
    <div style="
      text-align:center;
      grid-column:1/-1;
      align-self:center;
    ">

      <h2 style="
        margin-bottom:10px;
        font-size:28px;
      ">
        🧠 Сесію завершено
      </h2>

      <p style="
        font-size:18px;
        margin:8px 0;
      ">
        Рівень: ${level}
      </p>

      <p style="
        font-size:20px;
        font-weight:800;
        margin:8px 0;
      ">
        Результат: ${finalScore}
      </p>

      <p style="
        color:#64748b;
        margin:8px 0 20px;
      ">
        Точність: ${accuracy}%
        · Час: ${duration} сек.
      </p>

      <button
        id="restartBtn"
        class="bigBtn">
        Спробувати ще
      </button>

    </div>
  `;


  document
    .getElementById("restartBtn")
    .onclick = startSession;


  /*
    Зберігаємо результат
  */

  saveGameResult({
    score: finalScore,
    accuracy,
    duration
  });

}


/* =========================
   ЗБЕРЕЖЕННЯ РЕЗУЛЬТАТУ
========================= */

async function saveGameResult({
  score,
  accuracy,
  duration
}) {

  try {

    /*
      Перевіряємо Firebase Auth
    */

    if (!window.myFirebaseAuth) {

      console.error(
        "Firebase Auth не знайдено."
      );

      return;

    }


    const user =
      window.myFirebaseAuth.currentUser;


    if (!user) {

      console.log(
        "Memory: гравець не авторизований. Результат не збережено."
      );

      return;

    }


    /*
      Отримуємо актуальний Firebase ID token
    */

    const token =
      await user.getIdToken();


    /*
      Відправляємо результат
    */

    const response =
      await fetch(
        "https://braindice-api.onrender.com/api/results",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "Authorization":
              `Bearer ${token}`
          },

          body: JSON.stringify({

            trainer: "memory",

            score,

            accuracy,

            averageTime: 0,

            difficulty: level,

            duration,

            metadata: {

              mode: currentMode,

              modeName:
                MODE_NAMES[currentMode],

              mistakes,

              levelReached: level

            }

          })

        }
      );


    const data =
      await response.json();


    if (
      response.ok &&
      data.status === "ok"
    ) {

      console.log(
        "Memory: результат збережено",
        data
      );


      /*
        Оновлюємо leaderboard
      */

      loadLeaderboard();

    }

    else {

      console.error(
        "Memory: backend повернув помилку",
        data
      );

    }

  }

  catch (error) {

    console.error(
      "Memory: помилка збереження результату",
      error
    );

  }

}


/* =========================
   LEADERBOARD
========================= */

async function loadLeaderboard() {

  if (!leaderboardList) {
    return;
  }


  leaderboardList.innerHTML = `
    <li>
      <span>Завантаження...</span>
    </li>
  `;


  try {

    const response =
      await fetch(
        "https://braindice-api.onrender.com/api/results/leaderboard/memory"
      );


    const data =
      await response.json();


    if (
      !response.ok ||
      data.status !== "ok"
    ) {

      throw new Error(
        data.message ||
        "Помилка leaderboard"
      );

    }


    if (
      !data.leaderboard ||
      data.leaderboard.length === 0
    ) {

      leaderboardList.innerHTML = `
        <li>
          <span>Ще немає рекордів</span>
        </li>
      `;

      return;

    }


    leaderboardList.innerHTML = "";


    data.leaderboard.forEach(
      (item, index) => {

        const li =
          document.createElement("li");


        li.innerHTML = `
          <span class="lb-name">
            ${index + 1}. ${escapeHtml(
              item.displayName ||
              "Анонімний гравець"
            )}
          </span>

          <span class="lb-score">
            ${item.score} б.
          </span>
        `;


        leaderboardList.appendChild(li);

      }
    );

  }

  catch (error) {

    console.error(
      "Memory: помилка leaderboard",
      error
    );


    leaderboardList.innerHTML = `
      <li>
        <span>Помилка завантаження</span>
      </li>
    `;

  }

}


/* =========================
   ЗАХИСТ ВІД HTML
========================= */

function escapeHtml(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}


/* =========================
   HUD
========================= */

function updateHUD() {

  levelEl.textContent =
    level;

  scoreEl.textContent =
    score;

  livesEl.textContent =
    "❤️".repeat(
      Math.max(0, lives)
    );

}


/* =========================
   RESET
========================= */

function resetGame() {

  gameState = "start";

  level = 1;

  lives = MAX_LIVES;

  score = 0;

  mistakes = 0;

  totalAttempts = 0;

  successfulActions = 0;

  gameStartedAt = null;

  gameFinishedAt = null;

  targetCode = "";

  userCode = "";

  activeTiles = [];

  clickedTiles = [];


  updateHUD();


  digitBox.textContent =
    "----";


  numpad.classList.add(
    "hidden"
  );


  gridEl.innerHTML = `
    <button
      id="startBtn"
      class="bigBtn">
      Почати сесію
    </button>
  `;


  document
    .getElementById("startBtn")
    .onclick = startSession;


  instruction.textContent =
    "Оберіть режим та почніть тренування";

}


/* =========================
   INIT
========================= */

loadLeaderboard();

updateHUD();

startBtn.onclick = startSession;