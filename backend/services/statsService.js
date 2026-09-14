const { db } = require("../config/firebase");


/*
  Отримання загальної статистики користувача.
*/
async function getUserStatistics(uid) {
  const snapshot = await db
    .collection("results")
    .where("userId", "==", uid)
    .get();

  const results = snapshot.docs.map(doc => doc.data());

  const totalGames = results.length;


  /*
    Якщо користувач ще не проходив жодної гри.
  */
  if (totalGames === 0) {
    return {
      totalGames: 0,
      bestScore: 0,
      averageScore: 0,
      trainers: {}
    };
  }


  /*
    Загальна статистика результатів.
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
    Статистика окремо для кожного тренажера.
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

      if (score > trainers[trainer].bestScore) {
        trainers[trainer].bestScore = score;
      }
    }
  });


  /*
    Розрахунок середнього результату
    для кожного тренажера.
  */
  Object.keys(trainers).forEach(trainer => {
    const trainerStats = trainers[trainer];

    trainerStats.averageScore =
      trainerStats.games > 0
        ? Math.round(
            trainerStats.totalScore /
            trainerStats.games
          )
        : 0;

    delete trainerStats.totalScore;
  });


  return {
    totalGames,
    bestScore,
    averageScore,
    trainers
  };
}


module.exports = {
  getUserStatistics
};