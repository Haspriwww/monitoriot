import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Auth guard
onAuthStateChanged(auth, (user) => {
  if (!user) window.location.href = 'login.html';
});

document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();
  await signOut(auth);
  window.location.href = 'login.html';
});

// ====================================
// SENSOR DATA — hanya Suhu & Cahaya
// ====================================
const sensorRef = ref(db, 'sensor');

onValue(sensorRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) {
    loadDummy();
    return;
  }
  updateStats(data);
  updateTable(data.history || []);
  // Teruskan ke chart
  window.__sensorData = data;
  if (window.renderChart) window.renderChart(data.chart);
}, () => loadDummy());

function updateStats(data) {
  // Suhu
  const suhu = data.suhu ?? '--';
  document.getElementById('statSuhu').textContent = suhu + '°C';
  const trendSuhu = document.getElementById('trendSuhu');
  if (trendSuhu && suhu !== '--') {
    trendSuhu.textContent = suhu > 35 ? '↑ Panas!' : suhu > 28 ? '↑ Normal' : '↓ Dingin';
    trendSuhu.className = 'trend ' + (suhu > 35 ? 'down' : 'up');
  }

  // Cahaya
  const cahaya = data.cahaya ?? '--';
  document.getElementById('statCahaya').textContent = cahaya + ' lx';
  const trendCahaya = document.getElementById('trendCahaya');
  if (trendCahaya && cahaya !== '--') {
    trendCahaya.textContent = cahaya > 400 ? '↑ Terang' : cahaya > 100 ? '↑ Redup' : '↓ Gelap';
    trendCahaya.className = 'trend ' + (cahaya > 100 ? 'up' : 'down');
  }
}

function updateTable(rows) {
  const tbody = document.getElementById('dataTable');
  if (!tbody) return;
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td>${r.waktu}</td>
      <td>${r.sensor}</td>
      <td>${r.nilai}</td>
      <td><span class="badge-pill ${r.status === 'OK' ? 'ok' : r.status === 'WARN' ? 'warn' : 'err'}">${r.status}</span></td>
    </tr>
  `).join('');
}

// Fallback ke dummy.json
async function loadDummy() {
  try {
    const res = await fetch('data/dummy.json');
    const data = await res.json();
    updateStats(data);
    updateTable(data.history || []);
    window.__sensorData = data;
    if (window.renderChart) window.renderChart(data.chart);
  } catch (e) {
    console.warn('Tidak bisa memuat data dummy:', e);
  }
}

const REFRESH_INTERVAL_MS = 40000;
const REFRESH_EXPIRY_KEY = 'monitor8_refresh_expires';

function createManualRefreshButton() {
  let button = document.getElementById('manualRefreshBtn');
  if (button) return button;

  const container = document.querySelector('.topbar-actions');
  if (!container) return null;

  button = document.createElement('button');
  button.id = 'manualRefreshBtn';
  button.type = 'button';
  button.className = 'theme-toggle';
  button.textContent = 'Refresh';
  button.title = 'Segarkan data sekarang';
  button.style.marginRight = '10px';
  button.addEventListener('click', async () => {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Memperbarui...';

    try {
      if (typeof window.refreshPageData === 'function') {
        await window.refreshPageData();
      }
      const nextExpiry = Date.now() + REFRESH_INTERVAL_MS;
      setRefreshExpiry(nextExpiry);
      window.startRefreshCountdown(REFRESH_INTERVAL_MS);
    } catch (err) {
      console.warn('Manual refresh gagal:', err);
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });

  container.insertBefore(button, container.firstChild);
  return button;
}

function createRefreshCountdownLabel() {
  let label = document.getElementById('refreshCountdown');
  if (label) return label;

  const container = document.querySelector('.topbar-actions');
  if (!container) return null;

  createManualRefreshButton();

  label = document.createElement('div');
  label.id = 'refreshCountdown';
  label.className = 'badge-pill ok';
  label.style.minWidth = '170px';
  label.style.textAlign = 'center';
  label.style.whiteSpace = 'nowrap';
  label.textContent = 'Refresh dalam 40 detik';
  container.appendChild(label);
  return label;
}

function getRefreshExpiry() {
  const raw = sessionStorage.getItem(REFRESH_EXPIRY_KEY);
  return raw ? Number(raw) : 0;
}

function setRefreshExpiry(expiresAt) {
  sessionStorage.setItem(REFRESH_EXPIRY_KEY, String(expiresAt));
}

function ensureRefreshExpiry(interval = REFRESH_INTERVAL_MS) {
  const now = Date.now();
  let expiry = getRefreshExpiry();
  if (!expiry || expiry <= now) {
    expiry = now + interval;
    setRefreshExpiry(expiry);
  }
  return expiry;
}

function getRefreshRemainingSeconds() {
  const expiry = getRefreshExpiry();
  if (!expiry) return Math.ceil(REFRESH_INTERVAL_MS / 1000);
  return Math.max(0, Math.ceil((expiry - Date.now()) / 1000));
}

window.updateRefreshCountdown = function (seconds) {
  const label = createRefreshCountdownLabel();
  if (!label) return;
  label.textContent = seconds > 0 ? `Refresh dalam ${seconds} detik` : 'Memperbarui...';
};

window.startRefreshCountdown = function (interval = REFRESH_INTERVAL_MS) {
  if (window.__refreshCountdownTimer) {
    window.clearInterval(window.__refreshCountdownTimer);
  }

  const expiry = ensureRefreshExpiry(interval);
  window.updateRefreshCountdown(getRefreshRemainingSeconds());

  window.__refreshCountdownTimer = window.setInterval(() => {
    const remaining = getRefreshRemainingSeconds();
    window.updateRefreshCountdown(remaining);
  }, 1000);
};

// Auto-refresh helper untuk semua halaman yang memanfaatkan data dummy atau Firebase fallback
window.refreshPageData = async function () {
  if (!window.__sensorData || Object.keys(window.__sensorData).length === 0) {
    await loadDummy();
  }
};

window.setupAutoRefresh = function (interval = REFRESH_INTERVAL_MS) {
  if (window.__autoRefreshTimer) {
    window.clearInterval(window.__autoRefreshTimer);
  }

  ensureRefreshExpiry(interval);
  window.startRefreshCountdown(interval);

  window.__autoRefreshTimer = window.setInterval(async () => {
    if (typeof window.refreshPageData === 'function') {
      try {
        await window.refreshPageData();
      } catch (err) {
        console.warn('Auto-refresh gagal:', err);
      }
    }
    const nextExpiry = Date.now() + interval;
    setRefreshExpiry(nextExpiry);
    window.startRefreshCountdown(interval);
  }, interval);
};

window.setupAutoRefresh();

// ====================================
// RELAY CONTROL
// ====================================
const relayRef = ref(db, 'relay/1');
const relayToggle = document.getElementById('relayToggle');
const relayLabel  = document.getElementById('relayLabel');
const relayStatus = document.getElementById('relayStatus');

// Dengarkan perubahan relay dari Firebase (realtime)
onValue(relayRef, (snapshot) => {
  const val = snapshot.val();
  const isOn = val === 1 || val === true || val === '1';

  if (relayToggle) relayToggle.checked = isOn;
  if (relayLabel)  relayLabel.textContent = isOn ? 'ON' : 'OFF';
  if (relayLabel)  relayLabel.style.color = isOn ? '#10b981' : 'var(--muted)';
  if (relayStatus) relayStatus.textContent =
    'Status: ' + (isOn ? '🟢 Menyala — perangkat aktif' : '🔴 Mati — perangkat non-aktif');
});

// Ketika toggle diklik → tulis ke Firebase & simpan ke riwayat
if (relayToggle) {
  relayToggle.addEventListener('change', async () => {
    const newState = relayToggle.checked ? 1 : 0;
    const labelState = newState === 1 ? 'ON' : 'OFF';
    try {
      // 1. Update status relay
      await set(relayRef, newState);
      console.log('Relay 1 set to:', newState);

      // 2. Tambahkan log ke history sensor di Firebase
      const historyRef = ref(db, 'sensor/history');
      const historySnapshot = await get(historyRef);
      let history = historySnapshot.val() || [];
      if (!Array.isArray(history)) {
        history = history ? Object.values(history) : [];
      }

      const now = new Date();
      // Format jam: menit: detik lokal
      const timeStr = now.toTimeString().split(' ')[0];
      // Format tanggal: YYYY-MM-DD
      const dateStr = now.toISOString().split('T')[0];

      history.push({
        waktu: timeStr,
        tanggal: dateStr,
        sensor: 'Relay 1',
        nilai: labelState,
        status: 'OK'
      });

      // Batasi history maksimal 50 baris
      if (history.length > 50) {
        history = history.slice(-50);
      }

      await set(historyRef, history);

    } catch (err) {
      console.error('Gagal mengubah relay atau mencatat riwayat:', err);
      // Kembalikan toggle jika gagal
      relayToggle.checked = !relayToggle.checked;
    }
  });
}
