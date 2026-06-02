import { auth } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (message) {
      message.textContent = 'Memproses...';
      message.className = 'form-message';
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (message) {
        message.textContent = 'Berhasil masuk! Mengalihkan...';
        message.className = 'form-message success';
      }
      setTimeout(() => (window.location.href = 'dashboard.html'), 800);
    } catch (err) {
      const errorText = err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found'
        ? 'Email atau password salah.'
        : 'Gagal masuk. Periksa koneksi atau akun Anda.';
      if (message) {
        message.textContent = errorText;
        message.className = 'form-message error';
      }
      console.error('Login error:', err);
    }
  });
}

// Auto redirect jika sudah login
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.endsWith('login.html')) {
    window.location.href = 'dashboard.html';
  }
});

export async function logout() {
  await signOut(auth);
  window.location.href = 'login.html';
}

// Toggle show/hide password di form login
window.togglePassword = function () {
  const pass = document.getElementById('password');
  const btn = document.querySelector('.toggle-pass-btn');
  if (!pass) return;
  if (pass.type === 'password') {
    pass.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    pass.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
};
