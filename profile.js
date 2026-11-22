const loadingState = document.getElementById("loadingState");
const loginState = document.getElementById("loginState");
const profileContent = document.getElementById("profileContent");

const profileDisplayName =
  document.getElementById("profileDisplayName");

const profileEmail =
  document.getElementById("profileEmail");

const avatar =
  document.getElementById("avatar");

const displayNameInput =
  document.getElementById("displayNameInput");

const saveNameBtn =
  document.getElementById("saveNameBtn");

const profileMessage =
  document.getElementById("profileMessage");

const totalGames =
  document.getElementById("totalGames");

const bestScore =
  document.getElementById("bestScore");

const averageScore =
  document.getElementById("averageScore");

const trainerStats =
  document.getElementById("trainerStats");

const logoutBtn =
  document.getElementById("logoutBtn");


/*
  Назви тренажерів для красивого відображення.
*/
const TRAINER_NAMES = {
  reaction: "Reaction",
  memory: "Memory",
  dual: "Dual Task",
  pattern: "Pattern Decoder",
  verbal: "Verbal",
  stroop: "Stroop",
  odd: "Find The Odd",
  estimation: "Estimation"
};


/*
  Показуємо повідомлення.
*/
function showMessage(text, success = true) {
  profileMessage.textContent = text;

  profileMessage.style.color =
    success ? "#6fbf73" : "#ee7373";

  setTimeout(() => {
    profileMessage.textContent = "";
  }, 3000);
}


/*
  Перемикаємо стани сторінки.
*/
function showLoading() {
  loadingState.classList.remove("hidden");
  loginState.classList.add("hidden");
  profileContent.classList.add("hidden");
}

function showLogin() {
  loadingState.classList.add("hidden");
  loginState.classList.remove("hidden");
  profileContent.classList.add("hidden");
}

function showProfile() {
  loadingState.classList.add("hidden");
  loginState.classList.add("hidden");
  profileContent.classList.remove("hidden");
}


/*
  Отримуємо Firebase token.
*/
async function getAuthToken() {
  if (!window.myFirebaseAuth) {
    throw new Error("Firebase Auth ще не завантажений");
  }

  const user = window.myFirebaseAuth.currentUser;

  if (!user) {
    return null;
  }

  return await user.getIdToken();
}


/*
  Завантаження профілю.
*/
async function loadProfile() {

  try {

    const token = await getAuthToken();

    if (!token) {
      showLogin();
      return;
    }


    const response = await fetch(
      "https://braindice-api.onrender.com/api/users/me",
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );


    if (!response.ok) {
      throw new Error(
        "Не вдалося отримати профіль"
      );
    }


    const data = await response.json();


    if (
      data.status !== "ok" ||
      !data.user
    ) {
      throw new Error(
        data.message ||
        "Профіль не знайдено"
      );
    }


    const user = data.user;


    profileDisplayName.textContent =
      user.displayName || "Користувач";

    profileEmail.textContent =
      user.email || "Email не вказано";

    displayNameInput.value =
      user.displayName || "";


    /*
      Перша літера імені як аватар.
    */
    const name =
      user.displayName ||
      user.email ||
      "?";

    avatar.textContent =
      name.charAt(0).toUpperCase();


    showProfile();


    /*
      Після профілю завантажуємо статистику.
    */
    await loadStatistics();


  } catch (error) {

    console.error(
      "Помилка завантаження профілю:",
      error
    );

    showLogin();
  }
}


/*
  Завантаження статистики.
*/
async function loadStatistics() {

  try {

    const token = await getAuthToken();

    if (!token) {
      return;
    }


    const response = await fetch(
      "https://braindice-api.onrender.com/api/stats/me",
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );


    if (!response.ok) {
      throw new Error(
        "Не вдалося отримати статистику"
      );
    }


    const data = await response.json();


    if (
      data.status !== "ok" ||
      !data.statistics
    ) {
      throw new Error(
        data.message ||
        "Статистика недоступна"
      );
    }


    const statistics =
      data.statistics;


    totalGames.textContent =
      statistics.totalGames || 0;

    bestScore.textContent =
      statistics.bestScore || 0;

    averageScore.textContent =
      statistics.averageScore || 0;


    renderTrainerStats(
      statistics.trainers || {}
    );


  } catch (error) {

    console.error(
      "Помилка завантаження статистики:",
      error
    );

    trainerStats.innerHTML = `
      <div class="trainer-card">
        Не вдалося завантажити статистику.
      </div>
    `;
  }
}


/*
  Відображення статистики тренажерів.
*/
function renderTrainerStats(trainers) {

  const entries =
    Object.entries(trainers);


  if (entries.length === 0) {

    trainerStats.innerHTML = `
      <div class="trainer-card">
        <div class="trainer-name">
          Поки немає результатів
        </div>

        <span style="color:#6b7280;font-size:13px;">
          Зіграй першу гру, щоб тут
          з'явилася статистика.
        </span>
      </div>
    `;

    return;
  }


  trainerStats.innerHTML = "";


  entries.forEach(
    ([trainer, stats]) => {

      const card =
        document.createElement("div");

      card.className =
        "trainer-card";


      const trainerName =
        TRAINER_NAMES[trainer] ||
        trainer;


      card.innerHTML = `
        <div class="trainer-name">
          ${trainerName}
        </div>

        <div class="trainer-values">

          <div class="trainer-value">
            <span>Ігор</span>
            <strong>
              ${stats.games || 0}
            </strong>
          </div>

          <div class="trainer-value">
            <span>Рекорд</span>
            <strong>
              ${stats.bestScore || 0}
            </strong>
          </div>

          <div class="trainer-value">
            <span>Середнє</span>
            <strong>
              ${stats.averageScore || 0}
            </strong>
          </div>

        </div>
      `;


      trainerStats.appendChild(card);
    }
  );
}


/*
  Збереження нового імені.
*/
saveNameBtn.addEventListener(
  "click",
  async () => {

    const displayName =
      displayNameInput.value.trim();


    if (!displayName) {

      showMessage(
        "Ім'я не може бути порожнім.",
        false
      );

      return;
    }


    if (displayName.length < 2) {

      showMessage(
        "Ім'я має містити щонайменше 2 символи.",
        false
      );

      return;
    }


    try {

      saveNameBtn.disabled = true;

      saveNameBtn.textContent =
        "Збереження...";


      const token =
        await getAuthToken();


      if (!token) {

        showLogin();

        return;
      }


      const response =
        await fetch(
          "https://braindice-api.onrender.com/api/users/profile",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Authorization":
                `Bearer ${token}`
            },

            body: JSON.stringify({
              displayName
            })
          }
        );


      const data =
        await response.json();


      if (
        !response.ok ||
        data.status !== "ok"
      ) {

        throw new Error(
          data.message ||
          "Не вдалося зберегти ім'я"
        );
      }


      /*
        Оновлюємо UI.
      */
      profileDisplayName.textContent =
        displayName;

      avatar.textContent =
        displayName
          .charAt(0)
          .toUpperCase();


      /*
        Оновлюємо Firebase displayName
        локально, якщо можливо.
      */
      if (window.myFirebaseUser) {
        window.myFirebaseUser.displayName =
          displayName;
      }


      showMessage(
        "Ім'я успішно збережено."
      );


    } catch (error) {

      console.error(
        "Помилка зміни імені:",
        error
      );

      showMessage(
        error.message ||
        "Не вдалося зберегти ім'я.",
        false
      );

    } finally {

      saveNameBtn.disabled = false;

      saveNameBtn.textContent =
        "Зберегти";
    }
  }
);


/*
  Вихід з акаунта.
*/
logoutBtn.addEventListener(
  "click",
  async () => {

    try {

      if (window.myFirebaseAuth) {
        
        const user = window.myFirebaseAuth.currentUser;

      if (user) {
        await user.getIdToken();
      }
    }

      window.location.href =
        "/index.html";

    } catch (error) {

      console.error(
        "Помилка виходу:",
        error
      );
    }
  }
);


/*
  Реагуємо на зміну авторизації.
*/
window.addEventListener(
  "firebaseAuthChanged",
  ({ detail }) => {

    if (detail.user) {
      loadProfile();
    } else {
      showLogin();
    }
  }
);


/*
  Якщо auth.js вже встиг
  визначити користувача.
*/
showLoading();

setTimeout(() => {

  if (
    window.myFirebaseAuth
  ) {

    if (
      window.myFirebaseAuth.currentUser
    ) {
      loadProfile();
    } else {
      showLogin();
    }

  }

}, 300);