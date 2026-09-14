const express = require("express");

const authenticateUser = require("../middleware/auth");
const { logError } = require("../utils/logger");

const {
  getAllUserResults
} = require("../services/resultService");

const router = express.Router();


/*
  GET /api/stats/me

  Загальна статистика поточного користувача.
*/
router.get("/me", authenticateUser, async (req, res) => {
  try {
    const uid = req.user.uid;

    const results = await getAllUserResults(uid);

    const totalGames = results.length;

    // Якщо користувач ще нічого не проходив
    if (totalGames === 0) {
      return res.json({
        status: "ok",
        statistics: {
          totalGames: 0,
          bestScore: 0,
          averageScore: 0,
          trainers: {}
        }
      });
    }


    /*
      Загальна статистика
    */

    const scores = results
      .map(result => Number(result.score))
      .filter(score => Number.isFinite(score));

    const bestScore = scores.length
      ? Math.max(...scores)
      : 0;

    const averageScore = scores.length
      ? Math.round(
          scores.reduce(
            (sum, score) => sum + score,
            0
          ) / scores.length
        )
      : 0;


    /*
      Статистика по тренажерах
    */

    const trainers = {};

    results.forEach(result => {
      const trainer = result.trainer;

      if (!trainer) {
        return;
      }

      if (!trainers[trainer]) {
        trainers[trainer] = {
          games: 0,
          bestScore: 0,
          totalScore: 0
        };
      }

      trainers[trainer].games++;

      const score = Number(result.score);

      if (Number.isFinite(score)) {
        trainers[trainer].totalScore += score;

        if (
          score > trainers[trainer].bestScore
        ) {
          trainers[trainer].bestScore = score;
        }
      }
    });


    /*
      Середній результат по кожному тренажеру
    */

    Object.keys(trainers).forEach(trainer => {
      const data = trainers[trainer];

      data.averageScore =
        data.games > 0
          ? Math.round(
              data.totalScore / data.games
            )
          : 0;

      delete data.totalScore;
    });


    res.json({
      status: "ok",
      statistics: {
        totalGames,
        bestScore,
        averageScore,
        trainers
      }
    });

  } catch (error) {
    logError(
      "Помилка отримання статистики",
      error
    );

    res.status(500).json({
      status: "error",
      message: "Не вдалося отримати статистику"
    });
  }
});


module.exports = router;