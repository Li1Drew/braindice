const adminLock = document.getElementById('adminLock');
const adminPanel = document.getElementById('adminPanel');
const statusMsg = document.getElementById('statusMsg');

// Вкладки та поля
const tabSingle = document.getElementById('tabSingle');
const tabBulk = document.getElementById('tabBulk');
const viewSingle = document.getElementById('viewSingle');
const viewBulk = document.getElementById('viewBulk');

const taskMode = document.getElementById('taskMode');
const fieldsBuilder = document.getElementById('fieldsBuilder');
const fieldsOptions = document.getElementById('fieldsOptions');
const optLabelMain = document.getElementById('optLabelMain');

const saveBtn = document.getElementById('saveBtn');
const bulkJson = document.getElementById('bulkJson');

let currentTab = 'single';
let isAuthResolved = false; 

// 1. ГОЛОВНА ФУНКЦІЯ ПЕРЕВІРКИ
function checkAdminAccess(user) {
    if (isAuthResolved) return;
    isAuthResolved = true;

    if (user && user.email === 'drew.nykoluk@gmail.com') {
        adminLock.classList.add('hidden');
        adminPanel.classList.remove('hidden');
    } else {
        adminLock.innerHTML = `
            <div class="lock-icon" style="color: #ef4444; font-size: 48px; margin-bottom: 15px;">🚫</div>
            <h2 style="color: #ef4444; margin:0 0 10px;">Доступ заборонено</h2>
            <p style="color: #64748b; margin:0 0 20px;">Ця сторінка доступна лише розробнику платформи.</p>
            <a href="/index.html" style="background: white; padding: 10px 20px; border-radius: 12px; border: 1px solid #e2e8f0; font-weight: bold; color: #1e293b; text-decoration: none;">Повернутися на головну</a>
        `;
    }
}

// 2. СЛУХАЄМО ПОДІЮ ВІД auth.js
window.addEventListener('firebaseAuthChanged', ({ detail }) => {
    checkAdminAccess(detail.user);
});

// 3. ПІДСТРАХОВКА (Якщо токен вже є)
let attempts = 0;
const authCheckInterval = setInterval(() => {
    attempts++;
    if (window.myFirebaseAuth) {
        clearInterval(authCheckInterval);
        setTimeout(() => {
            checkAdminAccess(window.myFirebaseAuth.currentUser);
        }, 500);
    }
    if (attempts > 30) {
        clearInterval(authCheckInterval);
        checkAdminAccess(null);
    }
}, 100);

// ==========================================
// ЛОГІКА ІНТЕРФЕЙСУ АДМІНКИ
// ==========================================

tabSingle.addEventListener('click', () => {
    currentTab = 'single';
    tabSingle.classList.add('active');
    tabBulk.classList.remove('active');
    viewSingle.classList.remove('hidden');
    viewBulk.classList.add('hidden');
    saveBtn.textContent = 'Зберегти слово';
});

tabBulk.addEventListener('click', () => {
    currentTab = 'bulk';
    tabBulk.classList.add('active');
    tabSingle.classList.remove('active');
    viewBulk.classList.remove('hidden');
    viewSingle.classList.add('hidden');
    saveBtn.textContent = 'Завантажити масив слів';
});

taskMode.addEventListener('change', () => {
    if (taskMode.value === 'builder') {
        fieldsBuilder.classList.remove('hidden');
        fieldsOptions.classList.add('hidden');
    } else {
        fieldsBuilder.classList.add('hidden');
        fieldsOptions.classList.remove('hidden');
        optLabelMain.textContent = taskMode.value === 'missing' ? 'Текст із пропуском (напр: С_РЦЕ)' : 'Слово для синоніма';
    }
});

saveBtn.addEventListener('click', async () => {
    let payload;

    if (currentTab === 'bulk') {
        try {
            const jsonText = bulkJson.value.trim();
            if (!jsonText) return showMsg("Вставте JSON масив!", false);
            payload = JSON.parse(jsonText);
            if (!Array.isArray(payload)) throw new Error();
        } catch (e) {
            return showMsg("Помилка! Це невалідний JSON-масив.", false);
        }
    } else {
        const mode = taskMode.value;
        payload = { mode };

        if (mode === 'builder') {
            const word = document.getElementById('b_word').value.toUpperCase().trim();
            const scrambled = document.getElementById('b_scrambled').value.toUpperCase().trim();
            if (!word || !scrambled) return showMsg("Заповніть обидва поля", false);
            payload.word = word;
            payload.scrambled = scrambled;
        } else {
            const mainText = document.getElementById('o_main').value.trim();
            const correct = document.getElementById('o_correct').value.trim();
            const opt1 = document.getElementById('o_opt1').value.trim();
            const optsStr = document.getElementById('o_opt234').value.trim();
            
            if (!mainText || !correct || !opt1 || !optsStr) return showMsg("Заповніть усі поля", false);
            
            const wrongOpts = optsStr.split(',').map(s => s.trim());
            if (wrongOpts.length !== 3) return showMsg("Введіть рівно 3 неправильні варіанти через кому", false);

            if (mode === 'missing') payload.text = mainText;
            else payload.word = mainText;

            payload.correct = correct;
            payload.options = [opt1, ...wrongOpts];
        }
    }

    try {
        saveBtn.disabled = true;
        saveBtn.textContent = "Збереження...";

        const token = await window.myFirebaseAuth.currentUser.getIdToken();
        const response = await fetch("https://braindice-api.onrender.com/api/verbal/words", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (response.ok) {
            showMsg(data.message || "Успішно збережено!", true);
            document.querySelectorAll('input').forEach(input => input.value = '');
            bulkJson.value = '';
        } else {
            showMsg(data.message || "Помилка сервера", false);
        }
    } catch (err) {
        showMsg("Помилка з'єднання з сервером", false);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = "Зберегти в базу";
    }
});

function showMsg(text, isSuccess) {
    statusMsg.textContent = text;
    statusMsg.className = `status-msg ${isSuccess ? 'success' : 'error'}`;
    setTimeout(() => { statusMsg.className = 'status-msg hidden'; }, 4000);
}