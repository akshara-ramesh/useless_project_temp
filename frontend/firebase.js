// firebase.js (for Firebase v9+ Modular SDK)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCELC91dEecbZtIIHtoqZ134KGjS1iSVuA",
  authDomain: "bunkbank-9a272.firebaseapp.com",
  projectId: "bunkbank-9a272",
  storageBucket: "bunkbank-9a272.appspot.com",
  messagingSenderId: "528529720718",
  appId: "1:528529720718:web:3c5a93f57dae43649a10df",
  measurementId: "G-R6WK41P2TG"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
