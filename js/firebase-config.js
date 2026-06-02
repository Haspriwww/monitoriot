// Firebase Configuration
// Project: monitoring-92e1e
// PENTING: Jangan commit file ini ke repository publik.
// Gunakan Firebase Security Rules untuk membatasi akses data.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDb9lE3R3LCGE-txTaJMDy2rmSyye-c6q4",
  authDomain: "monitor-ujikom.firebaseapp.com",
  databaseURL: "https://monitor-ujikom-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "monitor-ujikom",
  storageBucket: "monitor-ujikom.firebasestorage.app",
  messagingSenderId: "244572398312",
  appId: "1:244572398312:web:50310a3376cb23715bdf5d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;
