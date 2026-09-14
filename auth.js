import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const modal = document.getElementById('authModal');
const authBtn = document.getElementById('authBtn');
const profileBtn = document.getElementById("profileBtn");
const closeModal = document.querySelector('.close-modal');

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

onAuthStateChanged(auth, async (user) => {
    // Робимо поточного користувача доступним для інших JS-файлів
    window.myFirebaseUser = user;

    // Повідомляємо інші сторінки/скрипти про зміну авторизації
    window.dispatchEvent(
        new CustomEvent("firebaseAuthChanged", {
            detail: { user }
        })
    );

    if (user) {
        console.log(
            "Firebase Auth: Гравець авторизований ->",
            user.email
        );

        if (authBtn) {
            authBtn.innerText =
                "Вийти (" + user.email.split("@")[0] + ")";
        }
        
        if (profileBtn) {
            profileBtn.classList.remove("hidden");
        }

        if (modal) {
            modal.classList.add("hidden");
        }

        // Зберігаємо токен для ігрових скриптів
        window.gameUserToken = await user.getIdToken();

    } else {
        console.log(
            "Firebase Auth: Гравець НЕ авторизований"
        );

        if (authBtn) {
            authBtn.innerText = "Увійти";
        }

        window.gameUserToken = null;
    }
});

window.handleAuth = async (type) => {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const message = document.getElementById('authMessage');

    if (!email || !password) return;

    try {
        let userCredential;
        if (type === 'register') {
            userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } else {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
        }

        const user = userCredential.user;
        const token = await user.getIdToken();
        const defaultName = email.split('@')[0];

        await fetch("http://localhost:3000/api/users/profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ displayName: defaultName })
        });
        // -------------------------------------------------------------

    } catch (error) {
        if (message) message.innerText = "Помилка: " + error.code;
    }
};