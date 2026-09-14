const { auth } = require("../config/firebase");
const { logInfo, logError } = require("../utils/logger");

async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Необхідна авторизація"
      });
    }

    const idToken = authHeader.substring(7).trim();

    if (!idToken) {
      return res.status(401).json({
        status: "error",
        message: "Токен авторизації відсутній"
      });
    }

    const decodedToken = await auth.verifyIdToken(idToken);

    req.user = decodedToken;

    logInfo("Користувач авторизований", {
      uid: decodedToken.uid
    });

    next();

  } catch (error) {
    logError("Помилка авторизації", error);

    return res.status(401).json({
      status: "error",
      message: "Недійсний або прострочений токен"
    });
  }
}

module.exports = authenticateUser;