
const firebase = require('firebase/app');
require('firebase/auth');

const firebaseConfig = {
    apiKey: "****************",
    authDomain: "****************-****************-****************.firebaseapp.com",
    databaseURL: "https://****************-****************-rtdb.****************-****************.firebasedatabase.app",
    projectId: "****************",
    storageBucket: "****************-****************-****************.appspot.com",
    messagingSenderId: "****************",
    appId: "1:****************:web:****************"
  };

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

module.exports = firebase;
