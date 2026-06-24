// ====== VERBINDING NAAR VR (WebSocket) ======
const statusEl = document.querySelector('#status');

// PAS DIT AAN: IP van je PC / VR-server
// bv: ws://192.168.0.10:8080
const WS_URL = 'ws://192.168.0.10:8080';

let socket = null;

function connectWS() {
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    statusEl.textContent = 'Status: verbonden met VR';
  };

  socket.onclose = () => {
    statusEl.textContent = 'Status: niet verbonden (probeer opnieuw...)';
    setTimeout(connectWS, 2000);
  };

  socket.onerror = () => {
    statusEl.textContent = 'Status: fout in verbinding';
  };
}

connectWS();

function sendAction(action) {
  const msg = JSON.stringify({ type: 'action', action });
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(msg);
    statusEl.textContent = 'Laatste actie: ' + action;
  } else {
    statusEl.textContent = 'Niet verbonden (actie niet verstuurd)';
  }
}

// ====== BUTTON UI ======
document.querySelectorAll('.btn').forEach(btn => {
  const handler = () => {
    const action = btn.getAttribute('data-action');
    sendAction(action);
  };
  btn.addEventListener('touchstart', handler);
  btn.addEventListener('click', handler);
});

// ====== TEACHABLE MACHINE ======
let tmModel = null;
let tmWebcam = null;
let tmLoopRunning = false;

// ZET HIER JOUW TM MODEL URL:
let MODEL_URL = ''; // bv: "https://teachablemachine.withgoogle.com/models/JOUW_MODEL/"

const loadModelBtn   = document.querySelector('#loadModelBtn');
const tmStatus       = document.querySelector('#tmStatus');
const modelUrlLabel  = document.querySelector('#modelUrlLabel');

loadModelBtn.addEventListener('click', async () => {
  if (!MODEL_URL) {
    alert('Stel eerst MODEL_URL in in controller.js');
    return;
  }

  try {
    const modelURL = MODEL_URL + 'model.json';
    const metadataURL = MODEL_URL + 'metadata.json';

    tmModel = await tmImage.load(modelURL, metadataURL);
    modelUrlLabel.textContent = MODEL_URL;

    const size = 200;
    tmWebcam = new tmImage.Webcam(size, size, true);
    await tmWebcam.setup();
    await tmWebcam.play();

    tmStatus.textContent = 'TM: actief (webcam draait)';
    tmLoopRunning = true;
    window.requestAnimationFrame(tmLoop);
  } catch (e) {
    console.error(e);
    tmStatus.textContent = 'TM: fout bij laden';
  }
});

async function tmLoop() {
  if (!tmLoopRunning || !tmModel || !tmWebcam) return;

  tmWebcam.update();
  const prediction = await tmModel.predict(tmWebcam.canvas);

  let best = null;
  prediction.forEach(p => {
    if (!best || p.probability > best.probability) best = p;
  });

  if (best && best.probability > 0.8) {
    mapTMClassToAction(best.className);
  }

  window.requestAnimationFrame(tmLoop);
}

function mapTMClassToAction(className) {
  switch (className) {
    case 'swing_down':
      sendAction('forward');
      break;
    case 'jump_pose':
      sendAction('jump');
      break;
    case 'climb_pose':
      sendAction('climb');
      break;
    case 'tag_pose':
      sendAction('tag');
      break;
    default:
      break;
  }
}
