import { auth } from "./firebase-config.js";

import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";


// Email Login
const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try{

        const userCredential =
        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        alert("Login Successful");

        window.location.href = "dashboard.html";

    }catch(error){

        alert(error.message);

    }

});


// Google Login
const googleBtn = document.getElementById("googleBtn");

googleBtn.addEventListener("click", async () => {

    const provider = new GoogleAuthProvider();

    try{

        await signInWithPopup(auth, provider);

        alert("Google Login Successful");

        window.location.href = "dashboard.html";

    }catch(error){

        alert(error.message);

    }

});