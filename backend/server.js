const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const resultRoutes = require("./routes/resultRoutes");
const statsRoutes = require("./routes/statsRoutes");
const verbalRoutes = require('./routes/verbalRoutes');

const { logInfo, logError } = require("./utils/logger");

const app = express();

const PORT = process.env.PORT || 3000;


// ---------------------------------------------------------
// Middleware
// ---------------------------------------------------------

app.use(cors());
app.use(express.json());


// ---------------------------------------------------------
// Health check
// ---------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "BrainDice backend працює"
  });
});


// ---------------------------------------------------------
// API routes
// ---------------------------------------------------------

app.use("/api/users", userRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/stats", statsRoutes);
app.use('/api/verbal', verbalRoutes);


// ---------------------------------------------------------
// 404
// ---------------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Маршрут не знайдено"
  });
});


// ---------------------------------------------------------
// Загальна обробка помилок
// ---------------------------------------------------------

app.use((err, req, res, next) => {
  logError("Невідома помилка сервера", err);

  res.status(500).json({
    status: "error",
    message: "Внутрішня помилка сервера"
  });
});


// ---------------------------------------------------------
// Запуск
// ---------------------------------------------------------

app.listen(PORT, () => {
  logInfo(`Server running on port ${PORT}`);
});