const express = require("express");

const authenticateUser = require("../middleware/auth");
const { validateResult } = require("../utils/resultValidator");
const { logInfo, logError } = require("../utils/logger");

const {
  saveResult,
  getUserResults,
  getLeaderboard
} = require("../services/resultService");

const { db } = require("../config/firebase");

const router = express.Router();


/*
  POST /api/results

  Збереження результату гри.
*/
router.post("/", authenticateUser, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Перевіряємо дані
    const validation = validateResult(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        status: "error",
        message: "Некоректні дані результату",
        errors: validation.errors
      });
    }

    // Отримуємо профіль користувача
    const userDoc = await db
      .collection("users")
      .doc(uid)
      .get();

    let displayName = "Анонімний гравець";

    if (userDoc.exists && userDoc.data().displayName) {
      displayName = userDoc.data().displayName;
    } else if (req.user.email) {
      displayName = req.user.email.split("@")[0];
    }

    // Передаємо роботу з БД у service
    const result = await saveResult(
      uid,
      req.body,
      displayName
    );

    logInfo("Результат гри збережено", {
      uid,
      trainer: req.body.trainer,
      score: Number(req.body.score),
      resultId: result.id
    });

    res.status(201).json({
      status: "ok",
      message: "Результат успішно збережено",
      resultId: result.id
    });

  } catch (error) {
    logError("Помилка збереження результату", error);

    res.status(500).json({
      status: "error",
      message: "Не вдалося зберегти результат"
    });
  }
});


/*
  GET /api/results/my

  Останні результати поточного користувача.
*/
router.get("/my", authenticateUser, async (req, res) => {
  try {
    const results = await getUserResults(
      req.user.uid,
      20
    );

    res.json({
      status: "ok",
      results
    });

  } catch (error) {
    logError(
      "Помилка отримання історії результатів",
      error
    );

    res.status(500).json({
      status: "error",
      message: "Не вдалося завантажити історію"
    });
  }
});


/*
  GET /api/results/leaderboard/:trainer

  Топ-8 УНІКАЛЬНИХ гравців
  для конкретного тренажера.

  Від кожного користувача
  показуємо тільки його найкращий результат.
*/
router.get("/leaderboard/:trainer", async (req, res) => {
  try {

    const { trainer } = req.params;

    const snapshot = await db
      .collection("results")
      .where("trainer", "==", trainer)
      .orderBy("score", "desc")
      .limit(100)
      .get();


    /*
      Групуємо результати
      за userId.
    */

    const bestByUser = new Map();


    snapshot.forEach(doc => {

      const data = doc.data();

      const userId =
        data.userId || doc.id;

      const currentBest =
        bestByUser.get(userId);


      const currentScore =
        Number(data.score) || 0;


      /*
        Якщо це перший результат
        користувача — записуємо його.
      */

      if (!currentBest) {

        bestByUser.set(userId, {
          id: doc.id,

          userId,

          displayName:
            data.displayName ||
            "Анонімний гравець",

          score: currentScore,

          accuracy:
            data.accuracy ?? null,

          averageTime:
            data.averageTime ?? null
        });

        return;

      }


      /*
        Якщо новий результат
        кращий — замінюємо.
      */

      if (
        currentScore >
        currentBest.score
      ) {

        bestByUser.set(userId, {

          id: doc.id,

          userId,

          displayName:
            data.displayName ||
            "Анонімний гравець",

          score: currentScore,

          accuracy:
            data.accuracy ?? null,

          averageTime:
            data.averageTime ?? null

        });

      }

    });


    /*
      Перетворюємо Map у масив
      та сортуємо за score.
    */

    const leaderboard =
      Array.from(
        bestByUser.values()
      )
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 8)
      .map((item, index) => ({

        place: index + 1,

        id: item.id,

        displayName:
          item.displayName,

        score:
          item.score,

        accuracy:
          item.accuracy,

        averageTime:
          item.averageTime

      }));


    res.json({

      status: "ok",

      trainer,

      leaderboard

    });


  } catch (error) {

    logError(
      "Помилка отримання leaderboard",
      error
    );


    res.status(500).json({

      status: "error",

      message:
        "Не вдалося завантажити таблицю лідерів"

    });

  }

});


module.exports = router;