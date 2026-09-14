const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");

const serviceAccountPath = path.join(
  __dirname,
  "serviceAccountKey.json"
);

const serviceAccount = require(serviceAccountPath);

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount)
    });

const db = getFirestore(app);
const auth = getAuth(app);

module.exports = {
  app,
  db,
  auth
};