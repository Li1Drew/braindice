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

const modal = document.getElementById('authModal');
const authBtn = document.getElementById('authBtn');

authBtn.onclick = () => {
    if (auth.currentUser) {
        signOut(auth);
    } else {
        modal.classList.remove('hidden');
    }
};

document.querySelector('.close-modal').onclick = () => modal.classList.add('hidden');

onAuthStateChanged(auth, (user) => {
    if (user) {
        authBtn.innerText = "Вийти (" + user.email.split('@')[0] + ")";
        modal.classList.add('hidden');
    } else {
        authBtn.innerText = "Увійти";
    }
});

window.handleAuth = async (type) => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const message = document.getElementById('authMessage');

    try {
        if (type === 'register') {
            await createUserWithEmailAndPassword(auth, email, password);
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        message.innerText = "Помилка: " + error.code;
    }
};