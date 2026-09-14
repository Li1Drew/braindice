const express = require("express");

const { FieldValue } = require("firebase-admin/firestore");

const { db } = require("../config/firebase");

const authenticateUser = require("../middleware/auth");

const {
  logInfo,
  logError
} = require("../utils/logger");

const router = express.Router();


// ---------------------------------------------------------
// GET /api/users/me
// ---------------------------------------------------------

router.get("/me", authenticateUser, async (req, res) => {

  try {

    const uid = req.user.uid;

    const userRef = db
      .collection("users")
      .doc(uid);

    const userDoc = await userRef.get();


    if (!userDoc.exists) {

      return res.status(404).json({
        status: "error",
        message: "Профіль користувача не знайдено"
      });

    }


    return res.json({
      status: "ok",

      user: {
        uid,
        ...userDoc.data()
      }
    });

  } catch (error) {

    logError(
      "Помилка отримання профілю",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Не вдалося отримати профіль"
    });

  }

});


// ---------------------------------------------------------
// POST /api/users/profile
// ---------------------------------------------------------

router.post("/profile", authenticateUser, async (req, res) => {

  try {

    const uid = req.user.uid;

    let { displayName } = req.body;


    // -------------------------------------------------------
    // Валідація displayName
    // -------------------------------------------------------

    if (
      displayName !== undefined &&
      typeof displayName !== "string"
    ) {

      return res.status(400).json({
        status: "error",
        message: "displayName має бути текстом"
      });

    }


    if (typeof displayName === "string") {

      displayName = displayName.trim();

      if (displayName.length > 30) {

        return res.status(400).json({
          status: "error",
          message:
            "Ім'я користувача не може бути довшим за 30 символів"
        });

      }

    }


    const userRef = db
      .collection("users")
      .doc(uid);

    const userDoc = await userRef.get();

    const now = FieldValue.serverTimestamp();


    // -------------------------------------------------------
    // Створення профілю
    // -------------------------------------------------------

    if (!userDoc.exists) {

      const finalDisplayName =
        displayName ||
        (
          req.user.email
            ? req.user.email.split("@")[0]
            : "Користувач"
        );


      await userRef.set({

        uid,

        email:
          req.user.email || null,

        displayName:
          finalDisplayName,

        createdAt: now,

        updatedAt: now

      });


      logInfo("Створено профіль користувача", {
        userId: uid
      });

    }

    // -------------------------------------------------------
    // Оновлення профілю
    // -------------------------------------------------------

    else {

      const updateData = {
        updatedAt: now
      };


      if (displayName !== undefined) {

        updateData.displayName =
          displayName || "Користувач";

      }


      await userRef.update(updateData);


      logInfo("Оновлено профіль користувача", {
        userId: uid
      });

    }


    const updatedDoc =
      await userRef.get();


    return res.json({

      status: "ok",

      message: "Профіль збережено",

      user: {
        uid,
        ...updatedDoc.data()
      }

    });

  } catch (error) {

    logError(
      "Помилка збереження профілю",
      error
    );

    return res.status(500).json({
      status: "error",
      message: "Не вдалося зберегти профіль"
    });

  }

});


module.exports = router;