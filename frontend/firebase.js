// paste Firebase config here
const firebaseConfig = {
  apiKey: "AIzaSyCELC91dEecbZtIIHtoqZ134KGjS1iSVuA",
  authDomain: "bunkbank-9a272.firebaseapp.com",
  projectId: "bunkbank-9a272",
  storageBucket: "bunkbank-9a272.firebasestorage.app",
  messagingSenderId: "528529720718",
  appId: "1:528529720718:web:3c5a93f57dae43649a10df",
  measurementId: "G-R6WK41P2TG"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
