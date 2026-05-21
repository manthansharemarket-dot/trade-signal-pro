const firebaseConfig = {

apiKey: "AIzaSyCwprMXr02lRZzA_sVl0PyW-RbkUGgSpMI",

authDomain: "manthansharemarket-2d1f9.firebaseapp.com",

projectId: "manthansharemarket-2d1f9",

storageBucket: "manthansharemarket-2d1f9.firebasestorage.app",

messagingSenderId: "46940862623",

appId: "1:46940862623:web:1fbabc4399db061ed68aaa",

measurementId: "G-X8WQQLQ5B7"

};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

auth.onAuthStateChanged((user)=>{

if(!user){

window.location.href = "login.html";

}

});