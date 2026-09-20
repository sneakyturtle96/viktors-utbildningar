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

  // Rensa platsinfo när modalen öppnas
  const spotsInfo = document.getElementById('spotsLeftForDate');
  if (spotsInfo) spotsInfo.textContent = '';

  const datumEl = document.getElementById('datum');
  if (datumEl) datumEl.value = '';
}

function closeBooking() {
  const overlay = document.getElementById('bookingModal');
  if (!overlay) return;

  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) {
    closeBooking();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeBooking();
});

// ===== KONFIGURATION =====
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbztX9oslpvj0grIKA9ujXvazJYI39T1EsZYR0F6g0MjS7XDWTMivP2GcWEcd8OpQsHZCg/exec';

// ===== DATUM-DROPDOWN =====
document.addEventListener('change', (e) => {
  if (e.target.id === 'datum') {
    const selected = e.target.options[e.target.selectedIndex];
    const kurs = document.getElementById('bookingCourseName').textContent;
    const datum = selected.value;
    const tid = selected.getAttribute('data-tid') || '';

    const spotsInfo = document.getElementById('spotsLeftForDate');

    if (!datum || !tid) {
      if (spotsInfo) spotsInfo.textContent = '';
      return;
    }

    if (spotsInfo) spotsInfo.textContent = 'Hämtar platser...';
    fetchSpotsLeftForDate(kurs, datum, tid);
  }
});

// ===== BOKNINGSFORMULÄR =====
async function submitBooking(event) {
  event.preventDefault();

  const form = event.target;
  const message = document.getElementById('formMessage');
  const submitBtn = form.querySelector('button[type="submit"]');

  const datumEl = document.getElementById('datum');
  const selectedOption = datumEl.options[datumEl.selectedIndex];
  const datum = datumEl.value.trim();
  const tid = selectedOption.getAttribute('data-tid') || '';

  const data = {
    namn: document.getElementById('namn').value.trim(),
    foretag: document.getElementById('foretag').value.trim(),
    epost: document.getElementById('epost').value.trim(),
    gatuadress: document.getElementById('gatuadress').value.trim(),
    postnummer: document.getElementById('postnummer').value.trim(),
    ort: document.getElementById('ort').value.trim(),
    kurs: document.getElementById('bookingCourseName').textContent,
    datum: datum,
    tid: tid
  };

  // Validering
  if (!data.namn || !data.foretag || !data.epost ||
      !data.gatuadress || !data.postnummer || !data.ort ||
      !data.datum || !data.tid) {
    showMessage(message, 'Fyll i alla fält inklusive datum.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Skickar...';

  try {
    const params = new URLSearchParams();
    params.append('action', 'boka');
    params.append('namn', data.namn);
    params.append('foretag', data.foretag);
    params.append('epost', data.epost);
    params.append('gatuadress', data.gatuadress);
    params.append('postnummer', data.postnummer);
    params.append('ort', data.ort);
    params.append('kurs', data.kurs);
    params.append('datum', data.datum);
    params.append('tid', data.tid);

    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    showMessage(message, 'Tack! Din bokning är mottagen. Du får en bekräftelse via e-post.', 'success');
    form.reset();

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

// Hämta platser kvar för ett specifikt tillfälle (datum + tid)
async function fetchSpotsLeftForDate(kurs, datum, tid) {
  try {
    const url = APPS_SCRIPT_URL +
      '?kurs=' + encodeURIComponent(kurs) +
      '&datum=' + encodeURIComponent(datum) +
      '&tid=' + encodeURIComponent(tid);
    const res = await fetch(url);
    const json = await res.json();

    const spotsInfo = document.getElementById('spotsLeftForDate');
    if (!spotsInfo) return;

    if (json.status === 'ok') {
      if (json.spotsLeft === 0) {
        spotsInfo.textContent = 'Fullbokat';
        spotsInfo.classList.add('full');
      } else {
        spotsInfo.textContent = json.spotsLeft + ' platser kvar';
        spotsInfo.classList.remove('full');
      }
    }
  } catch (err) {
    console.error('Kunde inte hämta platser:', err);
    const spotsInfo = document.getElementById('spotsLeftForDate');
    if (spotsInfo) spotsInfo.textContent = '';
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  updateThemeIcon();

  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.addEventListener('click', toggleTheme);
});
