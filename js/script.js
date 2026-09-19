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
function openBooking(courseName) {
  const overlay = document.getElementById('bookingModal');
  const title = document.getElementById('bookingCourseName');
  if (!overlay) return;

  title.textContent = courseName;
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

// ===== KONFIGURATION =====
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztX9oslpvj0grIKA9ujXvazJYI39T1EsZYR0F6g0MjS7XDWTMivP2GcWEcd8OpQsHZCg/exec';

// ===== BOKNINGSFORMULÄR =====
async function submitBooking(event) {
  event.preventDefault();

  const form = event.target;
  const message = document.getElementById('formMessage');
  const submitBtn = form.querySelector('button[type="submit"]');

  const namnEl = document.getElementById('namn');
  const epostEl = document.getElementById('epost');
  const foretagEl = document.getElementById('foretag');

  const data = {
    namn: namnEl.value.trim(),
    epost: epostEl.value.trim(),
    foretag: foretagEl.value.trim(),
    kurs: document.getElementById('bookingCourseName').textContent
  };

  // Enkel validering
  if (!data.namn || !data.epost || !data.foretag) {
    showMessage(message, 'Fyll i alla fält.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Skickar...';

  try {
    const params = new URLSearchParams();
    params.append('action', 'boka');
    params.append('namn', data.namn);
    params.append('epost', data.epost);
    params.append('foretag', data.foretag);
    params.append('kurs', data.kurs);

    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    showMessage(message, 'Tack! Din bokning är mottagen. Du får en bekräftelse via e-post.', 'success');
    form.reset();

    // Hämta aktuellt antal platser kvar (efter en kort fördröjning så kalkylarket hinner uppdateras)
    setTimeout(() => fetchSpotsLeft(data.kurs), 1500);

    setTimeout(() => {
      closeBooking();
      message.className = 'form-message';
    }, 3000);

  } catch (err) {
    console.error(err);
    showMessage(message, 'Något gick fel. Försök igen eller mejla oss direkt.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Skicka bokning';
  }
}

// ===== AVBOKNINGSFORMULÄR =====
async function submitCancellation(event) {
  event.preventDefault();

  const form = event.target;
  const message = document.getElementById('cancelMessage');
  const submitBtn = form.querySelector('button[type="submit"]');

  const kurs = document.getElementById('cancelKurs').value.trim();
  const epost = document.getElementById('cancelEpost').value.trim();
  const bekraftad = document.getElementById('cancelConfirm').checked;

  if (!kurs || !epost || !bekraftad) {
    showMessage(message, 'Fyll i alla fält och bekräfta avbokningen.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Avbokar...';

  try {
    const params = new URLSearchParams();
    params.append('action', 'avboka');
    params.append('kurs', kurs);
    params.append('epost', epost);

    // Inkludera ID om det finns i URL:en
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) params.append('id', id);

    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    showMessage(message, 'Din avbokning är registrerad. Du får en bekräftelse via e-post.', 'success');
    form.reset();

    setTimeout(() => {
      window.location.href = 'index.html';
    }, 3500);

  } catch (err) {
    console.error(err);
    showMessage(message, 'Något gick fel. Försök igen eller mejla oss direkt.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Avboka';
  }
}

// ===== HJÄLPFUNKTIONER =====
function showMessage(el, text, type) {
  if (!el) return;
  el.textContent = text;
  el.className = 'form-message ' + type;
}

// Uppdatera platsräknare på sidan
function updateSpotsLeft(count) {
  const el = document.getElementById('spotsLeft');
  if (el) el.textContent = count + ' platser kvar';
}

// Hämta aktuellt antal platser kvar från Apps Script
async function fetchSpotsLeft(kurs) {
  try {
    const url = APPS_SCRIPT_URL + '?kurs=' + encodeURIComponent(kurs);
    const res = await fetch(url);
    const json = await res.json();
    if (json.status === 'ok') {
      updateSpotsLeft(json.spotsLeft);
    }
  } catch (err) {
    console.error('Kunde inte hämta platser:', err);
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();

  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.addEventListener('click', toggleTheme);

  // Hämta aktuellt antal platser kvar vid sidladdning
  if (document.getElementById('spotsLeft')) {
    fetchSpotsLeft('Excel – Grundnivå');
  }
});