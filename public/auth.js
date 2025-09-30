import { auth } from './firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Login
document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('password').value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
    window.location.href = 'dashboard.html';
  } catch (err) {
    alert('User does not exist. Please register first.');
  }
});

// Register
document.getElementById('registerBtn').addEventListener('click', async () => {
  const email = document.getElementById('email').value.trim();
  const pass = document.getElementById('password').value;
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    alert('Account created! You are now logged in.');
    window.location.href = 'dashboard.html';
  } catch (err) {
    alert('Registration failed: Try again. ');
  }
});
