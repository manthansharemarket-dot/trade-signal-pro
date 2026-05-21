import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {

    apiKey: "AIzaSyCwprMXr02lRZzA_sVl0PyW-RbkUGgSpMI",

    authDomain: "manthansharemarket-2d1f9.firebaseapp.com",

    projectId: "manthansharemarket-2d1f9",

    storageBucket: "manthansharemarket-2d1f9.firebasestorage.app",

    messagingSenderId: "46940862623",

    appId: "1:46940862623:web:1fbabc4399db061ed68aaa",

    measurementId: "G-X8WQQLQ5B7"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export { auth, db };