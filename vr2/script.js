const browserApp     = document.querySelector('#browserApp');
const openBrowser    = document.querySelector('#openBrowser');
const browserClose   = document.querySelector('#browserClose');
const browserContent = document.querySelector('#browserContent');
const addressText    = document.querySelector('#addressText');
const keyboard       = document.querySelector('#keyboard');
const cameraRig      = document.querySelector('#cameraRig');

let scrollOffset = 0;

// Browser openen
openBrowser.addEventListener('click', () => {
  browserApp.setAttribute('visible', true);
  loadPage('https://example.com');
  buildKeyboard();
});

// Browser sluiten
browserClose.addEventListener('click', () => {
  browserApp.setAttribute('visible', false);
});

// -----------------------------
// MINI-BROWSER ENGINE
// -----------------------------

async function loadPage(url) {
  addressText.setAttribute('value', url);
  browserContent.innerHTML = '';
  scrollOffset = 0;

  try {
    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const items = extractContent(doc);
    renderContent(items);
  } catch (e) {
    showError('Kan pagina niet laden.');
  }
}

// Tekst + links + afbeeldingen uit HTML halen
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

// In VR renderen
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

      btn.addEventListener('click', () => loadPage(item.href));

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
// SCROLL MET KIJKRICHTING
// -----------------------------

cameraRig.addEventListener('componentchanged', e => {
  if (e.detail.name !== 'rotation') return;

  const pitch = e.detail.newData.x;

  if (pitch < -10) scrollOffset += 0.02;  // omhoog kijken → omhoog scrollen
  if (pitch > 10) scrollOffset -= 0.02;  // omlaag kijken → omlaag scrollen

  browserContent.setAttribute('position', `0 ${scrollOffset} 0.01`);
});

// -----------------------------
// VR-TOETSENBORD
// -----------------------------

function buildKeyboard() {
  keyboard.innerHTML = '';

  const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789./';
  let x = -1;
  let y = 0.4;

  keys.split('').forEach(char => {
    addKey(char, x, y);
    x += 0.25;
    if (x > 1) {
      x = -1;
      y -= 0.25;
    }
  });

  addKey('BACK', -0.5, -1.2);
  addKey('ENTER', 0.5, -1.2);
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

  key.addEventListener('click', () => pressKey(label));
}

function pressKey(label) {
  let current = addressText.getAttribute('value');

  if (label === 'BACK') {
    current = current.slice(0, -1);
  } else if (label === 'ENTER') {
    loadPage(current);
    return;
  } else {
    current += label.toLowerCase();
  }

  addressText.setAttribute('value', current);
}
