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
