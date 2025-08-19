// firebaseclient.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Modular Firebase Auth import
import { getFirestore } from 'firebase/firestore'; // Modular Firebase Firestore import

const firebaseConfig = {
  apiKey: "********",
  authDomain: "********",
  databaseURL: "********",
  projectId: "********",
  storageBucket: "********",
  messagingSenderId: "********",
  appId: "********"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Initialize Firebase Auth
const firestore = getFirestore(app); // Initialize Firestore

export { auth, firestore };