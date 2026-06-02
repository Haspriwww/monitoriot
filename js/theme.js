const THEME_KEY = 'monitor8_theme';
const root = document.documentElement;
const themeButton = document.getElementById('themeToggle');

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY);
}

function getPreferredTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  if (themeButton) {
    themeButton.textContent = theme === 'light' ? '🌙' : '☀️';
    themeButton.setAttribute('aria-label', theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang');
    themeButton.title = themeButton.getAttribute('aria-label');
  }
}

const initialTheme = getStoredTheme() || getPreferredTheme();
setTheme(initialTheme);

if (themeButton) {
  themeButton.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    setTheme(current);
  });
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  if (!getStoredTheme()) {
    setTheme(event.matches ? 'dark' : 'light');
  }
});

function createBackToTopButton() {
  if (document.getElementById('backToTopButton')) return;

  const button = document.createElement('button');
  button.id = 'backToTopButton';
  button.type = 'button';
  button.className = 'back-to-top';
  button.setAttribute('aria-label', 'Kembali ke atas');
  button.innerHTML = '↑';

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.body.appendChild(button);
  toggleBackToTopButton();
}

function toggleBackToTopButton() {
  const button = document.getElementById('backToTopButton');
  if (!button) return;
  button.classList.toggle('visible', window.scrollY > 200);
}

window.addEventListener('scroll', toggleBackToTopButton, { passive: true });
window.addEventListener('resize', toggleBackToTopButton);
window.addEventListener('DOMContentLoaded', createBackToTopButton);

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  createBackToTopButton();
}
