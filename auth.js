import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut,
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyD-DU7-nvQv3p18MIlIpgRTdKJNIwLVUJg",
    authDomain: "braindice-2fbf6.firebaseapp.com",
    projectId: "braindice-2fbf6",
    storageBucket: "braindice-2fbf6.firebasestorage.app",
    messagingSenderId: "876632011120",
    appId: "1:876632011120:web:5b5c5725ac513e8c8edfb5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.myFirebaseAuth = auth;
window.logoutBrainDice = async () => {
    await signOut(auth);
};

// --- Елементи ---
const modal = document.getElementById('authModal');
const authBtn = document.getElementById('authBtn');
const profileBtn = document.getElementById("profileBtn");
const closeModal = document.getElementById('closeModal');

const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// --- Логіка вкладок ---
if (tabLogin && tabRegister) {
    tabLogin.onclick = () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        document.getElementById('loginMessage').classList.add('hidden');
    };

    tabRegister.onclick = () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        document.getElementById('regMessage').classList.add('hidden');
        document.getElementById('regSuccess').classList.add('hidden');
    };
}

// --- Відкриття/Закриття ---
if (authBtn) {
    authBtn.onclick = () => {
        if (auth.currentUser) {
            signOut(auth);
        } else if (modal) {
            modal.classList.remove('hidden');
        }
    };
}

if (closeModal && modal) {
    closeModal.onclick = () => modal.classList.add('hidden');
}

// --- Слухач стану авторизації ---
onAuthStateChanged(auth, async (user) => {
    window.myFirebaseUser = user;

    window.dispatchEvent(
        new CustomEvent("firebaseAuthChanged", {
            detail: { user }
        })
    );

    if (user) {
        console.log("Firebase Auth: Гравець авторизований ->", user.email);
        if (authBtn) {
            const displayName = user.displayName || user.email.split("@")[0];
            authBtn.innerText = "Вийти (" + displayName + ")";
        }
        if (profileBtn) profileBtn.classList.remove("hidden");

        // Шукаємо кнопку адмінки на сторінці
const adminBtn = document.getElementById('adminBtn');

// Якщо ми на головній сторінці (кнопка існує)
if (adminBtn) {
    // Перевіряємо email. Якщо це ти — показуємо кнопку
    if (user.email === 'drew.nykoluk@gmail.com') {
        adminBtn.classList.remove('hidden');
    } else {
        adminBtn.classList.add('hidden');
    }
}
        
        // Зберігаємо токен
        window.gameUserToken = await user.getIdToken();
    } else {
        console.log("Firebase Auth: Гравець НЕ авторизований");
        if (authBtn) authBtn.innerText = "Увійти";
        if (profileBtn) profileBtn.classList.add("hidden");
        window.gameUserToken = null;
    }
});

// --- Основна функція реєстрації та входу ---
window.handleAuth = async (type) => {
    const submitBtn = event.target;
    const originalBtnText = submitBtn.innerText;
    
    // Блокуємо кнопку
    submitBtn.disabled = true;
    submitBtn.innerText = "Зачекайте...";
    submitBtn.style.opacity = "0.7";

    try {
        let userCredential;
        let token;
        let displayNameToSave;

        if (type === 'register') {
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const nickname = document.getElementById('regNickname').value.trim();
            const message = document.getElementById('regMessage');
            const successMsg = document.getElementById('regSuccess');

            if (!email || !password || !nickname) {
                throw new Error("empty_fields");
            }

            // Перевірка нікнейму (тепер вона сувора!)
            const checkNick = await fetch(`http://localhost:3000/api/users/check-nickname?name=${nickname}`);
            if (checkNick.status === 409) {
                throw new Error("nickname_taken");
            }
            if (!checkNick.ok) {
                throw new Error("nickname_server_error"); // Якщо бекенд вимкнений або повернув іншу помилку
            }

            // Створення акаунту
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Оновлення профілю та відправка листа
            await updateProfile(user, { displayName: nickname });
            await sendEmailVerification(user);
            
            // Одразу викидаємо користувача (модальне вікно при цьому залишається відкритим)
            await signOut(auth);

            // Показуємо успіх
            message.classList.add('hidden');
            successMsg.classList.remove('hidden');

            // ОЧИЩАЄМО ПОЛЯ РЕЄСТРАЦІЇ
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regNickname').value = '';

            return; // Завершуємо

        } else {
            // Логіка ВХОДУ
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const message = document.getElementById('loginMessage');

            if (!email || !password) {
                throw new Error("empty_fields");
            }

            userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Перевіряємо пошту
            if (!user.emailVerified) {
                await signOut(auth);
                throw new Error("email_not_verified");
            }

            displayNameToSave = user.displayName || email.split('@')[0];
            message.classList.add('hidden');
            token = await user.getIdToken();
        }

        // Відправляємо дані на бекенд тільки після УСПІШНОГО входу
        if (type === 'login') {
            await fetch("http://localhost:3000/api/users/profile", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ displayName: displayNameToSave })
            });

            // Закриваємо модалку тільки тоді, коли ми повністю ввійшли
            if (modal) modal.classList.add('hidden');
            
            // Очищаємо поля логіну
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        }

    } catch (error) {
        let errorEl = type === 'register' ? document.getElementById('regMessage') : document.getElementById('loginMessage');
        errorEl.classList.remove('hidden');
        
        switch(error.code || error.message) {
            case 'empty_fields': 
                errorEl.innerText = "Будь ласка, заповніть всі поля."; break;
            case 'nickname_taken': 
                errorEl.innerText = "Цей нікнейм вже зайнятий! Придумайте інший."; break;
            case 'nickname_server_error': 
                errorEl.innerText = "Помилка перевірки нікнейму. Можливо, не запущений сервер."; break;
            case 'email_not_verified': 
                errorEl.innerText = "Спочатку підтвердіть пошту! Перевірте скриньку (і папку Спам)."; break;
            case 'auth/email-already-in-use': 
                errorEl.innerText = "Ця пошта вже зареєстрована."; break;
            case 'auth/invalid-email': 
                errorEl.innerText = "Некоректний формат пошти."; break;
            case 'auth/weak-password': 
                errorEl.innerText = "Пароль надто слабкий (мінімум 6 символів)."; break;
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password': 
                errorEl.innerText = "Неправильний email або пароль."; break;
            default: 
                errorEl.innerText = "Помилка: " + (error.message || error.code);
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
        submitBtn.style.opacity = "1";
    }
};

// --- ФУНКЦІЯ ВІДНОВЛЕННЯ ПАРОЛЯ ---
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
if (forgotPasswordBtn) {
    forgotPasswordBtn.onclick = async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const message = document.getElementById('loginMessage');
        
        if (!email) {
            message.innerText = "Введіть ваш email у поле вище, а потім натисніть цю кнопку.";
            message.classList.remove('hidden');
            message.style.color = "#ef4444";
            return;
        }

        try {
            // Кнопка має візуально реагувати
            forgotPasswordBtn.innerText = "Відправка...";
            await sendPasswordResetEmail(auth, email);
            message.innerText = "Лист для скидання пароля надіслано! Перевірте пошту.";
            message.style.color = "#10b981"; // Зелений
            message.classList.remove('hidden');
        } catch (error) {
            message.style.color = "#ef4444"; // Червоний
            message.innerText = "Помилка: " + error.code;
            message.classList.remove('hidden');
        } finally {
            forgotPasswordBtn.innerText = "Забули пароль?";
        }
    };
}