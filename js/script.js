// ===== TEMA-VÄXLING =====
(function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';

  if (next === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  }

  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = isDark ? '☀️' : '🌙';
  btn.setAttribute('aria-label', isDark ? 'Byt till ljust tema' : 'Byt till mörkt tema');
}

// ===== EXPANDERBAR KURSINFO =====
function toggleDetails(btn) {
  const card = btn.closest('.course-card');
  const details = card.querySelector('.course-details');
  const isOpen = details.classList.contains('open');

  details.classList.toggle('open');
  btn.textContent = isOpen ? 'Mer info' : 'Mindre info';
}

// ===== BOKNINGSMODAL =====
function openBooking() {
  const overlay = document.getElementById('bookingModal');
  if (!overlay) return;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeBooking() {
  const overlay = document.getElementById('bookingModal');
  if (!overlay) return;

  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Stäng modal vid klick utanför
document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    closeBooking();
  }
});

// Stäng med Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeBooking();
});

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();

  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.addEventListener('click', toggleTheme);
});
