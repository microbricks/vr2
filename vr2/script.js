// ELEMENTS
const handCursor = document.querySelector('#handCursor');
const cameraRig  = document.querySelector('#cameraRig');

// Browser
const openBrowser    = document.querySelector('#openBrowser');
const browserApp     = document.querySelector('#browserApp');
const browserClose   = document.querySelector('#browserClose');
const browserContent = document.querySelector('#browserContent');
const addressText    = document.querySelector('#addressText');
const keyboard       = document.querySelector('#keyboard');

// Clock
const openClock  = document.querySelector('#openClock');
const clockApp   = document.querySelector('#clockApp');
const clockText  = document.querySelector('#clockText');
const clockClose = document.querySelector('#clockClose');

// Notes
const openNotes      = document.querySelector('#openNotes');
const notesApp       = document.querySelector('#notesApp');
const notesText      = document.querySelector('#notesText');
const notesAdd       = document.querySelector('#notesAdd');
const notesClose     = document.querySelector('#notesClose');
const notesKeyboard  = document.querySelector('#notesKeyboard');

// Settings
const openSettings  = document.querySelector('#openSettings');
const settingsApp   = document.querySelector('#settingsApp');
const settingsClose = document.querySelector('#settingsClose');
const cursorSmall   = document.querySelector('#cursorSmall');
const cursorLarge   = document.querySelector('#cursorLarge');
const gazeFast      = document.querySelector('#gazeFast');
const gazeSlow      = document.querySelector('#gazeSlow');

// DOT PULSE
let pulseTimer = null;
function pulseCursor() {
  handCursor.setAttribute('radius', 0.06);
  clearTimeout(pulseTimer);
  pulseTimer = setTimeout(() => {
    handCursor.setAttribute('radius', 0.03);
  }, 150);
}

// -----------------------------
// BROWSER OPEN/CLOSE
// -----------------------------
openBrowser.addEventListener('click', () => {
  browserApp.setAttribute('visible', true);
  buildKeyboard();
  loadPage('https://example.com');
  pulseCursor();
});

browserClose.addEventListener('click', () => {
  browserApp.setAttribute('visible', false);
  pulseCursor();
});

// -----------------------------
// MINI BROWSER ENGINE
// -----------------------------
async function loadPage(url) {
  addressText.setAttribute('value', url);
  browserContent.innerHTML = '';

  try {
    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const items = extractContent(doc);
    renderContent(items);
  } catch {
    showError("Kan pagina niet laden");
  }
}

function extractContent(doc) {
  const items = [];
  doc.body.querySelectorAll('*').forEach(el => {
    if (el.tagName === 'IMG' && el.src) {
      items.push({ type: 'image', src: el.src });
    } else if (el.tagName === 'A' && el.href) {
      items.push({ type: 'link', text: el.innerText || el.href, href: el.href });
    } else if (el.innerText && el.innerText.trim().length > 0) {
      items.push({ type: 'text', text: el.innerText });
    }
  });
  return items.slice(0, 120);
}

function renderContent(items) {
  let y = 0;
  items.forEach(item => {
    if (item.type === 'text') {
      const t = document.createElement('a-text');
      t.setAttribute('value', item.text);
      t.setAttribute('wrap-count', 50);
      t.setAttribute('position', `-1 ${y} 0`);
      browserContent.appendChild(t);
      y -= 0.15;
    }
    if (item.type === 'link') {
      const btn = document.createElement('a-plane');
      btn.setAttribute('width', '2');
      btn.setAttribute('height', '0.15');
      btn.setAttribute('color', '#2a6df4');
      btn.setAttribute('position', `0 ${y} 0`);
      btn.setAttribute('class', 'clickable');

      const txt = document.createElement('a-text');
      txt.setAttribute('value', item.text);
      txt.setAttribute('position', '-0.95 0 0.01');
      txt.setAttribute('wrap-count', 60);

      btn.appendChild(txt);
      browserContent.appendChild(btn);

      btn.addEventListener('click', () => {
        loadPage(item.href);
        pulseCursor();
      });

      y -= 0.2;
    }
    if (item.type === 'image') {
      const img = document.createElement('a-image');
      img.setAttribute('src', item.src);
      img.setAttribute('width', '2');
      img.setAttribute('height', '1');
      img.setAttribute('position', `0 ${y} 0`);
      browserContent.appendChild(img);
      y -= 1.2;
    }
  });
}

function showError(msg) {
  const t = document.createElement('a-text');
  t.setAttribute('value', msg);
  t.setAttribute('color', 'red');
  t.setAttribute('position', '-1 0 0');
  browserContent.appendChild(t);
}

// -----------------------------
// VR KEYBOARD (BROWSER)
// -----------------------------
function buildKeyboard() {
  keyboard.innerHTML = '';

  const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./';
  let x = -1, y = 0.4;

  keys.split('').forEach(char => {
    addKey(char, x, y);
    x += 0.25;
    if (x > 1) { x = -1; y -= 0.25; }
  });

  addKey('BACK', -0.5, -0.2);
  addKey('ENTER', 0.5, -0.2);
}

function addKey(label, x, y) {
  const key = document.createElement('a-plane');
  key.setAttribute('width', '0.22');
  key.setAttribute('height', '0.22');
  key.setAttribute('color', '#444');
  key.setAttribute('position', `${x} ${y} 0`);
  key.setAttribute('class', 'clickable');

  const txt = document.createElement('a-text');
  txt.setAttribute('value', label);
  txt.setAttribute('align', 'center');
  txt.setAttribute('position', '-0.07 0 0.01');

  key.appendChild(txt);
  keyboard.appendChild(key);

  key.addEventListener('click', () => {
    pressKey(label);
    pulseCursor();
  });
}

function pressKey(label) {
  let current = addressText.getAttribute('value');

  if (label === 'BACK') {
    current = current.slice(0, -1);
  } else if (label === 'ENTER') {
    loadPage(current);
  } else {
    current += label.toLowerCase();
  }

  addressText.setAttribute('value', current);
}

// -----------------------------
// NOTES KEYBOARD
// -----------------------------
function buildNotesKeyboard() {
  notesKeyboard.innerHTML = '';

  const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./';
  let x = -1, y = 0.4;

  keys.split('').forEach(char => {
    addNotesKey(char, x, y);
    x += 0.25;
    if (x > 1) { x = -1; y -= 0.25; }
  });

  addNotesKey('BACK', -0.5, -0.2);
  addNotesKey('ENTER', 0.5, -0.2);
}

function addNotesKey(label, x, y) {
  const key = document.createElement('a-plane');
  key.setAttribute('width', '0.22');
  key.setAttribute('height', '0.22');
  key.setAttribute('color', '#444');
  key.setAttribute('position', `${x} ${y} 0`);
  key.setAttribute('class', 'clickable');

  const txt = document.createElement('a-text');
  txt.setAttribute('value', label);
  txt.setAttribute('align', 'center');
  txt.setAttribute('position', '-0.07 0 0.01');

  key.appendChild(txt);
  notesKeyboard.appendChild(key);

  key.addEventListener('click', () => {
    pressNotesKey(label);
    pulseCursor();
  });
}

function pressNotesKey(label) {
  let current = notesText.getAttribute('value');

  if (label === 'BACK') {
    current = current.slice(0, -1);
  } else if (label === 'ENTER') {
    current += "\n";
  } else {
    current += label.toLowerCase();
  }

  notesText.setAttribute('value', current);
}

// -----------------------------
// CLOCK APP
// -----------------------------
openClock.addEventListener('click', () => {
  clockApp.setAttribute('visible', true);
  pulseCursor();
});

clockClose.addEventListener('click', () => {
  clockApp.setAttribute('visible', false);
  pulseCursor();
});

setInterval(() => {
  clockText.setAttribute('value', new Date().toTimeString().split(' ')[0]);
}, 500);

// -----------------------------
// NOTES APP
// -----------------------------
openNotes.addEventListener('click', () => {
  notesApp.setAttribute('visible', true);
  buildNotesKeyboard();
  pulseCursor();
});

notesClose.addEventListener('click', () => {
  notesApp.setAttribute('visible', false);
  pulseCursor();
});

notesAdd.addEventListener('click', () => {
  notesText.setAttribute('value', notesText.getAttribute('value') + "\n- Nieuwe notitie");
  pulseCursor();
});

// -----------------------------
// SETTINGS APP
// -----------------------------
openSettings.addEventListener('click', () => {
  settingsApp.setAttribute('visible', true);
  pulseCursor();
});

settingsClose.addEventListener('click', () => {
  settingsApp.setAttribute('visible', false);
  pulseCursor();
});

// Cursor grootte
cursorSmall.addEventListener('click', () => {
  handCursor.setAttribute('radius', 0.02);
  pulseCursor();
});

cursorLarge.addEventListener('click', () => {
  handCursor.setAttribute('radius', 0.06);
  pulseCursor();
});

// Gaze snelheid
let gazeTime = 1000;

gazeFast.addEventListener('click', () => {
  gazeTime = 500;
  pulseCursor();
});

gazeSlow.addEventListener('click', () => {
  gazeTime = 1500;
  pulseCursor();
});

// -----------------------------
// GAZE CLICK
// -----------------------------
let gazeTarget = null;
let gazeStart = 0;

function updateGaze() {
  const origin = new THREE.Vector3();
  handCursor.object3D.getWorldPosition(origin);

  const direction = new THREE.Vector3(0, 0, -1);
  handCursor.object3D.getWorldDirection(direction);

  const raycaster = new THREE.Raycaster(origin, direction.normalize());

  const clickableEls = Array.from(document.querySelectorAll('.clickable'));
  const meshes = clickableEls.map(el => el.object3D);

  const hits = raycaster.intersectObjects(meshes, true);

  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj && !obj.el) obj = obj.parent;
    const el = obj?.el;

    if (!el) {
      gazeTarget = null;
      return requestAnimationFrame(updateGaze);
    }

    if (el !== gazeTarget) {
      gazeTarget = el;
      gazeStart = performance.now();
    }

    if (performance.now() - gazeStart > gazeTime) {
      el.emit('click');
      pulseCursor();
      gazeStart = performance.now() + 999999;
    }

  } else {
    gazeTarget = null;
  }

  requestAnimationFrame(updateGaze);
}

updateGaze();
