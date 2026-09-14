const { FieldValue } = require("firebase-admin/firestore");
const { db } = require("../config/firebase");

/**
 * Зберігає результат гри користувача.
 */
async function saveResult(uid, resultData, displayName) {
  const {
    trainer,
    score,
    accuracy,
    averageTime,
    difficulty,
    duration,
    metadata
  } = resultData;

  const result = {
    userId: uid,
    displayName: displayName || "Анонімний гравець",

    trainer,

    score: Number(score),

    accuracy:
      accuracy !== undefined
        ? Number(accuracy)
        : null,

    averageTime:
      averageTime !== undefined
        ? Number(averageTime)
        : null,

    difficulty:
      difficulty !== undefined
        ? Number(difficulty)
        : null,

    duration:
      duration !== undefined
        ? Number(duration)
        : null,

    metadata:
      metadata && typeof metadata === "object"
        ? metadata
        : {},

    createdAt: FieldValue.serverTimestamp()
  };

  const resultRef = await db
    .collection("results")
    .add(result);

  return {
    id: resultRef.id,
    ...result
  };
}


/**
 * Отримує останні результати конкретного користувача.
 */
async function getUserResults(uid, limit = 20) {
  const snapshot = await db
    .collection("results")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}


/**
 * Отримує leaderboard конкретного тренажера.
 */
async function getLeaderboard(trainer, limit = 8) {
  const snapshot = await db
    .collection("results")
    .where("trainer", "==", trainer)
    .orderBy("score", "desc")
    .get();

  // Один найкращий результат на одного користувача
  const bestByUser = new Map();

  snapshot.docs.forEach(doc => {
    const data = doc.data();

    const userId = data.userId;

    if (!userId) {
      return;
    }

    const currentBest = bestByUser.get(userId);

    if (
      !currentBest ||
      Number(data.score || 0) > Number(currentBest.score || 0)
    ) {
      bestByUser.set(userId, {
        id: doc.id,
        displayName: data.displayName || "Анонімний гравець",
        score: Number(data.score || 0),
        accuracy: data.accuracy ?? null,
        averageTime: data.averageTime ?? null
      });
    }
  });

  // Перетворюємо Map у масив і сортуємо
  const leaderboard = Array.from(bestByUser.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, index) => ({
      place: index + 1,
      ...item
    }));

  return leaderboard;
}


/**
 * Отримує всі результати користувача.
 *
 * Використовується статистикою.
 */
async function getAllUserResults(uid) {
  const snapshot = await db
    .collection("results")
    .where("userId", "==", uid)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}


module.exports = {
  saveResult,
  getUserResults,
  getLeaderboard,
  getAllUserResults
};