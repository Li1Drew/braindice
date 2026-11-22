const express = require('express');
const router = express.Router();
const authenticateUser = require('../middleware/auth');
const { db } = require('../config/firebase');

const ADMIN_EMAIL = 'drew.nykoluk@gmail.com';

// 1. Отримати слова для гри (Для всіх гравців)
router.get('/tasks', async (req, res) => {
    try {
        const snapshot = await db.collection('verbal_dictionary').get();
        
        let verbalDB = { missing: [], synonym: [], builder: [] };

        // Якщо база порожня, даємо базові слова, щоб гра не крашилась
        if (snapshot.empty) {
            verbalDB.builder.push({ word: "АДМІН", scrambled: "ДМІНА" });
            verbalDB.synonym.push({ word: "ТЕСТ", options: ["Проба", "Помилка", "Слово", "Гра"], correct: "Проба" });
            verbalDB.missing.push({ text: "Т_СТ", options: ["Е", "О", "А", "І"], correct: "Е" });
        } else {
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.mode && verbalDB[data.mode]) {
                    verbalDB[data.mode].push(data);
                }
            });
        }

        res.json({ status: 'ok', data: verbalDB });
    } catch (error) {
        console.error("Помилка завантаження бази слів:", error);
        res.status(500).json({ status: 'error', message: 'Помилка сервера' });
    }
});

// 2. Додати нові слова (ТІЛЬКИ ДЛЯ АДМІНА)
router.post('/words', authenticateUser, async (req, res) => {
    try {
        // Захист: перевіряємо, чи це ти
        if (req.user.email !== ADMIN_EMAIL) {
            return res.status(403).json({ 
                status: 'error', 
                message: 'Доступ заборонено! Тільки для адміністратора.' 
            });
        }

        // req.body може бути як одним об'єктом, так і масивом об'єктів
        const words = Array.isArray(req.body) ? req.body : [req.body];
        
        // Використовуємо batch для швидкого запису багатьох документів одночасно
        const batch = db.batch();
        
        words.forEach(word => {
            const docRef = db.collection('verbal_dictionary').doc(); // створюємо новий ID
            batch.set(docRef, {
                ...word,
                createdAt: new Date().toISOString()
            });
        });

        // Виконуємо запис
        await batch.commit();

        res.json({ 
            status: 'ok', 
            message: words.length > 1 ? `Успішно збережено ${words.length} слів!` : 'Слово успішно збережено!' 
        });
        
    } catch (error) {
        console.error("Помилка додавання слова:", error);
        res.status(500).json({ status: 'error', message: 'Не вдалося зберегти дані в базу' });
    }
});

module.exports = router;